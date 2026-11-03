const prisma = require('../db/prisma');

// Helper tạo slug tiếng Việt chuẩn
const createSlug = (str) => {
  if (!str) return 'san-pham-' + Date.now();
  let slug = str.toLowerCase().trim();
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  slug = slug.replace(/[đĐ]/g, 'd');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/[\s-]+/g, '-');
  return slug + '-' + Math.floor(1000 + Math.random() * 9000);
};

// ==========================================
// 1. THỐNG KÊ TỔNG QUAN DASHBOARD
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalOrders, totalCategories, totalReviews, pendingOrders] =
      await Promise.all([
        prisma.product.count({ where: { is_active: true } }),
        prisma.user.count(),
        prisma.order.count().catch(() => 0),
        prisma.category.count(),
        prisma.review.count().catch(() => 0),
        prisma.order.count({ where: { status: 'pending' } }).catch(() => 0),
      ]);

    const stockAgg = await prisma.productVariant.aggregate({
      _sum: { stock: true },
    });

    const revenueAgg = await prisma.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _sum: { total_amount: true },
    }).catch(() => ({ _sum: { total_amount: 0 } }));

    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        items: true,
      },
    }).catch(() => []);

    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, full_name: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }).catch(() => []);

    // Phân bố sentiment
    const [positiveCount, negativeCount] = await Promise.all([
      prisma.review.count({ where: { sentiment_label: 'positive' } }).catch(() => 0),
      prisma.review.count({ where: { sentiment_label: 'negative' } }).catch(() => 0),
    ]);

    return res.status(200).json({
      totalProducts,
      totalUsers,
      totalOrders: totalOrders || 0,
      totalStock: stockAgg._sum.stock || 0,
      totalCategories,
      totalReviews: totalReviews || 0,
      pendingOrders: pendingOrders || 0,
      totalRevenue: Number(revenueAgg._sum?.total_amount || 0),
      recentOrders,
      recentReviews,
      sentimentStats: {
        positive: positiveCount,
        negative: negativeCount,
      },
    });
  } catch (err) {
    console.error('Lỗi getDashboardStats:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy số liệu thống kê.' } });
  }
};

// ==========================================
// 2. QUẢN LÝ SẢN PHẨM (PRODUCTS)
// ==========================================
const getProductsAdmin = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { sort_order: 'asc' } },
        variants: { orderBy: { id: 'asc' } },
      },
      orderBy: { id: 'desc' },
    });

    const formatted = products.map((p) => {
      const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean)));
      const sizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean)));
      const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      return {
        ...p,
        price: Number(p.base_price || 0),
        colors,
        sizes,
        total_stock: totalStock,
        primary_image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      };
    });

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Lỗi getProductsAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi tải danh sách sản phẩm' } });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ error: { message: 'Lỗi lấy danh mục' } });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      base_price,
      description,
      category_id,
      images = [],
      variants = [],
      image_url,
    } = req.body;

    if (!name || !base_price || !category_id) {
      return res.status(400).json({ error: { message: 'Vui lòng nhập tên, giá bán và danh mục sản phẩm.' } });
    }

    const uniqueSlug = slug ? slug.trim() : createSlug(name);

    let preparedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      preparedImages = images
        .filter((img) => img && img.url && img.url.trim())
        .map((img, idx) => ({
          url: img.url.trim(),
          color: img.color ? img.color.trim() : null,
          sort_order: typeof img.sort_order === 'number' ? img.sort_order : idx,
        }));
    } else if (image_url && image_url.trim()) {
      preparedImages = [{ url: image_url.trim(), color: null, sort_order: 0 }];
    }

    let finalBasePrice = parseFloat(base_price) || 0;
    if (finalBasePrice > 0 && finalBasePrice < 1000) {
      finalBasePrice = finalBasePrice * 1000;
    }

    const timeSalt = Date.now().toString().slice(-5);
    let preparedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      preparedVariants = variants.map((v, idx) => {
        const colorName = v.color ? v.color.trim() : 'Tiêu chuẩn';
        const sizeName = v.size ? v.size.trim().toUpperCase() : 'FREESIZE';
        const rawVPrice = parseFloat(v.price) || finalBasePrice;
        const priceVal = rawVPrice > 0 && rawVPrice < 1000 ? rawVPrice * 1000 : (rawVPrice || finalBasePrice);
        const stockVal = parseInt(v.stock) >= 0 ? parseInt(v.stock) : 20;
        const rawSku = v.sku ? v.sku.trim() : `SKU-${colorName.slice(0, 3).toUpperCase()}-${sizeName}`;
        const skuVal = `${rawSku}-${timeSalt}-${idx + 1}`;

        return {
          color: colorName,
          size: sizeName,
          price: priceVal,
          stock: stockVal,
          sku: skuVal,
        };
      });
    } else {
      preparedVariants = [
        { color: 'Đen', size: 'M', price: finalBasePrice, stock: 25, sku: `SKU-BLK-M-${timeSalt}-1` },
        { color: 'Đen', size: 'L', price: finalBasePrice, stock: 25, sku: `SKU-BLK-L-${timeSalt}-2` },
        { color: 'Đen', size: 'XL', price: finalBasePrice, stock: 25, sku: `SKU-BLK-XL-${timeSalt}-3` },
      ];
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        base_price: finalBasePrice,
        description: description ? description.trim() : '',
        category_id: parseInt(category_id),
        is_active: true,
        images: preparedImages.length > 0 ? { create: preparedImages } : undefined,
        variants: { create: preparedVariants },
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return res.status(201).json({
      message: 'Tạo sản phẩm và gán màu sắc thành công!',
      product: newProduct,
    });
  } catch (err) {
    console.error('Lỗi createProduct:', err);
    return res.status(500).json({ error: { message: err.message || 'Lỗi thêm sản phẩm' } });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, base_price, description, category_id, images = [], variants = [] } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Không tìm thấy sản phẩm' } });
    }

    let finalBasePrice = base_price ? parseFloat(base_price) : undefined;
    if (finalBasePrice && finalBasePrice > 0 && finalBasePrice < 1000) {
      finalBasePrice = finalBasePrice * 1000;
    }
    const currentBasePrice = finalBasePrice || parseFloat(existing.base_price);

    await prisma.product.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        base_price: finalBasePrice,
        description: description !== undefined ? description.trim() : undefined,
        category_id: category_id ? parseInt(category_id) : undefined,
      },
    });

    if (Array.isArray(images) && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { product_id: id } });
      await prisma.productImage.createMany({
        data: images
          .filter((img) => img && img.url)
          .map((img, idx) => ({
            product_id: id,
            url: img.url.trim(),
            color: img.color ? img.color.trim() : null,
            sort_order: typeof img.sort_order === 'number' ? img.sort_order : idx,
          })),
      });
    }

    if (Array.isArray(variants) && variants.length > 0) {
      const timeSalt = Date.now().toString().slice(-5);
      await prisma.cartItem.deleteMany({ where: { variant: { product_id: id } } });
      await prisma.productVariant.deleteMany({ where: { product_id: id } });
      await prisma.productVariant.createMany({
        data: variants.map((v, idx) => {
          const rawSku = v.sku ? v.sku.trim() : `SKU-${id}-${idx + 1}`;
          const rawVPrice = parseFloat(v.price) || currentBasePrice;
          const vPrice = rawVPrice > 0 && rawVPrice < 1000 ? rawVPrice * 1000 : (rawVPrice || currentBasePrice);
          return {
            product_id: id,
            color: v.color ? v.color.trim() : 'Tiêu chuẩn',
            size: v.size ? v.size.trim().toUpperCase() : 'FREESIZE',
            price: vPrice,
            stock: parseInt(v.stock) >= 0 ? parseInt(v.stock) : 20,
            sku: `${rawSku}-${timeSalt}-${idx}`,
          };
        }),
      });
    } else if (finalBasePrice && finalBasePrice !== parseFloat(existing.base_price)) {
      await prisma.productVariant.updateMany({
        where: { product_id: id },
        data: { price: finalBasePrice },
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, variants: true },
    });

    return res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', product: updated });
  } catch (err) {
    console.error('Lỗi updateProduct:', err);
    return res.status(500).json({ error: { message: err.message || 'Lỗi cập nhật sản phẩm' } });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.cartItem.deleteMany({ where: { variant: { product_id: id } } });
    await prisma.reviewAspect.deleteMany({ where: { review: { product_id: id } } });
    await prisma.review.deleteMany({ where: { product_id: id } });
    await prisma.productVariant.deleteMany({ where: { product_id: id } });
    await prisma.productImage.deleteMany({ where: { product_id: id } });
    await prisma.product.delete({ where: { id } });

    return res.status(200).json({ message: 'Đã xóa sản phẩm thành công!' });
  } catch (err) {
    console.error('Lỗi deleteProduct:', err);
    return res.status(500).json({ error: { message: 'Không thể xóa sản phẩm.' } });
  }
};

