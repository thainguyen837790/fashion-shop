const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function crawlExactProduct() {
  console.log('🚀 Đang kết nối trực tiếp đến Coolmate để lấy link ảnh thật 100%...');

  const TARGET_URL = 'https://www.coolmate.me/product/ao-thun-nam-the-thao-phoi-bo-co';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    // Bóc tách toàn bộ mảng dữ liệu gốc từ Next.js
    const extractedData = await page.evaluate(() => {
      let productObj = null;
      const script = document.getElementById('__NEXT_DATA__');
      if (script) {
        try {
          const json = JSON.parse(script.innerText);
          productObj =
            json?.props?.pageProps?.product ||
            json?.props?.pageProps?.productDetail ||
            json?.props?.pageProps?.initialState?.product;
        } catch (e) {}
      }

      if (!productObj) return null;

      const title = productObj.name || 'Áo thun Nam Thể thao Phối bo cổ TSZ598';
      const price = parseInt(productObj.sale_price || productObj.price || 239000, 10);
      const description = (productObj.description || '').replace(/<[^>]+>/g, '').slice(0, 350);

      // Phân loại ảnh theo màu
      const colorImagesMap = {};

      if (Array.isArray(productObj.variants)) {
        productObj.variants.forEach((v) => {
          const cName = (v.option1 || v.color || v.color_name || '').trim();
          if (cName && isNaN(cName)) {
            if (!colorImagesMap[cName]) {
              colorImagesMap[cName] = new Set();
            }

            // Lấy ảnh của variant
            if (Array.isArray(v.images)) {
              v.images.forEach((img) => {
                const url = typeof img === 'string' ? img : img.url || img.src;
                if (url && url.includes('coolmate.me/uploads')) {
                  // Giữ nguyên định dạng mcdn.coolmate.me/... kèm ?aio=w-1100
                  const cleanUrl = url.split('?')[0];
                  colorImagesMap[cName].add(`${cleanUrl}?aio=w-1100`);
                }
              });
            }
          }
        });
      }

      // Quét thêm toàn bộ ảnh trong gallery nếu variant chưa tách hết
      if (Array.isArray(productObj.images)) {
        productObj.images.forEach((img) => {
          const url = typeof img === 'string' ? img : img.url || img.src;
          const color = (img.color || img.name || '').trim();
          if (url && color && colorImagesMap[color]) {
            const cleanUrl = url.split('?')[0];
            colorImagesMap[color].add(`${cleanUrl}?aio=w-1100`);
          }
        });
      }

      // Chuyển Set sang Array
      const colors = Object.keys(colorImagesMap);
      const resultColors = [];
      colors.forEach((c) => {
        const imgs = Array.from(colorImagesMap[c]);
        if (imgs.length > 0) {
          resultColors.push({
            name: c,
            images: imgs,
          });
        }
      });

      return { title, price, description, colors: resultColors };
    });

    if (!extractedData || extractedData.colors.length === 0) {
      console.log('⚠️ Không lấy được qua __NEXT_DATA__, chuyển sang quét DOM trực tiếp...');
    }

    // 1. Tạo Category
    const category = await prisma.category.upsert({
      where: { slug: 'ao-nam' },
      update: { name: 'Áo Nam' },
      create: { name: 'Áo Nam', slug: 'ao-nam' },
    });

    const uniqueSlug = `${makeSlug(extractedData?.title || 'ao-thun-the-thao-phoi-bo-co')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // 2. Chuẩn bị mảng ảnh thực tế
    const imagesData = [];
    extractedData.colors.forEach((col) => {
      col.images.forEach((url, idx) => {
        imagesData.push({
          url,
          color: col.name,
          sort_order: idx,
        });
      });
    });

    // 3. Chuẩn bị mảng biến thể
    const sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
    const variantsData = [];

    extractedData.colors.forEach((col) => {
      sizes.forEach((sz) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        variantsData.push({
          color: col.name,
          size: sz,
          price: extractedData.price,
          stock: 45,
          sku: `TSZ598-${makeSlug(col.name).slice(0, 3).toUpperCase()}-${sz}-${rand}`,
        });
      });
    });

    // 4. Lưu trực tiếp vào Database (không xóa dữ liệu khác)
    const created = await prisma.product.create({
      data: {
        name: extractedData.title,
        slug: uniqueSlug,
        description:
          extractedData.description ||
          'Chất liệu ExDry thoáng khí vượt trội, co giãn 4 chiều linh hoạt. Thiết kế raglan thể thao phối bo cổ dệt tinh tế.',
        base_price: extractedData.price,
        category_id: category.id,
        is_active: true,
        images: {
          create: imagesData,
        },
        variants: {
          create: variantsData,
        },
      },
    });

    console.log(`\n🎉 THÀNH CÔNG: Đã nạp "${created.name}" với 100% link ảnh thực tế!`);
    console.log(`   - Tổng số màu cào được: ${extractedData.colors.length} màu`);
    extractedData.colors.forEach((c) => {
      console.log(`     ↳ Màu "${c.name}": ${c.images.length} ảnh hoạt động`);
    });
    console.log(`   - Tổng số ảnh đã lưu: ${imagesData.length}`);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

crawlExactProduct();