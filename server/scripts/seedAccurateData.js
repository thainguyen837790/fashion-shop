require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = require('../src/db/prisma');

const makeSlug = (str) => {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
};

const ACCURATE_PRODUCTS = [
  // --- 1. ÁO KHOÁC NAM (Sản phẩm người dùng vừa tạo: 449.000đ, Màu: Xanh Rêu, Đen, Xanh Navy) ---
  {
    name: 'Áo Khoác Nam có mũ Daily Wear',
    categorySlug: 'ao-nam',
    categoryName: 'Áo Nam',
    price: 449000,
    colors: ['Xanh Rêu', 'Đen', 'Xanh Navy'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/January2024/ao-khoac-nam-co-mu-daily-wear-xanh-reu-1.jpg', color: 'Xanh Rêu' },
      { url: 'https://mcdn.coolmate.me/uploads/2026/01/06/ao-khoac-the-thao-nam-flexline-1.jpg', color: 'Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/2026/10/22/xanh-navy.jpg', color: 'Xanh Navy' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },

  // --- 2. SET CHẠY BỘ & THỂ THAO CHUẨN COOLMATE (577.000đ) ---
  {
    name: 'Set chạy bộ nam Regular 360Reflect™ "Run Safe in The Dark"',
    categorySlug: 'the-thao',
    categoryName: 'Thể Thao',
    price: 577000,
    colors: ['Tím - Đen', 'Đen'],
    images: [
      { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo-thethao-timden-1.jpg', color: 'Tím - Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/June2025/quan-short-the-thao-nam-6inch-dai-sieu-co-gian-9-den_3.jpg', color: 'Đen' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },

  // --- 3. QUẦN SHORT & MẶC NHÀ (199.000đ - 249.000đ) ---
  {
    name: 'Pack 3 Shorts mặc nhà Coolmate Basics',
    categorySlug: 'quan-nam',
    categoryName: 'Quần Nam',
    price: 199000,
    colors: ['Ngẫu nhiên', 'Kẻ Caro'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/May2025/pack-3-shorts-mac-nha-coolmate-basics-mau-ngau-nhien11.jpg', color: 'Ngẫu nhiên' },
      { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-shorts-macnha.jpg', color: 'Kẻ Caro' },
    ],
    sizes: ['M', 'L', 'XL', '2XL'],
  },
  {
    name: 'Quần Short Kaki Nam 7 Inch Năng Động',
    categorySlug: 'quan-nam',
    categoryName: 'Quần Nam',
    price: 249000,
    colors: ['Be', 'Xanh Navy', 'Đen'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/May2023/quan-short-kaki-7-inch-be-1.jpg', color: 'Be' },
      { url: 'https://mcdn.coolmate.me/uploads/May2023/quan-short-kaki-7-inch-navy-1.jpg', color: 'Xanh Navy' },
      { url: 'https://mcdn.coolmate.me/uploads/December2024/quan-dai-nam-daily-pants-den-1.jpg', color: 'Đen' },
    ],
    sizes: ['M', 'L', 'XL'],
  },

  // --- 4. ÁO POLO & ÁO THUN (216.000đ - 299.000đ) ---
  {
    name: 'Áo Polo Nam Thể Thao Promax-S1',
    categorySlug: 'ao-nam',
    categoryName: 'Áo Nam',
    price: 216000,
    colors: ['Trắng', 'Xanh Rêu', 'Đen', 'Be Xám', 'Xanh Navy'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/December2024/ao-polo-nam-the-thao-promax-s1-trang-6.jpg', color: 'Trắng' },
      { url: 'https://mcdn.coolmate.me/uploads/April2025/ao-polo-nam-the-thao-promax-s1-Xanh-reu-9.jpg', color: 'Xanh Rêu' },
      { url: 'https://mcdn.coolmate.me/uploads/December2024/ao-polo-nam-the-thao-promax-s1-mau-den-7.jpg', color: 'Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/April2025/ao-polo-nam-the-thao-promax-s1-Be-Xam-9.jpg', color: 'Be Xám' },
      { url: 'https://mcdn.coolmate.me/uploads/December2024/ao-polo-nam-the-thao-promax-s1-xanh-navy-8.jpg', color: 'Xanh Navy' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    name: 'Áo Thun Nam Cotton Compact Phiên Bản Nâng Cấp',
    categorySlug: 'ao-thun',
    categoryName: 'Áo Thun & Polo',
    price: 199000,
    colors: ['Đen', 'Trắng', 'Xanh Navy', 'Xám Tiêu'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/January2024/ao-thun-cotton-compact-den-1.jpg', color: 'Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/January2024/ao-thun-cotton-compact-trang-1.jpg', color: 'Trắng' },
      { url: 'https://mcdn.coolmate.me/uploads/December2024/ao-polo-nam-the-thao-promax-s1-xanh-navy-8.jpg', color: 'Xanh Navy' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },

  // --- 5. ĐỒ LÓT NAM (189.000đ - 199.000đ) ---
  {
    name: 'Combo 3 Quần Lót Nam Trunk Lenzing Modal',
    categorySlug: 'phu-kien',
    categoryName: 'Phụ Kiện & Đồ Lót',
    price: 199000,
    colors: ['Đen', 'Xám', 'Xanh Navy'],
    images: [
      { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-den.jpg', color: 'Đen' },
      { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-xam.jpg', color: 'Xám' },
      { url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-trunk-modal-navy.jpg', color: 'Xanh Navy' },
    ],
    sizes: ['M', 'L', 'XL', '2XL'],
  },
  {
    name: 'Combo 3 Quần Lót Nam Trunk Ergofit',
    categorySlug: 'phu-kien',
    categoryName: 'Phụ Kiện & Đồ Lót',
    price: 387000,
    colors: ['Đen', 'Navy', 'Mix màu'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/2026/10/01/quan-lot-nam-trunk-ergofit-combo3-den-new_49.jpg', color: 'Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/2026/10/01/quan-lot-nam-trunk-ergofit-combo3-navy-new_93.jpg', color: 'Navy' },
      { url: 'https://mcdn.coolmate.me/uploads/2026/10/01/quan-lot-nam-trunk-ergofit-combo3-dennavy-new_8.jpg', color: 'Mix màu' },
    ],
    sizes: ['M', 'L', 'XL', '2XL'],
  },

  // --- 6. TẤT / PHỤ KIỆN (49.000đ - 69.000đ) ---
  {
    name: 'Tất Xỏ Ngón Chạy Bộ Coolmate',
    categorySlug: 'phu-kien',
    categoryName: 'Phụ Kiện & Đồ Lót',
    price: 69000,
    colors: ['Đen', 'Xám'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/December2023/tat-xo-ngon-chay-bo-den-1.jpg', color: 'Đen' },
      { url: 'https://mcdn.coolmate.me/uploads/December2023/tat-xo-ngon-chay-bo-xam-1.jpg', color: 'Xám' },
    ],
    sizes: ['M', 'L', 'XL'],
  },
  {
    name: 'Tất Nam Cổ Trung Sợi Cotton Chải Kỹ',
    categorySlug: 'phu-kien',
    categoryName: 'Phụ Kiện & Đồ Lót',
    price: 49000,
    colors: ['Xám', 'Đen', 'Trắng'],
    images: [
      { url: 'https://mcdn.coolmate.me/uploads/December2023/tat-co-trung-xam-1.jpg', color: 'Xám' },
      { url: 'https://mcdn.coolmate.me/uploads/December2023/tat-co-trung-den-1.jpg', color: 'Đen' },
    ],
    sizes: ['Freesize'],
  },
];

async function seedCleanAccurate() {
  console.log('================================================================');
  console.log('🚀 NẠP DỮ LIỆU SẢN PHẨM CHUẨN XÁC 100% VỚI GIÁ THẬT & MÀU THẬT');
  console.log('================================================================\n');

  console.log('🧹 Đang làm sạch dữ liệu cũ trong PostgreSQL...');
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.reviewAspect.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('✨ Đã làm sạch thành công database!\n');

  let count = 0;

  for (const item of ACCURATE_PRODUCTS) {
    const category = await prisma.category.upsert({
      where: { slug: item.categorySlug },
      update: { name: item.categoryName },
      create: { name: item.categoryName, slug: item.categorySlug },
    });

    const slug = `${makeSlug(item.name)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const variantsData = [];
    item.colors.forEach((col) => {
      item.sizes.forEach((s) => {
        const skuPrefix = makeSlug(col).slice(0, 3).toUpperCase() || 'COL';
        const randToken = Math.random().toString(36).substring(2, 6).toUpperCase();
        variantsData.push({
          color: col,
          size: s,
          price: item.price,
          stock: Math.floor(Math.random() * 30) + 20,
          sku: `CM-${skuPrefix}-${s}-${Date.now().toString().slice(-4)}-${randToken}`,
        });
      });
    });

    const saved = await prisma.product.create({
      data: {
        name: item.name,
        slug,
        description: `Sản phẩm thời trang cao cấp ${item.name} chính hãng Coolmate. Thiết kế tinh tế, chất liệu cao cấp mang lại cảm giác thoải mái tối đa cho phái mạnh.`,
        base_price: item.price,
        category_id: category.id,
        is_active: true,
        images: {
          create: item.images.map((img, idx) => ({
            url: img.url.split('?')[0],
            sort_order: idx,
            color: img.color || null,
          })),
        },
        variants: {
          create: variantsData,
        },
      },
    });

    count++;
    console.log(` ✔ [${count}] ${saved.name} | Giá: ${item.price.toLocaleString('vi-VN')}đ`);
    console.log(`    🎨 Màu: [${item.colors.join(', ')}] | 📏 Sizes: [${item.sizes.join(', ')}]`);
  }

  console.log(`\n🎉 HOÀN TẤT THÀNH CÔNG! Đã nạp ${count} sản phẩm với đầy đủ màu sắc và hình ảnh tương ứng!`);
  await prisma.$disconnect();
}

seedCleanAccurate().catch((err) => {
  console.error('❌ Lỗi seed:', err);
  process.exit(1);
});
