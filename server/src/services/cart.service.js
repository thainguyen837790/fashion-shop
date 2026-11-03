const prisma = require('../db/prisma');

const getCartByUserId = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { take: 1, orderBy: { sort_order: 'asc' } },
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { user_id: userId },
      include: { items: true },
    });
  }

  return cart;
};

const addItemToCart = async (userId, variantId, quantity) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
  });

  if (!variant) {
    const err = new Error('Biến thể sản phẩm không tồn tại');
    err.status = 404;
    throw err;
  }

  if (variant.stock < quantity) {
    const err = new Error('Số lượng sản phẩm trong kho không đủ');
    err.status = 400;
    throw err;
  }

  let cart = await prisma.cart.findUnique({ where: { user_id: userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { user_id: userId } });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cart_id_variant_id: {
        cart_id: cart.id,
        variant_id: parseInt(variantId),
      },
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + parseInt(quantity);
    if (variant.stock < newQuantity) {
      const err = new Error('Số lượng vượt quá số lượng tồn kho');
      err.status = 400;
      throw err;
    }
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  }

  return prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      variant_id: parseInt(variantId),
      quantity: parseInt(quantity),
    },
  });
};

const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: parseInt(itemId) },
    include: { cart: true, variant: true },
  });

  if (!item || item.cart.user_id !== userId) {
    const err = new Error('Mặt hàng không tồn tại trong giỏ');
    err.status = 404;
    throw err;
  }

  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: parseInt(itemId) } });
  }

  if (item.variant.stock < quantity) {
    const err = new Error('Số lượng vượt quá số lượng tồn kho');
    err.status = 400;
    throw err;
  }

  return prisma.cartItem.update({
    where: { id: parseInt(itemId) },
    data: { quantity: parseInt(quantity) },
  });
};

const removeCartItem = async (userId, itemId) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: parseInt(itemId) },
    include: { cart: true },
  });

  if (!item || item.cart.user_id !== userId) {
    const err = new Error('Mặt hàng không tồn tại trong giỏ');
    err.status = 404;
    throw err;
  }

  return prisma.cartItem.delete({ where: { id: parseInt(itemId) } });
};

module.exports = {
  getCartByUserId,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
};