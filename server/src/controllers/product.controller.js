const prisma = require('../db/prisma');

// Nhóm danh mục mở rộng cho Navbar
const CATEGORY_GROUPS = {
  // Áo nam
  'ao-nam': ['ao-thun', 'ao-khoac', 'ao-dai-tay', 'ao-so-mi', 'ao-tanktop'],
  // Quần nam
  'quan-nam': ['quan-nam', 'quan-short', 'quan-kaki', 'quan-jogger'],
  // Áo nữ
  'ao-nu': ['ao-khoac-nu', 'ao-dai-tay-nu', 'ao-thun-nu'],
  // Quần & váy nữ
  'quan-nu': ['jogger-nu', 'legging-nu', 'shorts-nu', 'vay-dam'],
  // Thể thao chung
  'the-thao': [
    'chay-bo-nam', 'bong-da-nam', 'cau-long-nam', 'gym-nam', 'pickleball-nam', 'boi-loi-nam', 'the-thao-da-nang-nam',
    'gym-nu', 'cau-long-nu', 'pickleball-nu', 'chay-bo-nu', 'yoga-pilates-nu', 'the-thao-da-nang-nu', 'the-thao-nam', 'the-thao-nu'
  ],
  // Thể thao nam
  'the-thao-nam': ['chay-bo-nam', 'bong-da-nam', 'cau-long-nam', 'gym-nam', 'pickleball-nam', 'boi-loi-nam', 'the-thao-da-nang-nam'],
  // Thể thao nữ
  'the-thao-nu': ['gym-nu', 'cau-long-nu', 'pickleball-nu', 'chay-bo-nu', 'yoga-pilates-nu', 'the-thao-da-nang-nu'],
  // Thu đông
  'thu-dong': ['ao-khoac', 'ao-khoac-nu', 'ao-dai-tay', 'ao-dai-tay-nu', 'thu-dong'],
  // Phụ kiện
  'phu-kien': ['phu-kien'],
};

// Phân loại danh mục theo giới tính
const GENDER_CATEGORIES = {
  nam: [
    'ao-thun', 'ao-khoac', 'ao-dai-tay', 'ao-so-mi', 'ao-tanktop',
    'quan-nam', 'quan-short', 'quan-kaki', 'quan-jogger',
    'chay-bo-nam', 'bong-da-nam', 'cau-long-nam', 'gym-nam', 'pickleball-nam', 'boi-loi-nam', 'the-thao-da-nang-nam',
    'the-thao-nam'
  ],
  nu: [
    'ao-khoac-nu', 'ao-dai-tay-nu', 'ao-thun-nu',
    'jogger-nu', 'legging-nu', 'shorts-nu', 'vay-dam',
    'gym-nu', 'cau-long-nu', 'pickleball-nu', 'chay-bo-nu', 'yoga-pilates-nu', 'the-thao-da-nang-nu',
    'the-thao-nu', 'ao-nu', 'quan-nu'
  ]
};

// Phân loại theo nhu cầu (occasion)
const OCCASION_CATEGORIES = {
  'hang-ngay': ['ao-thun', 'ao-thun-nu', 'ao-so-mi', 'quan-kaki', 'quan-nam', 'jogger-nu'],
  'o-nha': ['quan-short', 'shorts-nu', 'ao-thun', 'ao-dai-tay'],
  'the-thao': [
    'chay-bo-nam', 'bong-da-nam', 'cau-long-nam', 'gym-nam', 'gym-nu', 'cau-long-nu', 'pickleball-nu', 'quan-jogger', 'legging-nu'
  ]
};

// Từ điển ánh xạ từ khóa không dấu -> từ khóa tiếng Việt có dấu
const KEYWORD_SYNONYMS = {
  'khoac': ['khoác', 'jacket', 'windbreaker', 'cardigan', 'hoodie'],
  'khoac nu': ['khoác', 'jacket', 'hoodie', 'cardigan'],
  'dai tay': ['dài tay', 'sweater', 'hoodie', 'len'],
  'dai tay nu': ['dài tay', 'sơ mi', 'sweater'],
  'thun': ['thun', 'tshirt', 't-shirt', 'tee'],
  'thun polo nu': ['thun', 'polo', 'tee'],
  'polo': ['polo'],
  'so mi': ['sơ mi', 'shirt', 'oxford'],
  'tanktop': ['tanktop', 'ba lỗ', 'sát nách'],
  'short': ['short', 'sooc', 'đùi'],
  'short nu': ['short', 'đùi', 'sooc'],
  'kaki': ['kaki', 'khaki', 'jean', 'jeans'],
  'jogger': ['jogger', 'pants', 'quần nỉ', 'quần dài'],
  'jogger nu': ['jogger', 'pants', 'quần dài'],
  'legging': ['legging'],
  'vay dam': ['váy', 'đầm'],
  'chay bo': ['chạy bộ', 'run', 'running'],
  'chay bo nam': ['chạy bộ', 'run safe', 'windbreaker'],
  'bong da': ['bóng đá', 'đá banh'],
  'cau long': ['cầu lông', 'badminton'],
  'cau long nam': ['cầu lông'],
  'cau long nu': ['cầu lông'],
  'gym': ['gym', 'training', 'tập gym', 'sát nách'],
  'gym nam': ['gym', 'training', 'sát nách'],
  'gym nu': ['gym', 'seamless', 'vital'],
  'pickleball': ['pickleball'],
  'pickleball nu': ['pickleball'],
};

