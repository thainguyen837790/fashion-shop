// client/src/constants/owenAssets.js

export const OWEN_ASSETS = {
  // 1. Hero Banners
  hero: [
    {
      id: 'under-400k',
      badge: 'ƯU ĐÃI ĐỘC QUYỀN',
      title: 'UNDER 400K',
      subtitle: 'GIÁ TỐT NHẤT THÁNG',
      desc: 'Bộ sưu tập trang phục thiết yếu văn phòng phom chuẩn với mức giá đặc quyền.',
      link: '/?sale=true',
      btnText: 'KHÁM PHÁ NGAY',
      // Có thể thay bằng link ảnh thật người mẫu cầm hộp xanh
      bgImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1800&q=80',
      watermark: '400K',
    },
    {
      id: 'aeon-event',
      badge: 'SỰ KIỆN ĐẶC BIỆT',
      title: 'BUSINESS TRAVEL',
      subtitle: 'AEON MALL TÂN PHÚ (30.10 - 03.11)',
      desc: 'Trải nghiệm trực tiếp BST Thu Đông 2026 cùng nhiều quà tặng hấp dẫn.',
      link: '/?collection=thu-dong',
      btnText: 'XEM LỊCH SỰ KIỆN',
      bgImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1800&q=80',
      cards: [
        { title: 'Gặp gỡ Anh trai KIMLONG', time: '20h • 30.10' },
        { title: 'Fashion Show & Meet Greet', time: '18h • 31.10' },
        { title: 'Ưu đãi mua sắm BST Thu Đông', time: '01.11 - 03.11' },
      ],
    },
  ],

  // 2. 4 Cột danh mục
  categories: [
    { name: 'SƠ MI', tag: 'SHIRTS', link: '/?category=ao-so-mi', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80' },
    { name: 'BLAZER', tag: 'BLAZER & SUIT', link: '/?category=ao-khoac', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80' },
    { name: 'JACKET', tag: 'OUTERWEAR', link: '/?category=ao-khoac', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
    { name: 'QUẦN ÂU', tag: 'TROUSERS', link: '/?category=quan-kaki', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80' },
  ],

  // 3. Section Thang máy (Elevator Scrub)
  elevator: {
    manInside: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80',
    videoUrl: 'https://media3.coolmate.me/cdn-cgi/video/quality=80/uploads/January2024/video_campaign_lookbook.mp4',
  },

  // 4. Banner Slim Fit cạp tăng đơ
  slimFit: {
    modelImg: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1000&q=80',
    detailImg: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    link: '/?category=quan-kaki',
  },

  // 5. Tin tức / Sự kiện
  news: [
    {
      id: 1,
      title: 'OWEN x KHOAI LANG THANG – Màn collab mãn nhãn phong cách khám phá',
      date: '30 tháng 10, 2026',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
      link: '#',
    },
    {
      id: 2,
      title: 'MỞ CỬA TỰ DO | Săn vé để nhận thêm đặc quyền show diễn thời trang FW26',
      date: '22 tháng 10, 2026',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
      link: '#',
    },
    {
      id: 3,
      title: 'BIG EVENT OWEN: Ra mắt BST Thu Đông 2026 – Business Travel phong thái mới',
      date: '21 tháng 10, 2026',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      link: '#',
    },
  ],

  // 6. Background Video/Image cho Đăng ký nhận tin
  newsletterBg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=80',
};