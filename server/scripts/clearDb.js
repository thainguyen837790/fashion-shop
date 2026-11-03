const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAll() {
  console.log('🧹 Đang xóa sạch toàn bộ dữ liệu sản phẩm cũ...');

  try {
    // Xóa theo thứ tự ràng buộc khóa ngoại
    await prisma.cartItem?.deleteMany().catch(() => {});
    await prisma.orderItem?.deleteMany().catch(() => {});
    await prisma.review?.deleteMany().catch(() => {});
    
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    console.log('✨ ĐÃ DỌN SẠCH DATABASE THÀNH CÔNG! Sẵn sàng nạp dữ liệu mới.');
  } catch (err) {
    console.error('❌ Lỗi khi dọn database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearAll();