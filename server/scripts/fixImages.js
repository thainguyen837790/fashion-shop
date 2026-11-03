const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanImageUrls() {
  console.log('🔄 Đang làm nét toàn bộ ảnh trong Database...');

  // 1. Lấy tất cả ảnh hiện có
  const images = await prisma.productImage.findMany();
  let updatedCount = 0;

  for (const img of images) {
    if (img.url.includes('?aio=') || img.url.includes('?')) {
      // Cắt bỏ toàn bộ tham số ?aio=w-270 để lấy ảnh gốc sắc nét
      const cleanUrl = img.url.split('?')[0];

      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: cleanUrl },
      });
      updatedCount++;
    }
  }

  console.log(`🎉 Thành công! Đã làm nét ${updatedCount} ảnh về độ phân giải gốc.`);
  await prisma.$disconnect();
}

cleanImageUrls();