const deleteAllProducts = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.reviewAspect.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productVariant.deleteMany({});
    const deleted = await prisma.product.deleteMany({});

    return res.status(200).json({
      message: `Đã xóa thành công toàn bộ ${deleted.count} sản phẩm!`,
      count: deleted.count,
    });
  } catch (err) {
    console.error('Lỗi deleteAllProducts:', err);
    return res.status(500).json({ error: { message: 'Không thể xóa tất cả sản phẩm.' } });
  }
};

const seedSampleProducts = async (req, res) => {
  try {
    let underwearCat = await prisma.category.findFirst({ where: { slug: 'phu-kien' } });
    let poloCat = await prisma.category.findFirst({ where: { slug: 'ao-thun' } });
    let shortsCat = await prisma.category.findFirst({ where: { slug: 'quan-nam' } });
    let sportCat = await prisma.category.findFirst({ where: { slug: 'the-thao' } });

    if (!underwearCat) underwearCat = await prisma.category.findFirst();

    const uid = Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    const sampleData = [
      {
        name: 'Combo 3 Quần Lót Nam Trunk Lenzing Modal',
        slug: `combo-3-quan-lot-nam-trunk-lenzing-modal-${uid}`,
        base_price: 199000,
        category_id: underwearCat?.id || 15,
        description: 'Chất liệu sợi gỗ sồi Lenzing Modal tự nhiên siêu mềm mịn, kháng khuẩn vượt trội, cạp chun êm ái không hằn vết.',
        images: [
          { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-den.jpg', color: 'Đen', sort_order: 0 },
          { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-xam.jpg', color: 'Xám', sort_order: 1 },
          { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-navy.jpg', color: 'Xanh Navy', sort_order: 2 },
        ],
        variants: [
          { color: 'Đen', size: 'M', price: 199000, stock: 35, sku: `MODAL-BLK-M-${uid}` },
          { color: 'Đen', size: 'L', price: 199000, stock: 40, sku: `MODAL-BLK-L-${uid}` },
          { color: 'Đen', size: 'XL', price: 199000, stock: 45, sku: `MODAL-BLK-XL-${uid}` },
          { color: 'Đen', size: '2XL', price: 199000, stock: 30, sku: `MODAL-BLK-2XL-${uid}` },
          { color: 'Xám', size: 'M', price: 199000, stock: 25, sku: `MODAL-GRY-M-${uid}` },
          { color: 'Xám', size: 'L', price: 199000, stock: 30, sku: `MODAL-GRY-L-${uid}` },
          { color: 'Xanh Navy', size: 'M', price: 199000, stock: 30, sku: `MODAL-NVY-M-${uid}` },
          { color: 'Xanh Navy', size: 'L', price: 199000, stock: 35, sku: `MODAL-NVY-L-${uid}` },
        ],
      },
      {
        name: 'Áo Polo Nam Thể Thao Promax-S1 Thoáng Khí',
        slug: `ao-polo-nam-the-thao-promax-s1-${uid}`,
        base_price: 239000,
        category_id: poloCat?.id || underwearCat?.id || 16,
        description: 'Vải dệt kim Promax thấm hút mồ hôi cực nhanh, chống nhăn, kiểu dáng Regular Fit khỏe khoắn.',
        images: [
          { url: 'https://n7media.coolmate.me/uploads/2026/08/25/polo-the-thao-nam-promax-s1-trang_7.jpg', color: 'Trắng', sort_order: 0 },
          { url: 'https://n7media.coolmate.me/uploads/2026/06/19/polo-the-thao-nam-quick-dry-active-xam-xanh_2.jpg', color: 'Xanh Navy', sort_order: 1 },
        ],
        variants: [
          { color: 'Trắng', size: 'M', price: 239000, stock: 30, sku: `POLO-WHT-M-${uid}` },
          { color: 'Trắng', size: 'L', price: 239000, stock: 35, sku: `POLO-WHT-L-${uid}` },
          { color: 'Xanh Navy', size: 'M', price: 239000, stock: 25, sku: `POLO-NVY-M-${uid}` },
          { color: 'Xanh Navy', size: 'L', price: 239000, stock: 30, sku: `POLO-NVY-L-${uid}` },
        ],
      },
    ];

    for (const p of sampleData) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          base_price: p.base_price,
          description: p.description,
          category_id: p.category_id,
          is_active: true,
          images: { create: p.images },
          variants: { create: p.variants },
        },
      });
    }

    return res.status(201).json({ message: 'Đã nạp thành công các sản phẩm mẫu chuẩn!' });
  } catch (err) {
    console.error('Lỗi seedSampleProducts:', err);
    return res.status(500).json({ error: { message: err.message || 'Lỗi nạp sản phẩm mẫu' } });
  }
};

// ==========================================
// 3. QUẢN LÝ ĐƠN HÀNG (ORDERS & APPROVAL)
// ==========================================
const getOrdersAdmin = async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (q && q.trim()) {
      const kw = q.trim();
      const numId = parseInt(kw.replace(/[^0-9]/g, ''));
      const orConditions = [
        { receiver_name: { contains: kw, mode: 'insensitive' } },
        { phone: { contains: kw } },
        { city: { contains: kw, mode: 'insensitive' } },
        { user: { email: { contains: kw, mode: 'insensitive' } } },
      ];
      if (!isNaN(numId)) {
        orConditions.push({ id: numId });
      }
      where.OR = orConditions;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true } },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { sort_order: 'asc' } } },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json(orders);
  } catch (err) {
    console.error('Lỗi getOrdersAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy danh sách đơn hàng.' } });
  }
};

const updateOrderStatusAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, payment_status } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    if (status === 'delivered') {
      updateData.payment_status = 'paid';
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        items: true,
      },
    });

    return res.status(200).json({
      message: 'Cập nhật trạng thái đơn hàng thành công!',
      order: updated,
    });
  } catch (err) {
    console.error('Lỗi updateOrderStatusAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi cập nhật đơn hàng.' } });
  }
};

// ==========================================
// 4. QUẢN LÝ NGƯỜI DÙNG (USERS)
// ==========================================
const getUsersAdmin = async (req, res) => {
  try {
    const { q, role } = req.query;
    const where = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (q && q.trim()) {
      const kw = q.trim();
      where.OR = [
        { full_name: { contains: kw, mode: 'insensitive' } },
        { email: { contains: kw, mode: 'insensitive' } },
        { phone: { contains: kw } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        gender: true,
        role: true,
        thai_cash: true,
        created_at: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return res.status(200).json(users);
  } catch (err) {
    console.error('Lỗi getUsersAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy danh sách người dùng.' } });
  }
};

const updateUserRoleAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: { message: 'Vai trò không hợp lệ.' } });
    }

    if (req.user.id === id && role !== 'admin') {
      return res.status(400).json({ error: { message: 'Không thể tự hủy quyền Admin của chính mình.' } });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, full_name: true, email: true, role: true },
    });

    return res.status(200).json({
      message: 'Cập nhật vai trò người dùng thành công!',
      user: updated,
    });
  } catch (err) {
    console.error('Lỗi updateUserRoleAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi cập nhật vai trò người dùng.' } });
  }
};

// ==========================================
// 5. QUẢN LÝ BÌNH LUẬN & ĐÁNH GIÁ (REVIEWS)
// ==========================================
const getReviewsAdmin = async (req, res) => {
  try {
    const { sentiment, rating, q } = req.query;
    const where = {};
    if (sentiment && sentiment !== 'all') {
      where.sentiment_label = sentiment;
    }
    if (rating && !isNaN(Number(rating)) && Number(rating) > 0) {
      where.rating = Number(rating);
    }
    if (q && q.trim()) {
      const kw = q.trim();
      where.OR = [
        { content: { contains: kw, mode: 'insensitive' } },
        { product: { name: { contains: kw, mode: 'insensitive' } } },
        { user: { full_name: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1, orderBy: { sort_order: 'asc' } },
          },
        },
        aspects: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json(reviews);
  } catch (err) {
    console.error('Lỗi getReviewsAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy danh sách đánh giá.' } });
  }
};

const getProductReviewStatsAdmin = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: { message: 'Mã sản phẩm không hợp lệ.' } });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        images: { take: 1, orderBy: { sort_order: 'asc' }, select: { url: true } },
      },
    });
    if (!product) {
      return res.status(404).json({ error: { message: 'Không tìm thấy sản phẩm.' } });
    }

    const [totalReviews, sentimentGroups, reviews] = await Promise.all([
      prisma.review.count({ where: { product_id: productId } }),
      prisma.review.groupBy({
        by: ['sentiment_label'],
        where: { product_id: productId },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { product_id: productId },
        take: 100,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, full_name: true } } },
      }),
    ]);

    const sentimentStats = { positive: 0, negative: 0 };
    sentimentGroups.forEach((group) => {
      if (group.sentiment_label in sentimentStats) {
        sentimentStats[group.sentiment_label] = group._count._all;
      }
    });

    return res.status(200).json({ product, totalReviews, sentimentStats, reviews });
  } catch (err) {
    console.error('Lỗi getProductReviewStatsAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy thống kê đánh giá sản phẩm.' } });
  }
};

const getReviewProductStatsAdmin = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { reviews: { some: {} } },
      select: {
        id: true,
        name: true,
        slug: true,
        images: { take: 1, orderBy: { sort_order: 'asc' }, select: { url: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { name: 'asc' },
    });
    const sentimentGroups = await prisma.review.groupBy({
      by: ['product_id', 'sentiment_label'],
      _count: { _all: true },
    });
    const countsByProduct = new Map();
    sentimentGroups.forEach(({ product_id, sentiment_label, _count }) => {
      if (!countsByProduct.has(product_id)) countsByProduct.set(product_id, { positive: 0, negative: 0 });
      if (sentiment_label === 'positive' || sentiment_label === 'negative') {
        countsByProduct.get(product_id)[sentiment_label] = _count._all;
      }
    });

    const rows = products.map((product) => ({
      ...product,
      reviewCount: product._count.reviews,
      sentimentStats: countsByProduct.get(product.id) || { positive: 0, negative: 0 },
    }));
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Lỗi getReviewProductStatsAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi lấy thống kê cảm xúc theo sản phẩm.' } });
  }
};

const toggleReviewVisibilityAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Không tìm thấy đánh giá.' } });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { is_hidden: !existing.is_hidden },
    });

    return res.status(200).json({
      message: updated.is_hidden ? 'Đã ẩn đánh giá khỏi trang sản phẩm.' : 'Đã hiển thị lại đánh giá.',
      review: updated,
    });
  } catch (err) {
    console.error('Lỗi toggleReviewVisibilityAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi cập nhật hiển thị đánh giá.' } });
  }
};

const deleteReviewAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.reviewAspect.deleteMany({ where: { review_id: id } });
    await prisma.review.delete({ where: { id } });
    return res.status(200).json({ message: 'Đã xóa đánh giá thành công!' });
  } catch (err) {
    console.error('Lỗi deleteReviewAdmin:', err);
    return res.status(500).json({ error: { message: 'Lỗi xóa đánh giá.' } });
  }
};

module.exports = {
  getDashboardStats,
  getProductsAdmin,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  seedSampleProducts,
  // Đơn hàng
  getOrdersAdmin,
  updateOrderStatusAdmin,
  // Người dùng
  getUsersAdmin,
  updateUserRoleAdmin,
  // Đánh giá
  getReviewsAdmin,
  getProductReviewStatsAdmin,
  getReviewProductStatsAdmin,
  toggleReviewVisibilityAdmin,
  deleteReviewAdmin,
};
