const prisma = require('../db/prisma');

// 1. Lấy thông tin giỏ hàng
const getCart = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);

    if (!userId) {
      return res.status(401).json({ error: { message: 'Phiên đăng nhập không hợp lệ.' } });
    }

    // Tìm giỏ hàng
    let cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sort_order: 'asc' } },
                    variants: true,
                  },
                },
              },
            },
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    // Nếu chưa có giỏ hàng thì tự động tạo mới
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
        include: { items: [] },
      });
    }

    const formattedItems = (cart.items || []).map((item) => {
      const variant = item.variant;
      const product = variant?.product;
      const price = Number(variant?.price || product?.base_price || 0);
      const originalPrice = Math.round(price * 1.25 / 1000) * 1000;

      return {
        id: item.id,
        cart_id: item.cart_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        size: variant?.size,
        color: variant?.color,
        stock: variant?.stock,
        price: price,
        original_price: originalPrice,
        total_item_price: price * item.quantity,
        product_name: product?.name,
        product_slug: product?.slug,
        image_url:
          product?.images?.[0]?.url ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        available_variants: (product?.variants || []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          price: Number(v.price),
          stock: v.stock,
        })),
      };
    });

    const totalAmount = formattedItems.reduce((sum, item) => sum + item.total_item_price, 0);
    const totalCount = formattedItems.reduce((sum, item) => sum + item.quantity, 0);

    return res.status(200).json({
      cart_id: cart.id,
      items: formattedItems,
      total_amount: totalAmount,
      total_count: totalCount,
    });
  } catch (err) {
    console.error('Lỗi getCart:', err);
    return res.status(500).json({ error: { message: err.message || 'Lỗi lấy giỏ hàng' } });
  }
};

// 2. Thêm món vào giỏ hàng
const addItemToCart = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);
    const variantId = parseInt(req.body.variantId || req.body.variant_id);
    const quantity = parseInt(req.body.quantity) || 1;

    if (!variantId) {
      return res.status(400).json({ error: { message: 'Vui lòng chọn size/màu sản phẩm.' } });
    }

    // Kiểm tra variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return res.status(404).json({ error: { message: 'Biến thể sản phẩm không tồn tại.' } });
    }

    if (variant.stock <= 0) {
      return res.status(400).json({ error: { message: 'Sản phẩm kích cỡ này đã hết hàng.' } });
    }

    // Tìm hoặc tạo Cart cho user
    let cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { user_id: userId } });
    }

    // Dùng findFirst để tránh xung đột tên compound index của Prisma
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        variant_id: variantId,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > variant.stock) {
        return res.status(400).json({
          error: { message: `Kho chỉ còn tối đa ${variant.stock} sản phẩm.` },
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      if (quantity > variant.stock) {
        return res.status(400).json({
          error: { message: `Kho chỉ còn tối đa ${variant.stock} sản phẩm.` },
        });
      }

      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          variant_id: variantId,
          quantity: quantity,
        },
      });
    }

    return res.status(200).json({ message: 'Đã thêm vào giỏ hàng thành công!' });
  } catch (err) {
    console.error('Lỗi addItemToCart:', err);
    return res.status(500).json({ error: { message: err.message || 'Lỗi thêm sản phẩm' } });
  }
};

// 3. Cập nhật số lượng
const updateItemQuantity = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);
    const itemId = parseInt(req.params.id);
    const quantity = parseInt(req.body.quantity);

    if (quantity <= 0) {
      return deleteCartItem(req, res);
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, variant: true },
    });

    if (!item || item.cart.user_id !== userId) {
      return res.status(404).json({ error: { message: 'Món hàng không tồn tại.' } });
    }

    if (quantity > item.variant.stock) {
      return res.status(400).json({
        error: { message: `Kho chỉ còn ${item.variant.stock} sản phẩm.` },
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return res.status(200).json({ message: 'Đã cập nhật số lượng.' });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Lỗi cập nhật giỏ hàng.' } });
  }
};

// 4. Xóa món khỏi giỏ
const deleteCartItem = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);
    const itemId = parseInt(req.params.id);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.user_id !== userId) {
      return res.status(404).json({ error: { message: 'Món hàng không hợp lệ.' } });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return res.status(200).json({ message: 'Đã xóa món khỏi giỏ hàng.' });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Lỗi xóa mục giỏ hàng.' } });
  }
};

// 5. Đổi variant (size/màu)
const changeItemVariant = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);
    const itemId = parseInt(req.params.id);
    const newVariantId = parseInt(req.body.variantId || req.body.variant_id);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.user_id !== userId) {
      return res.status(404).json({ error: { message: 'Món hàng không hợp lệ.' } });
    }

    const newVariant = await prisma.productVariant.findUnique({
      where: { id: newVariantId },
    });

    if (!newVariant) {
      return res.status(404).json({ error: { message: 'Biến thể mới không tồn tại.' } });
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        cart_id: item.cart_id,
        variant_id: newVariantId,
        id: { not: itemId },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { variant_id: newVariantId },
      });
    }

    return res.status(200).json({ message: 'Đã cập nhật phân loại sản phẩm.' });
  } catch (err) {
    console.error('Lỗi changeItemVariant:', err);
    return res.status(500).json({ error: { message: 'Không thể đổi phân loại sản phẩm.' } });
  }
};

// 6. Xóa tất cả món khỏi giỏ
const clearCart = async (req, res) => {
  try {
    const rawUserId = req.user.id || req.user.userId;
    const userId = parseInt(rawUserId);

    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
    }

    return res.status(200).json({ message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng.' });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Lỗi xóa tất cả món hàng.' } });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  deleteCartItem,
  changeItemVariant,
  clearCart,
};
