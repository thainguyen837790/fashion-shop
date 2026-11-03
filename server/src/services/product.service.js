const prisma = require('../db/prisma');

// Lấy danh sách sản phẩm (có lọc theo danh mục, từ khóa, khoảng giá, phân trang)
const getProducts = async (filters = {}) => {
  const { category, q, minPrice, maxPrice, size, color, sort, page = 1, limit = 12 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = { is_active: true };

  if (category) {
    where.category = { slug: category };
  }

  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }

  if (minPrice || maxPrice) {
    where.base_price = {};
    if (minPrice) where.base_price.gte = parseFloat(minPrice);
    if (maxPrice) where.base_price.lte = parseFloat(maxPrice);
  }

  if (size || color) {
    where.variants = {
      some: {
        ...(size && { size }),
        ...(color && { color }),
      },
    };
  }

  let orderBy = { created_at: 'desc' };
  if (sort === 'price_asc') orderBy = { base_price: 'asc' };
  if (sort === 'price_desc') orderBy = { base_price: 'desc' };

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sort_order: 'asc' } },
        variants: {
          select: { id: true, size: true, color: true, sku: true, price: true, stock: true },
          orderBy: { id: 'asc' },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page: parseInt(page),
    limit: take,
    totalPages: Math.ceil(total / take),
  };
};

// Lấy chi tiết sản phẩm theo slug kèm danh mục, ảnh và toàn bộ biến thể
const getProductBySlug = async (slug) => {
  const product = await prisma.product.findFirst({
    where: {
      slug: slug,
      is_active: true,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: { sort_order: 'asc' },
      },
      variants: {
        select: { id: true, size: true, color: true, sku: true, price: true, stock: true },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!product) {
    const error = new Error('Không tìm thấy sản phẩm');
    error.status = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  return product;
};

module.exports = {
  getProducts,
  getProductBySlug,
};