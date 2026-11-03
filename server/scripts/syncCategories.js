const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hàm xử lý mọi kiểu nhập thiếu số 0
function fixPriceValue(val) {
  let num = Math.round(Number(val) || 0);
  if (num <= 0) return 0;

  // Trường hợp 1: Nhập thiếu 3 số 0 (VD: 139, 229, 345 -> 139.000, 229.000, 345.000)
  if (num < 1000) {
    return num * 1000;
  }

  // Trường hợp 2: Nhập thiếu 2 số 0 (VD: 1390, 2290, 3450 -> 139.000, 229.000, 345.000)
  if (num >= 1000 && num < 10000) {
    return num * 100;
  }

  // Trường hợp 3: Nhập thiếu 1 số 0 (VD: 13900, 22900, 34500 -> 139.000, 229.000, 345.000)
  if (num >= 10000 && num < 70000) {
    return num * 10;
  }

  return num;
}

async function fixAllRemaining() {
  console.log('🚀 Đang quét toàn bộ sản phẩm và biến thể còn sót lại...');

  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  let pCount = 0;
  let vCount = 0;

  for (const product of products) {
    let pPrice = fixPriceValue(product.base_price);

    // Nếu base_price chưa hợp lệ nhưng biến thể có giá hợp lệ thì lấy theo biến thể
    if (pPrice < 70000 && product.variants.length > 0) {
      const validV = product.variants.find((v) => fixPriceValue(v.price) >= 70000);
      if (validV) {
        pPrice = fixPriceValue(validV.price);
      }
    }

    // Cập nhật lại base_price nếu có thay đổi
    if (Number(product.base_price) !== pPrice && pPrice > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { base_price: pPrice },
      });
      pCount++;
    }

    // Chuẩn hóa và đồng bộ cho từng biến thể
    for (const variant of product.variants) {
      let vPrice = fixPriceValue(variant.price);

      // Nếu variant vẫn dưới 70.000đ thì gán bằng base_price của sản phẩm
      if (vPrice < 70000 && pPrice >= 70000) {
        vPrice = pPrice;
      }

      if (Number(variant.price) !== vPrice && vPrice > 0) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { price: vPrice },
        });
        vCount++;
      }
    }
  }

  console.log(`\n🎉 HOÀN THÀNH:`);
  console.log(`   - Đã điều chỉnh lại giá cho ${pCount} sản phẩm.`);
  console.log(`   - Đã điều chỉnh lại giá cho ${vCount} biến thể.`);

  await prisma.$disconnect();
}

fixAllRemaining().catch((err) => {
  console.error('❌ Lỗi:', err);
  prisma.$disconnect();
});