// Lấy danh sách sản phẩm có hỗ trợ bộ lọc Navbar toàn diện
const getProducts = async (req, res) => {
  try {
    const { category, gender, collection, occasion, sale, q } = req.query;
    const andConditions = [{ is_active: true }];

    // 1. LỌC THEO DANH MỤC (CATEGORY)
    if (category) {
      const catKey = category.toLowerCase().trim();
      if (CATEGORY_GROUPS[catKey]) {
        andConditions.push({
          category: { slug: { in: CATEGORY_GROUPS[catKey] } }
        });
      } else {
        andConditions.push({
          category: { slug: catKey }
        });
      }
    }

    // 2. LỌC THEO GIỚI TÍNH (GENDER: nam | nu)
    if (gender) {
      const g = gender.toLowerCase().trim();
      if (GENDER_CATEGORIES[g]) {
        andConditions.push({
          category: { slug: { in: GENDER_CATEGORIES[g] } }
        });
      }
    }

    // 3. LỌC THEO NHU CẦU (OCCASION: hang-ngay | o-nha | the-thao)
    if (occasion) {
      const occKey = occasion.toLowerCase().trim();
      if (OCCASION_CATEGORIES[occKey]) {
        andConditions.push({
          category: { slug: { in: OCCASION_CATEGORIES[occKey] } }
        });
      }
    }

    // 4. LỌC THEO BỘ SƯU TẬP (COLLECTION)
    if (collection) {
      const coll = collection.toLowerCase().trim();
      if (coll === 'thu-dong') {
        andConditions.push({
          OR: [
            { category: { slug: { in: ['ao-khoac', 'ao-khoac-nu', 'ao-dai-tay', 'ao-dai-tay-nu', 'thu-dong'] } } },
            { name: { contains: 'khoác', mode: 'insensitive' } },
            { name: { contains: 'hoodie', mode: 'insensitive' } },
            { name: { contains: 'sweater', mode: 'insensitive' } },
            { name: { contains: 'nỉ', mode: 'insensitive' } },
            { name: { contains: 'len', mode: 'insensitive' } },
            { name: { contains: 'dài tay', mode: 'insensitive' } },
            { name: { contains: 'jacket', mode: 'insensitive' } },
            { name: { contains: 'cardigan', mode: 'insensitive' } },
          ]
        });
      } else if (coll === 'hoang-sao') {
        andConditions.push({
          OR: [
            { name: { contains: 'hoàng sao', mode: 'insensitive' } },
            { name: { contains: 'martian', mode: 'insensitive' } },
          ]
        });
      } else if (coll === 'seamless-motion') {
        andConditions.push({
          OR: [
            { name: { contains: 'seamless', mode: 'insensitive' } },
            { category: { slug: { in: ['gym-nu', 'gym-nam'] } } },
          ]
        });
      } else if (coll === 'run-safe') {
        andConditions.push({
          OR: [
            { name: { contains: 'run safe', mode: 'insensitive' } },
            { name: { contains: 'chạy bộ', mode: 'insensitive' } },
            { category: { slug: { in: ['chay-bo-nam', 'chay-bo-nu'] } } },
          ]
        });
      } else if (coll === 'zeromark') {
        andConditions.push({
          OR: [
            { name: { contains: 'zeromark', mode: 'insensitive' } },
            { name: { contains: 'energy', mode: 'insensitive' } },
            { name: { contains: 'smash', mode: 'insensitive' } },
            { category: { slug: { in: ['cau-long-nam', 'cau-long-nu', 'gym-nam', 'gym-nu'] } } },
          ]
        });
      } else if (coll === 'cau-long') {
        andConditions.push({
          OR: [
            { name: { contains: 'cầu lông', mode: 'insensitive' } },
            { category: { slug: { in: ['cau-long-nam', 'cau-long-nu'] } } },
          ]
        });
      }
    }

    // 5. LỌC THEO TỪ KHÓA TÌM KIẾM (Q)
    if (q && q.trim()) {
      const rawKeyword = q.trim();
      const lowerKeyword = rawKeyword.toLowerCase();
      const synonyms = KEYWORD_SYNONYMS[lowerKeyword] || [];
      const searchTerms = [rawKeyword, ...synonyms];

      const orSearchConditions = [];
      for (const term of searchTerms) {
        orSearchConditions.push(
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
          { category: { slug: { contains: term, mode: 'insensitive' } } }
        );
      }

      andConditions.push({ OR: orSearchConditions });
    }

    // 6. LỌC SẢN PHẨM KHUYẾN MÃI (SALE)
    if (sale === 'true' || sale === '1') {
      andConditions.push({
        OR: [
          { name: { contains: 'outlet', mode: 'insensitive' } },
          { name: { contains: 'sale', mode: 'insensitive' } },
          { name: { contains: 'mở bán', mode: 'insensitive' } },
          { name: { contains: 'best seller', mode: 'insensitive' } },
          { base_price: { lte: 250000 } },
        ]
      });
    }

    const where = andConditions.length > 1 ? { AND: andConditions } : andConditions[0];

    const rawProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sort_order: 'asc' } },
        variants: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Chuẩn hóa dữ liệu tương thích cho Frontend
    const formatted = rawProducts.map((p) => ({
      ...p,
      price: Number(p.base_price || 0),
      image_url: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Lỗi getProducts:', err);
    return res.status(500).json({ error: { message: 'Không thể tải danh sách sản phẩm.' } });
  }
};

// Lấy chi tiết sản phẩm (hỗ trợ cả slug và ID)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));

    const product = await prisma.product.findUnique({
      where: isNumeric ? { id: Number(id) } : { slug: id },
      include: {
        category: true,
        images: { orderBy: { sort_order: 'asc' } },
        variants: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: { message: 'Không tìm thấy sản phẩm.' } });
    }

    return res.status(200).json({
      ...product,
      price: Number(product.base_price || 0),
      image_url:
        product.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    });
  } catch (err) {
    console.error('Lỗi getProductById:', err);
    return res.status(500).json({ error: { message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.' } });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
