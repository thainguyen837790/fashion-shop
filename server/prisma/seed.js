const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang dọn dẹp và nạp dữ liệu phong phú cho ThaiTrinh Fashion...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Dọn dẹp dữ liệu cũ (đúng thứ tự khóa ngoại)
  await prisma.reviewAspect?.deleteMany({}).catch(() => {});
  await prisma.review?.deleteMany({}).catch(() => {});
  await prisma.orderItem?.deleteMany({}).catch(() => {});
  await prisma.cartItem?.deleteMany({}).catch(() => {});
  await prisma.productImage?.deleteMany({}).catch(() => {});
  await prisma.productVariant?.deleteMany({}).catch(() => {});
  await prisma.product?.deleteMany({}).catch(() => {});
  await prisma.category?.deleteMany({}).catch(() => {});

  // 2. Tài khoản mặc định
  await prisma.user.upsert({
    where: { email: 'admin@thaitrinh.fashion' },
    update: {},
    create: {
      email: 'admin@thaitrinh.fashion',
      password_hash: passwordHash,
      full_name: 'Quản Trị Viên ThaiTrinh',
      phone: '0901234567',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      email: 'customer@gmail.com',
      password_hash: passwordHash,
      full_name: 'Nguyễn Văn A',
      phone: '0912345678',
      role: 'customer',
      cart: { create: {} },
      addresses: {
        create: {
          recipient: 'Nguyễn Văn A',
          phone: '0912345678',
          province: 'Cần Thơ',
          district: 'Ninh Kiều',
          ward: 'Xuân Khánh',
          street: 'Khu II, Đường 3/2',
          is_default: true,
        },
      },
    },
  });

  // 3. Tạo danh mục cha & con
  const catNam = await prisma.category.create({ data: { name: 'Thời Trang Nam', slug: 'nam' } });
  const catAoThunNam = await prisma.category.create({ data: { name: 'Áo Thun & Polo Nam', slug: 'ao-thun-nam', parent_id: catNam.id } });
  const catAoSoMiNam = await prisma.category.create({ data: { name: 'Áo Sơ Mi Nam', slug: 'ao-so-mi-nam', parent_id: catNam.id } });
  const catQuanNam = await prisma.category.create({ data: { name: 'Quần Dài & Short Nam', slug: 'quan-nam', parent_id: catNam.id } });

  const catNu = await prisma.category.create({ data: { name: 'Thời Trang Nữ', slug: 'nu' } });
  const catDamVayNu = await prisma.category.create({ data: { name: 'Đầm & Váy Nữ', slug: 'dam-vay-nu', parent_id: catNu.id } });
  const catAoKieuNu = await prisma.category.create({ data: { name: 'Áo Kiểu & Sơ Mi Nữ', slug: 'ao-kieu-nu', parent_id: catNu.id } });

  const catTheThao = await prisma.category.create({ data: { name: 'Đồ Thể Thao', slug: 'the-thao' } });
  const catPhuKien = await prisma.category.create({ data: { name: 'Phụ Kiện', slug: 'phu-kien' } });

  // 4. Danh sách 18 sản phẩm chất lượng cao
  const products = [
    // --- THỜI TRANG NAM ---
    {
      name: 'Áo Thun Cotton Compact Phiên Bản Nâng Cấp',
      slug: 'ao-thun-cotton-compact-nang-cap',
      category_id: catAoThunNam.id,
      base_price: 199000,
      description: 'Chất liệu 100% Cotton Compact chống nhăn, sợi chải kỹ thoáng mát suốt ngày dài.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      variants: [
        { color: 'Đen', size: 'M', sku: 'AT-DEN-M', price: 199000, stock: 50 },
        { color: 'Đen', size: 'L', sku: 'AT-DEN-L', price: 199000, stock: 40 },
        { color: 'Trắng', size: 'M', sku: 'AT-TRANG-M', price: 199000, stock: 60 },
        { color: 'Trắng', size: 'L', sku: 'AT-TRANG-L', price: 199000, stock: 35 },
      ],
    },
    {
      name: 'Áo Polo Cafe Khử Mùi Thoáng Khí Nam',
      slug: 'ao-polo-cafe-khu-mui-nam',
      category_id: catAoThunNam.id,
      base_price: 299000,
      description: 'Công nghệ sợi tái chế bã cafe độc quyền, khử mùi cơ thể và chống tia UV.',
      image: 'https://images.unsplash.com/photo-1625910513413-5bc59591e1d3?w=800',
      variants: [
        { color: 'Xanh Navy', size: 'M', sku: 'PL-NAVY-M', price: 299000, stock: 30 },
        { color: 'Xanh Navy', size: 'L', sku: 'PL-NAVY-L', price: 299000, stock: 25 },
        { color: 'Xám', size: 'XL', sku: 'PL-XAM-XL', price: 299000, stock: 20 },
      ],
    },
    {
      name: 'Áo Polo Pique Mắt Chim Cổ Điển',
      slug: 'ao-polo-pique-mat-chim',
      category_id: catAoThunNam.id,
      base_price: 329000,
      description: 'Dệt cấu trúc mắt chim tinh xảo, cổ áo bo dệt chống quăn sau nhiều lần giặt.',
      image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800',
      variants: [
        { color: 'Trắng', size: 'M', sku: 'PL-PIQUE-W-M', price: 329000, stock: 30 },
        { color: 'Đen', size: 'L', sku: 'PL-PIQUE-B-L', price: 329000, stock: 25 },
      ],
    },
    {
      name: 'Áo Sơ Mi Nam Dài Tay Modal Chống Nhăn',
      slug: 'ao-so-mi-nam-modal-chong-nhan',
      category_id: catAoSoMiNam.id,
      base_price: 399000,
      description: 'Sợi gỗ sồi Modal mềm mại, thấm hút vượt trội và hạn chế nhăn tối đa.',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      variants: [
        { color: 'Trắng', size: 'M', sku: 'SM-TRANG-M', price: 399000, stock: 40 },
        { color: 'Trắng', size: 'L', sku: 'SM-TRANG-L', price: 399000, stock: 30 },
        { color: 'Xanh Nhạt', size: 'L', sku: 'SM-XANH-L', price: 399000, stock: 25 },
      ],
    },
    {
      name: 'Áo Sơ Mi Oxford Cộc Tay Dáng Suông',
      slug: 'ao-so-mi-oxford-coc-tay',
      category_id: catAoSoMiNam.id,
      base_price: 349000,
      description: 'Vải Oxford dệt tổ ong dày dặn, thích hợp mặc hằng ngày hoặc phối layer ngoài áo thun.',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
      variants: [
        { color: 'Be', size: 'M', sku: 'SM-OX-BE-M', price: 349000, stock: 20 },
        { color: 'Xanh Nhạt', size: 'L', sku: 'SM-OX-BL-L', price: 349000, stock: 35 },
      ],
    },
    {
      name: 'Quần Dài Kaki Co Giãn Dáng Slimfit',
      slug: 'quan-dai-kaki-co-gian-slimfit',
      category_id: catQuanNam.id,
      base_price: 399000,
      description: 'Chất kaki cao cấp kết hợp sợi thun spandex cử động thoải mái trong công việc.',
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
      variants: [
        { color: 'Xám', size: '30', sku: 'QK-XAM-30', price: 399000, stock: 30 },
        { color: 'Xám', size: '31', sku: 'QK-XAM-31', price: 399000, stock: 30 },
        { color: 'Đen', size: '32', sku: 'QK-DEN-32', price: 399000, stock: 20 },
      ],
    },
    {
      name: 'Quần Short Kaki Co Giãn 7 Inch Nam',
      slug: 'quan-short-kaki-7inch',
      category_id: catQuanNam.id,
      base_price: 249000,
      description: 'Độ dài ngang gối hoàn hảo cho ngày hè dạo phố hay du lịch cuối tuần.',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
      variants: [
        { color: 'Be', size: 'M', sku: 'QS-BE-M', price: 249000, stock: 30 },
        { color: 'Đen', size: 'L', sku: 'QS-DEN-L', price: 249000, stock: 40 },
      ],
    },
    {
      name: 'Quần Jeans Nam Dáng Suông Phong Cách Retro',
      slug: 'quan-jeans-nam-dang-suong-retro',
      category_id: catQuanNam.id,
      base_price: 499000,
      description: 'Denim dày dặn xử lý wash màu tự nhiên, form suông tôn dáng chuẩn phong cách.',
      image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800',
      variants: [
        { color: 'Xanh Nhạt', size: '30', sku: 'QJ-XANH-30', price: 499000, stock: 25 },
        { color: 'Xanh Nhạt', size: '31', sku: 'QJ-XANH-31', price: 499000, stock: 20 },
      ],
    },

    // --- THỜI TRANG NỮ ---
    {
      name: 'Đầm Suông Linen Dáng Dài Tối Giản',
      slug: 'dam-suong-linen-dang-dai-toi-gian',
      category_id: catDamVayNu.id,
      base_price: 349000,
      description: 'Vải Linen mộc mạc thoáng mát, thiết kế suông chữ A nhẹ nhàng thanh lịch.',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
      variants: [
        { color: 'Be', size: 'S', sku: 'DL-BE-S', price: 349000, stock: 30 },
        { color: 'Be', size: 'M', sku: 'DL-BE-M', price: 349000, stock: 25 },
        { color: 'Trắng Kem', size: 'M', sku: 'DL-TRANG-M', price: 349000, stock: 20 },
      ],
    },
    {
      name: 'Áo Kiểu Nữ Tay Phồng Cổ Vuông Thanh Lịch',
      slug: 'ao-kieu-nu-tay-phong-co-vuong',
      category_id: catAoKieuNu.id,
      base_price: 249000,
      description: 'Vải tơ mềm rủ tự nhiên, tay bồng nhẹ nhàng che khuyết điểm bắp tay.',
      image: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800',
      variants: [
        { color: 'Trắng', size: 'S', sku: 'AK-TRANG-S', price: 249000, stock: 20 },
        { color: 'Trắng', size: 'M', sku: 'AK-TRANG-M', price: 249000, stock: 30 },
      ],
    },
    {
      name: 'Áo Thun Nữ Cotton Cổ Tròn Dáng Ôm',
      slug: 'ao-thun-nu-cotton-co-tron',
      category_id: catAoKieuNu.id,
      base_price: 179000,
      description: 'Form ôm gọn gàng tôn đường cong cơ thể, cotton 4 chiều mềm mượt.',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      variants: [
        { color: 'Trắng', size: 'S', sku: 'AT-NU-W-S', price: 179000, stock: 40 },
        { color: 'Đen', size: 'M', sku: 'AT-NU-B-M', price: 179000, stock: 35 },
      ],
    },
    {
      name: 'Chân Váy Chữ A Lưng Cao Xếp Ly',
      slug: 'chan-vay-chu-a-lung-cao-xep-ly',
      category_id: catDamVayNu.id,
      base_price: 289000,
      description: 'Cạp lưng cao hack dáng đôi chân, chất vải tuyết mưa đứng form không nhăn.',
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
      variants: [
        { color: 'Đen', size: 'S', sku: 'CV-DEN-S', price: 289000, stock: 25 },
        { color: 'Be', size: 'M', sku: 'CV-BE-M', price: 289000, stock: 30 },
      ],
    },

    // --- ĐỒ THỂ THAO ---
    {
      name: 'Áo Tập Thể Thao Nam Quick-Dry Thoát Ẩm',
      slug: 'ao-tap-the-thao-nam-quick-dry',
      category_id: catTheThao.id,
      base_price: 189000,
      description: 'Cấu trúc dệt tổ ong thoát hơi ẩm siêu tốc, không giữ mồ hôi khi vận động mạnh.',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800',
      variants: [
        { color: 'Đen', size: 'M', sku: 'TT-SPORT-B-M', price: 189000, stock: 40 },
        { color: 'Đen', size: 'L', sku: 'TT-SPORT-B-L', price: 189000, stock: 45 },
        { color: 'Xanh Navy', size: 'L', sku: 'TT-SPORT-N-L', price: 189000, stock: 30 },
      ],
    },
    {
      name: 'Quần Short Chạy Bộ 2 Lớp Chống Lộ Có Túi Zip',
      slug: 'quan-short-chay-bo-2-lop-tui-zip',
      category_id: catTheThao.id,
      base_price: 259000,
      description: 'Lớp trong co giãn ôm cơ bắp, lớp ngoài kháng nước nhẹ kèm túi zip an toàn.',
      image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
      variants: [
        { color: 'Đen', size: 'M', sku: 'QS-SPORT-M', price: 259000, stock: 50 },
        { color: 'Đen', size: 'L', sku: 'QS-SPORT-L', price: 259000, stock: 40 },
      ],
    },
    {
      name: 'Set Đồ Tập Gym Yoga Nữ Co Giãn 360',
      slug: 'set-do-tap-gym-yoga-nu',
      category_id: catTheThao.id,
      base_price: 429000,
      description: 'Khả năng co giãn 4 chiều hỗ trợ tối đa các bài tập uốn dẻo và nâng tạ.',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      variants: [
        { color: 'Tím Than', size: 'S', sku: 'SET-YOGA-S', price: 429000, stock: 25 },
        { color: 'Tím Than', size: 'M', sku: 'SET-YOGA-M', price: 429000, stock: 30 },
      ],
    },

    // --- PHỤ KIỆN ---
    {
      name: 'Combo 3 Quần Lót Nam Boxer Modal Kháng Khuẩn',
      slug: 'combo-3-quan-lot-nam-boxer-modal',
      category_id: catPhuKien.id,
      base_price: 219000,
      description: 'Đai lưng thun dệt nguyên khối êm ái, sợi Modal kháng khuẩn tự nhiên.',
      image: 'https://images.unsplash.com/photo-1586525198428-225f6f12cff5?w=800',
      variants: [
        { color: 'Đen', size: 'L', sku: 'BX-COMBO-L', price: 219000, stock: 100 },
        { color: 'Đen', size: 'XL', sku: 'BX-COMBO-XL', price: 219000, stock: 80 },
      ],
    },
    {
      name: 'Combo 3 Đôi Vớ Cổ Trung Đệm Gót Êm Chân',
      slug: 'combo-3-doi-vo-co-trung-dem-got',
      category_id: catPhuKien.id,
      base_price: 89000,
      description: 'Cotton chải kỹ thấm hút mồ hôi chân, có gân đệm gót chống tuột khi di chuyển.',
      image: 'https://images.unsplash.com/photo-1582966779680-9755106886e0?w=800',
      variants: [
        { color: 'Trắng', size: 'Freesize', sku: 'VO-TRANG-FS', price: 89000, stock: 150 },
        { color: 'Đen', size: 'Freesize', sku: 'VO-DEN-FS', price: 89000, stock: 120 },
      ],
    },
    {
      name: 'Nón Lưỡi Trai Vải Canvas Khóa Kim Loại',
      slug: 'non-luoi-trai-canvas-khoa-kim-loai',
      category_id: catPhuKien.id,
      base_price: 149000,
      description: 'Form nón cứng cáp, vải canvas bền màu, khóa đồng điều chỉnh kích cỡ linh hoạt.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
      variants: [
        { color: 'Đen', size: 'Freesize', sku: 'NON-DEN-FS', price: 149000, stock: 60 },
        { color: 'Be', size: 'Freesize', sku: 'NON-BE-FS', price: 149000, stock: 40 },
      ],
    },
  ];

  // 5. Thêm dữ liệu vào Database
  for (const item of products) {
    const { image, variants, ...prodData } = item;
    await prisma.product.create({
      data: {
        ...prodData,
        images: {
          create: [{ url: image, sort_order: 1 }],
        },
        variants: {
          create: variants,
        },
      },
    });
  }

  console.log(` ĐÃ NẠP THÀNH CÔNG ${products.length} SẢN PHẨM MẪU VÀO DATABASE!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });