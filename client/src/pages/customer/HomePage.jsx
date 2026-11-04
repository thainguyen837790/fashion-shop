import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  X,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
} from 'lucide-react';
import api from '../../api/axios';
import ProductCard from '../../components/product/ProductCard';

// Import ảnh thực tế cho 4 Cột danh mục thời trang
import somiImg from '../../assets/download (1).jpg';
import blazerImg from '../../assets/download (2).jpg';
import jacketImg from '../../assets/download (3).jpg';
import quanAuImg from '../../assets/download.jpg';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. DỮ LIỆU BANNER HERO CHUẨN TỈ LỆ 1719x698
// ==========================================
const BANNER_SLIDES = [
  {
    id: 1,
    title: 'BUSINESS TRAVEL - FW26',
    image: 'https://owen.cdn.vccloud.vn/media/codazon/slideshow/t/o/topbanner40_11zon.jpg',
    link: '/?collection=thu-dong',
  },
  {
    id: 2,
    title: 'UNDER 400K EXCLUSIVE',
    image: 'https://owen.cdn.vccloud.vn/media/codazon/slideshow/t/o/topbanner39_11zon.jpg',
    link: '/?sale=true',
  },
  {
    id: 3,
    title: 'THE MODERN GENTLEMAN',
    image: 'https://sixdo.vn/images/banners/resized/web_poise-1793075282.webp',
    link: '/?category=ao-so-mi',
  },
  {
    id: 4,
    title: 'EASY CARE PREMIUM SHIRTS',
    image: 'https://sixdo.vn/images/banners/resized/web_peony-1791856795.webp',
    link: '/?category=ao-so-mi',
  },
  {
    id: 5,
    title: 'SMART PANTS WITH EXTENDER',
    image: 'https://mcdn.coolmate.me/uploads/2026/09/16/runsafe_new_desk.jpg?aio=w-2048',
    link: '/?category=quan-kaki',
  },
];

// ==========================================
// 2. 4 CỘT DANH MỤC THỜI TRANG ĐỨNG CHUẨN OWEN
// ==========================================
const FOUR_PILLARS = [
  {
    name: 'SƠ MI',
    link: 'products/ao-so-mi-nu-ngan-tay-om-body-basic-nhieu-mau-kiras-1522',
    img: somiImg,
  },
  {
    name: 'CARDIGAN',
    link: '/products/set-ao-2s-kem-cardigan-mong-emlyvn-ke-hong-nu-tinh-ao-cadigan-ke-co-gian-4-chieu-sieu-xinh-de-thuong-9238',
    img: blazerImg,
  },
  {
    name: 'CROPTOP',
    link: '/products/meixuemeilin-ao-croptop-det-kim-co-vuong-dang-om-thoi-trang-quyen-ru-cho-nu-5036',
    img: jacketImg,
  },
  {
    name: 'CHÂN VÁY',
    link: 'products/ao-kieu-nu-dang-croptop-chi-tiet-co-tau-tay-bong-cot-day-no-mua-he-kimee-ka832-4696',
    img: quanAuImg,
  },
];

// ==========================================
// 3. DANH SÁCH BÀI VIẾT TIN TỨC / SỰ KIỆN
// ==========================================
const NEWS_EVENTS = [
  {
    id: 1,
    title: 'Harper’s Bazaar Việt Nam kỷ niệm 15 năm với buổi tiệc “Hướng đến những vì sao”',
    date: '30 tháng 10, 2026',
    image: 'https://bazaarvietnam.vn/wp-content/uploads/2026/10/harpers-bazaar-vietnam-party-ky-niem-15-nam-invite.jpg',
  },
  {
    id: 2,
    title: 'Trang sức cao cấp trong khu vườn bí mật…',
    date: '22 tháng 10, 2026',
    image: 'https://bazaarvietnam.vn/wp-content/uploads/2026/10/bzvn-the-secret-garden-photoshoot-van-cleef-arpels-1.jpg',
  },
  {
    id: 3,
    title: 'BIG EVENT OWEN: Ra mắt BST Thu Đông 2026 – Business Travel phong thái mới',
    date: '21 tháng 10, 2026',
    image: 'https://owen.cdn.vccloud.vn/media/amasty/blog/2._Resize_1200x628.jpg',
  },
];

// ==========================================
// 4. METADATA CHO BỘ LỌC TỪ NAVBAR VÀ URL
// ==========================================
const FILTER_META = {
  // Áo nam
  'ao-nam': { title: 'TẤT CẢ ÁO NAM', badge: 'Thời trang Nam' },
  'ao-khoac': { title: 'ÁO KHOÁC NAM CAO CẤP', badge: 'Áo Nam' },
  'ao-dai-tay': { title: 'ÁO DÀI TAY & HOODIES', badge: 'Áo Nam' },
  'ao-thun': { title: 'ÁO THUN THỂ THAO & CASUAL', badge: 'Áo Nam' },
  'ao-so-mi': { title: 'ÁO POLO & SƠ MI CÔNG SỞ', badge: 'Áo Nam' },
  'ao-tanktop': { title: 'ÁO BA LỖ (TANKTOP)', badge: 'Áo Nam' },

  // Quần nam
  'quan-nam': { title: 'TẤT CẢ QUẦN NAM', badge: 'Thời trang Nam' },
  'quan-short': { title: 'QUẦN SHORT NĂNG ĐỘNG', badge: 'Quần Nam' },
  'quan-kaki': { title: 'QUẦN DÀI KAKI & JEANS', badge: 'Quần Nam' },
  'quan-jogger': { title: 'QUẦN JOGGER & NỈ THỂ THAO', badge: 'Quần Nam' },

  // Nữ
  'ao-nu': { title: 'TẤT CẢ ÁO NỮ', badge: 'Thời trang Nữ' },
  'ao-khoac-nu': { title: 'ÁO KHOÁC NỮ HIỆN ĐẠI', badge: 'Áo Nữ' },
  'ao-dai-tay-nu': { title: 'ÁO DÀI TAY NỮ', badge: 'Áo Nữ' },
  'ao-thun-nu': { title: 'ÁO THUN & POLO NỮ', badge: 'Áo Nữ' },
  'quan-nu': { title: 'QUẦN & VÁY NỮ', badge: 'Thời trang Nữ' },
  'jogger-nu': { title: 'JOGGER & PANTS NỮ', badge: 'Quần Nữ' },
  'legging-nu': { title: 'QUẦN LEGGING TẬP LUYỆN', badge: 'Quần Nữ' },
  'shorts-nu': { title: 'QUẦN SHORTS NỮ', badge: 'Quần Nữ' },
  'vay-dam': { title: 'VÁY - ĐẦM NỮ XU HƯỚNG', badge: 'Thời trang Nữ' },

  // Thể thao
  'the-thao': { title: 'ĐỒ THỂ THAO CHUYÊN DỤNG', badge: 'Activewear' },
  'the-thao-nam': { title: 'THỂ THAO NAM', badge: 'Activewear' },
  'the-thao-nu': { title: 'THỂ THAO NỮ', badge: 'Activewear' },
  'chay-bo-nam': { title: 'TRANG PHỤC CHẠY BỘ NAM', badge: 'Running' },
  'bong-da-nam': { title: 'ĐỒ BÓNG ĐÁ NAM', badge: 'Football' },
  'cau-long-nam': { title: 'ĐỒ CẦU LÔNG NAM', badge: 'Badminton' },
  'gym-nam': { title: 'ĐỒ TẬP GYM NAM', badge: 'Training' },
  'gym-nu': { title: 'ĐỒ TẬP GYM NỮ', badge: 'Fitness' },
  'cau-long-nu': { title: 'ĐỒ CẦU LÔNG NỮ', badge: 'Badminton' },
  'pickleball-nu': { title: 'ĐỒ PICKLEBALL NỮ', badge: 'Pickleball' },

  // Phụ kiện
  'phu-kien': { title: 'PHỤ KIỆN THỜI TRANG CAO CẤP', badge: 'Phụ kiện' },
};

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Slider Banner
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);

  // Sắp xếp sản phẩm khi đang ở trang lọc
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-asc', 'price-desc', 'name-asc'

  // Dữ liệu sản phẩm lọc từ API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form khuyến mãi
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribedToast, setSubscribedToast] = useState(false);

  // Trích xuất các query parameters từ URL
  const categoryParam = searchParams.get('category');
  const genderParam = searchParams.get('gender');
  const collectionParam = searchParams.get('collection');
  const occasionParam = searchParams.get('occasion');
  const saleParam = searchParams.get('sale');
  const qParam = searchParams.get('q');

  const hasActiveFilter = Boolean(
    categoryParam || genderParam || collectionParam || occasionParam || saleParam || qParam
  );

  // Tiêu đề & huy hiệu hiển thị theo bộ lọc
  const filterInfo = useMemo(() => {
    if (categoryParam && FILTER_META[categoryParam]) {
      return FILTER_META[categoryParam];
    }
    if (genderParam === 'nam') {
      return { title: 'THỜI TRANG NAM CAO CẤP', badge: 'Dành cho Nam' };
    }
    if (genderParam === 'nu') {
      return { title: 'THỜI TRANG NỮ THANH LỊCH', badge: 'Dành cho Nữ' };
    }
    if (collectionParam === 'thu-dong') {
      return { title: 'BỘ SƯU TẬP THU ĐÔNG 2026', badge: 'Lookbook Mới' };
    }
    if (collectionParam === 'hoang-sao') {
      return { title: 'BỘ SƯU TẬP HOÀNG SAO X COOLMATE', badge: 'Limited Edition' };
    }
    if (collectionParam === 'seamless-motion') {
      return { title: 'BỘ SƯU TẬP SEAMLESS MOTION', badge: 'Activewear' };
    }
    if (collectionParam === 'run-safe') {
      return { title: 'RUN SAFE IN THE DARK COLLECTION', badge: 'Chạy bộ ban đêm' };
    }
    if (collectionParam === 'zeromark') {
      return { title: 'BỘ SƯU TẬP ZEROMARK™', badge: 'High Performance' };
    }
    if (collectionParam === 'cau-long') {
      return { title: 'BỘ SƯU TẬP CẦU LÔNG CHUYÊN NGHIỆP', badge: 'Cầu lông' };
    }
    if (occasionParam === 'hang-ngay') {
      return { title: 'TRANG PHỤC MẶC HÀNG NGÀY (DAILY WEAR)', badge: 'Nhu cầu' };
    }
    if (occasionParam === 'o-nha') {
      return { title: 'TRANG PHỤC MẶC Ở NHÀ & THƯ GIÃN', badge: 'Nhu cầu' };
    }
    if (occasionParam === 'the-thao') {
      return { title: 'TRANG PHỤC TẬP LUYỆN THỂ THAO', badge: 'Nhu cầu' };
    }
    if (saleParam === 'true' || saleParam === '1') {
      return { title: 'SẢN PHẨM ƯU ĐÃI ĐẶC BIỆT (UP TO 50%)', badge: 'Ưu đãi HOT' };
    }
    if (qParam) {
      return { title: `KẾT QUẢ TÌM KIẾM CHO: "${qParam}"`, badge: 'Tìm kiếm' };
    }
    return { title: 'DANH SÁCH SẢN PHẨM', badge: 'Sản phẩm' };
  }, [categoryParam, genderParam, collectionParam, occasionParam, saleParam, qParam]);

  // Khởi tạo Lenis và ScrollTrigger mượt mà
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    const reqId = requestAnimationFrame(raf);

    lenis.on('scroll', ScrollTrigger.update);
    const updateTicker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    const revealElements = gsap.utils.toArray('.reveal-on-scroll');
    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => {
      cancelAnimationFrame(reqId);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Autoplay Slider Banner khi ở Trang chủ (không có filter)
  useEffect(() => {
    if (!isPlaying || hasActiveFilter) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, hasActiveFilter]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  // Chỉ gọi API tải sản phẩm KHI NGƯỜI DÙNG BẬT BỘ LỌC (hasActiveFilter = true)
  useEffect(() => {
    if (!hasActiveFilter) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true);
        const params = {};
        if (categoryParam) params.category = categoryParam;
        if (genderParam) params.gender = genderParam;
        if (collectionParam) params.collection = collectionParam;
        if (occasionParam) params.occasion = occasionParam;
        if (saleParam) params.sale = saleParam;
        if (qParam) params.q = qParam;

        const res = await api.get('/products', { params });

        let list = [];
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res.data?.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data?.items)) {
          list = res.data.items;
        } else if (Array.isArray(res.data?.products)) {
          list = res.data.products;
        }

        if (isMounted) {
          setProducts(list);
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm bộ lọc:', err);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFilteredProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [categoryParam, genderParam, collectionParam, occasionParam, saleParam, qParam, hasActiveFilter]);
  // Danh sách chip bộ lọc đang bật (đặt sau khối filterInfo)
  const activeChips = [
    categoryParam && {
      key: 'category',
      label: 'Danh mục',
      value: FILTER_META[categoryParam]?.title || categoryParam,
      dot: 'bg-amber-400',
    },
    genderParam && {
      key: 'gender',
      label: 'Giới tính',
      value: genderParam === 'nam' ? 'Nam' : 'Nữ',
      dot: 'bg-blue-400',
    },
    collectionParam && {
      key: 'collection',
      label: 'BST',
      value: collectionParam,
      dot: 'bg-purple-400',
    },
    occasionParam && {
      key: 'occasion',
      label: 'Nhu cầu',
      value: occasionParam,
      dot: 'bg-emerald-400',
    },
    saleParam && {
      key: 'sale',
      label: 'Ưu đãi',
      value: 'Sale đến 50%',
      dot: 'bg-red-400',
    },
    qParam && {
      key: 'q',
      label: 'Từ khóa',
      value: `“${qParam}”`,
      dot: 'bg-sky-400',
    },
  ].filter(Boolean);
  // Sắp xếp sản phẩm theo tiêu chí
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [products, sortBy]);

  // Xóa toàn bộ bộ lọc và trở về trang chủ nguyên bản
  const handleClearAllFilters = () => {
    navigate('/');
  };
  // Xóa riêng một bộ lọc (đặt sau handleClearAllFilters)
  const removeParam = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    const qs = next.toString();
    navigate(qs ? `/?${qs}` : '/');
  };
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribedToast(true);
    setTimeout(() => {
      setSubscribedToast(false);
      setNewsletterEmail('');
    }, 4000);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white text-gray-900 font-['Be_Vietnam_Pro',sans-serif] select-none overflow-x-hidden"
    >
      {/* ================= TOP ANNOUNCEMENT BAR ================= */}
      <div className="relative overflow-hidden bg-[#04061a] text-white text-[11px] font-bold py-2.5 px-4 uppercase tracking-[0.18em] flex items-center justify-center gap-4 sm:gap-6">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

        <span className="flex items-center gap-1.5 text-amber-300">
          <Sparkles className="w-3.5 h-3.5" /> ƯU ĐÃI ĐẶC QUYỀN
        </span>
        <span className="hidden md:block h-1 w-1 rotate-45 bg-white/40" />
        <span>MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 200.000Đ</span>
        <span className="hidden sm:block h-1 w-1 rotate-45 bg-white/40" />
        <span className="hidden sm:inline text-white/60">HOTLINE CSKH: 1900 8079</span>
      </div>

      {/* ========================================================================= */}
      {/* TRƯỜNG HỢP 1: KHI CÓ FILTER -> HIỂN THỊ TRANG KẾT QUẢ LỌC SẢN PHẨM ====== */}
      {/* ========================================================================= */}
      {hasActiveFilter ? (
        <main className="w-full bg-white min-h-[70vh] pb-20">
          {/* Header bộ lọc */}
          <section className="relative overflow-hidden bg-[#060a1c] text-white border-b border-white/10">
            {/* Quầng sáng màu */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
        radial-gradient(ellipse 45% 90% at 5% 0%, rgba(60,90,220,0.38) 0%, transparent 70%),
        radial-gradient(ellipse 40% 80% at 100% 100%, rgba(200,110,70,0.32) 0%, transparent 70%),
        radial-gradient(ellipse 30% 60% at 55% 120%, rgba(120,70,150,0.25) 0%, transparent 70%)
      `,
              }}
            />
            {/* Lưới chấm mịn */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            {/* Đường gradient mép trên */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

            {/* Chữ watermark outline theo bộ lọc */}
            <span
              className="hidden lg:block absolute right-6 -bottom-8 whitespace-nowrap text-[140px] leading-none font-black uppercase tracking-tighter text-transparent pointer-events-none select-none"
              style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.07)' }}
            >
              {filterInfo.badge}
            </span>

            <div className="relative max-w-[1900px] mx-auto px-4 md:px-[90px] py-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                {/* Trái: breadcrumb + tiêu đề */}
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]">
                    <Link to="/" className="text-white/55 hover:text-white transition">
                      Trang chủ
                    </Link>
                    <ChevronRight className="w-3 h-3 text-white/35" />
                    <span className="text-amber-300">{filterInfo.badge}</span>
                  </div>

                  <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-[1.05]">
                    {filterInfo.title}
                  </h1>
                  <div className="mt-5 h-[3px] w-16 rounded-full bg-gradient-to-r from-blue-400 to-transparent" />
                </div>

                {/* Phải: số lượng outline + nút xóa */}
                <div className="flex items-end gap-6 shrink-0">
                  <div className="text-right">
                    <span
                      className="block text-[64px] sm:text-[80px] leading-none font-black text-transparent"
                      style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.85)' }}
                    >
                      {loading ? '…' : String(sortedProducts.length).padStart(2, '0')}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                      sản phẩm
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 backdrop-blur-md px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:bg-white hover:text-black cursor-pointer active:scale-95"
                  >
                    <X className="w-4 h-4" /> Xóa bộ lọc
                  </button>
                </div>
              </div>

              {/* Chip bộ lọc đang bật */}
              <div className="mt-8 flex items-center gap-2.5 flex-wrap border-t border-white/10 pt-5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                  <Filter className="w-3.5 h-3.5 text-amber-300" /> Đang lọc
                </span>

                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md pl-3 pr-2 py-1.5 text-xs font-bold"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                    <span className="text-white/50 font-semibold">{chip.label}:</span>
                    <span className="text-white max-w-[240px] truncate">{chip.value}</span>
                    <button
                      type="button"
                      onClick={() => removeParam(chip.key)}
                      aria-label={`Bỏ bộ lọc ${chip.label}`}
                      className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white/60 transition-all duration-300 hover:bg-white hover:text-black group-hover:rotate-90 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Khu vực danh sách sản phẩm đã lọc */}
          <section className="w-full py-10">
            <div className="w-full max-w-[1900px] mx-auto px-4 md:px-[90px]">
              {/* Toolbar sắp xếp */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                  <SlidersHorizontal className="w-4 h-4 text-black" />
                  <span>Sản phẩm phù hợp ({sortedProducts.length})</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="default">Mới nhất (Mặc định)</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="name-asc">Tên: A - Z</option>
                  </select>
                </div>
              </div>

              {/* TRẠNG THÁI 1: ĐANG TẢI (SKELETON LOADER) */}
              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(8)].map((_, idx) => (
                    <div key={idx} className="flex flex-col space-y-3 animate-pulse">
                      <div className="aspect-[3/4] w-full bg-gray-200 rounded-2xl" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {/* TRẠNG THÁI 2: KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP */}
              {!loading && sortedProducts.length === 0 && (
                <div className="py-20 px-4 text-center max-w-lg mx-auto flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                    <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">
                    Không tìm thấy sản phẩm nào phù hợp
                  </h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Rất tiếc, hiện tại không có sản phẩm nào đáp ứng đúng tiêu chí tìm kiếm của bạn. Hãy thử chọn danh mục khác hoặc quay lại trang chủ.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md transition cursor-pointer active:scale-95"
                  >
                    Quay lại trang chủ
                  </button>
                </div>
              )}

              {/* TRẠNG THÁI 3: LƯỚI SẢN PHẨM THỰC TẾ */}
              {!loading && sortedProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {sortedProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      ) : (
        /* ========================================================================= */
        /* TRƯỜNG HỢP 2: TRANG CHỦ NGUYÊN BẢN (KHÔNG HIỂN THỊ SẢN PHẨM) ============ */
        /* ========================================================================= */
        <main>
          {/* ================= SECTION 1: HERO SLIDER CHUẨN OWEN ================= */}
          <section className="relative w-screen left-1/2 -translate-x-1/2 pt-[30px] pb-[35px] overflow-hidden select-none">
            {/* Nền mờ Ambient */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {BANNER_SLIDES.map((slide, idx) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover filter blur-[45px] scale-125 brightness-105 transition-opacity duration-800 ease-in-out ${idx === activeSlide ? 'opacity-85' : 'opacity-0'
                    }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-[#b9c4cc]/50 via-transparent to-[#e3e7ea]/45" />
            </div>

            {/* Khung Banner */}
            <div className="relative z-10 w-full max-w-[1900px] mx-auto px-4 md:px-[90px]">
              <div className="group relative w-full aspect-[1719/698] rounded-[12px] border-2 border-white/90 overflow-hidden bg-neutral-900 shadow-none">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute top-4 left-5 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition cursor-pointer"
                  title={isPlaying ? 'Tạm dừng tự động' : 'Tiếp tục tự động'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                {BANNER_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-800 ease-in-out ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                    >
                      <Link to={slide.link} className="block w-full h-full">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className={`w-full h-full object-cover object-center transition-transform duration-1200 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'scale-100' : 'scale-106'
                            }`}
                        />
                      </Link>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Slide trước"
                  className="absolute left-[26px] top-1/2 -translate-y-1/2 z-30 w-[34px] h-[34px] rounded-[6px] border border-white bg-white/15 hover:bg-white/35 text-white flex items-center justify-center transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
                >
                  <ChevronLeft className="w-[18px] h-[18px] stroke-[2]" />
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Slide kế tiếp"
                  className="absolute right-[26px] top-1/2 -translate-y-1/2 z-30 w-[34px] h-[34px] rounded-[6px] border border-white bg-white/15 hover:bg-white/35 text-white flex items-center justify-center transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
                >
                  <ChevronRight className="w-[18px] h-[18px] stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Chấm phân trang */}
            <div className="relative z-10 flex items-center justify-center gap-[7.7px] mt-[24px]">
              {BANNER_SLIDES.map((_, dotIdx) => {
                const isDotActive = dotIdx === activeSlide;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setActiveSlide(dotIdx)}
                    aria-label={`Chuyển đến slide ${dotIdx + 1}`}
                    className={`w-[10px] h-[10px] rounded-full border-[1.5px] border-white transition-all duration-300 cursor-pointer ${isDotActive ? 'bg-white' : 'bg-transparent'
                      }`}
                  />
                );
              })}
            </div>
          </section>

          {/* ================= SECTION 2: LƯỚI 4 CỘT DANH MỤC CHUẨN OWEN ================= */}
          <section className="w-full bg-white py-10 sm:py-14 select-none">
            <div className="w-full max-w-[1900px] mx-auto px-4 md:px-[90px]">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 lg:pb-12">
                {FOUR_PILLARS.map((col, idx) => (
                  <Link
                    key={idx}
                    to={col.link}
                    className={`group relative block w-full aspect-[3/4.2] overflow-hidden rounded-t-[999px] rounded-b-[16px] bg-[#eef1f4] cursor-pointer shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(27,60,150,0.55)] ${idx % 2 === 1 ? 'lg:translate-y-12' : ''
                      }`}
                  >
                    {/* Ảnh */}
                    <img
                      src={col.img}
                      alt={col.name}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                    />

                    {/* Gradient để chữ luôn đọc được trên mọi ảnh */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                    {/* Khung viền vòm mảnh, hover nở ra */}
                    <div className="absolute inset-3 sm:inset-4 rounded-t-[999px] rounded-b-[10px] border border-white/40 transition-all duration-500 group-hover:inset-2 group-hover:border-white/80 pointer-events-none" />

                    {/* Nội dung đáy */}
                    <div className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 pb-6 sm:pb-8 flex flex-col items-center text-center pointer-events-none">
                      {/* Số thứ tự rỗng ruột */}
                      <span
                        className="font-['Be_Vietnam_Pro',sans-serif] text-[36px] sm:text-[52px] font-black leading-none text-transparent"
                        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.75)' }}
                      >

                      </span>

                      <h3 className="mt-2 font-['Be_Vietnam_Pro',sans-serif] font-black text-[18px] sm:text-[24px] lg:text-[26px] uppercase tracking-[0.12em] text-white m-0">
                        {col.name}
                      </h3>

                      {/* Đường kẻ nở ra khi hover */}
                      <span className="mt-3 h-px w-8 bg-white/70 transition-all duration-500 group-hover:w-24" />

                      {/* Nút: mobile luôn hiện, desktop trượt lên khi hover */}
                      <span className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/60 bg-white/10 px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.15em] text-white backdrop-blur-md transition-all duration-500 group-hover:bg-[#1b3c96] group-hover:border-[#1b3c96] lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                        Xem sản phẩm
                        <svg
                          className="w-[1em] h-[1em] transition-transform duration-300 group-hover:translate-x-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: VIDEO CAMPAIGN KHUNG KIM LOẠI ================= */}
          <section className="w-full bg-white pb-14 sm:pb-20 select-none">
            <div className="w-full max-w-[1900px] mx-auto px-4 md:px-[90px]">
              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[1719/760] rounded-[16px] sm:rounded-[20px] p-[5px] sm:p-[6px] bg-gradient-to-b from-[#b8c2cc] via-[#8d97a3] to-[#717b87] shadow-2xl overflow-hidden">
                <div className="relative w-full h-full rounded-[11px] sm:rounded-[14px] overflow-hidden bg-black border border-white/20">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover object-center"
                    src="https://owen.cdn.vccloud.vn/media/amasty/ampromobanners/video_home_4s.mp4"
                  >
                    <source
                      src="https://owen.cdn.vccloud.vn/media/amasty/ampromobanners/video_home_4s.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 4: MUA SẮM AN TÂM CÙNG THAITRINH ================= */}
          <section className="w-full bg-white pb-14 sm:pb-20 select-none">
            <div className="w-full max-w-[1900px] mx-auto px-4 md:px-[90px]">
              <div className="relative w-full rounded-[16px] sm:rounded-[20px] py-12 sm:py-16 px-6 sm:px-12 overflow-hidden shadow-xs border border-gray-100 flex flex-col items-center">
                <img
                  src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1800&auto=format&fit=crop&q=80"
                  alt="Owen Fabric Texture"
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[1.03] contrast-[0.95]"
                />
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" />

                <div className="relative z-10 w-full flex flex-col items-center">
                  <h2 className="font-['Be_Vietnam_Pro',sans-serif] font-black text-xl sm:text-2xl lg:text-[26px] uppercase tracking-wide text-[#152a70] mb-12 sm:mb-16 text-center">
                    MUA SẮM AN TÂM CÙNG THAITRINH
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-14 w-full max-w-4xl">
                    {/* MỤC 1: MIỄN PHÍ VẬN CHUYỂN */}
                    <div className="flex flex-col items-center group">
                      <div className="w-[84px] h-[84px] rounded-full bg-[#152a70] text-white flex items-center justify-center shadow-md z-10 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 16H14M4 22H11M7 28H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                          <rect x="14" y="14" width="18" height="17" rx="1.5" stroke="white" strokeWidth="2.5" />
                          <path d="M32 20H39L43 25V31H32V20Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                          <text x="17" y="25" fill="white" fontSize="7" fontWeight="900" fontFamily="sans-serif">FREE</text>
                          <circle cx="21" cy="33" r="3.5" fill="white" />
                          <circle cx="37" cy="33" r="3.5" fill="white" />
                        </svg>
                      </div>

                      <div className="-mt-[42px] pt-[50px] pb-4 px-6 w-full max-w-[240px] rounded-[14px] border-[1.5px] border-[#152a70] bg-white/90 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
                        <span className="w-full py-1 px-2.5 rounded-[4px] bg-[#152a70] text-white text-[10.5px] font-black uppercase tracking-wider mb-2 whitespace-nowrap">
                          MIỄN PHÍ VẬN CHUYỂN
                        </span>
                        <p className="text-xs sm:text-[13px] text-gray-800 font-medium">
                          Đơn từ <strong className="font-black text-[#152a70] text-sm">450.000Đ</strong>
                        </p>
                      </div>
                    </div>

                    {/* MỤC 2: ĐỔI HÀNG DỄ DÀNG */}
                    <div className="flex flex-col items-center group">
                      <div className="w-[84px] h-[84px] rounded-full bg-[#152a70] text-white flex items-center justify-center shadow-md z-10 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 14L22 10L28 14L22 18L16 14Z" fill="white" />
                          <path d="M16 14V21L22 25V18L16 14Z" fill="white" fillOpacity="0.8" />
                          <path d="M28 14V21L22 25V18L28 14Z" fill="white" fillOpacity="0.9" />
                          <path d="M22 27L28 23L34 27L28 31L22 27Z" fill="white" />
                          <path d="M22 27V34L28 38V31L22 27Z" fill="white" fillOpacity="0.8" />
                          <path d="M34 27V34L28 38V31L34 27Z" fill="white" fillOpacity="0.9" />
                          <path d="M30 16C33 18 34 21 33 24M18 30C15 28 14 25 15 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>

                      <div className="-mt-[42px] pt-[50px] pb-4 px-6 w-full max-w-[240px] rounded-[14px] border-[1.5px] border-[#152a70] bg-white/90 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
                        <span className="w-full py-1 px-2.5 rounded-[4px] bg-[#152a70] text-white text-[10.5px] font-black uppercase tracking-wider mb-2 whitespace-nowrap">
                          ĐỔI HÀNG DỄ DÀNG
                        </span>
                        <p className="text-xs sm:text-[13px] text-gray-800 font-medium">
                          Trong <strong className="font-black text-[#152a70] text-sm">30 NGÀY</strong>
                        </p>
                      </div>
                    </div>

                    {/* MỤC 3: LÊN LAI/GẤU QUẦN MIỄN PHÍ */}
                    <div className="flex flex-col items-center group">
                      <div className="w-[84px] h-[84px] rounded-full bg-[#152a70] text-white flex items-center justify-center shadow-md z-10 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 11H32V16L29 37H25L24 23L23 37H19L16 16V11Z" fill="white" />
                          <line x1="13" y1="32" x2="35" y2="32" stroke="#152a70" strokeWidth="2.5" strokeDasharray="2.5 2" />
                        </svg>
                      </div>

                      <div className="-mt-[42px] pt-[50px] pb-4 px-4 sm:px-5 w-full max-w-[240px] rounded-[14px] border-[1.5px] border-[#152a70] bg-white/90 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
                        <span className="w-full py-1 px-2 rounded-[4px] bg-[#152a70] text-white text-[10.5px] font-black uppercase tracking-wider mb-1.5 whitespace-nowrap">
                          LÊN LAI/GẤU QUẦN
                        </span>
                        <div className="text-center leading-tight">
                          <span className="block font-black text-[#152a70] text-sm tracking-wide">
                            MIỄN PHÍ
                          </span>
                          <span className="block text-[10.5px] text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                            Tại hệ thống cửa hàng
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 5: TIN TỨC / SỰ KIỆN (CHUẨN GIAO DIỆN OWEN) ================= */}
          <section
            className="relative w-screen left-1/2 -translate-x-1/2 pt-16 pb-28 text-white select-none overflow-hidden bg-black bg-no-repeat"
            style={{
              backgroundImage: `url('https://owen.cdn.vccloud.vn/static/version1787908650/frontend/Owen/owen2021/vi_VN/images/blog_bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
            }}
          >
            <div className="relative z-10 w-full max-w-[1460px] mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                {NEWS_EVENTS.map((item, index) => {
                  const isExpanded = activeNewsIndex === index;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveNewsIndex(index)}
                      className={`group relative min-w-0 rounded-[16px] overflow-hidden border border-white/40 flex flex-col cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'lg:flex-[1.75_1_0%]' : 'lg:flex-[1_1_0%]'
                        }`}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {/* Ảnh phía trên */}
                      <div className="relative w-full h-[220px] sm:h-[320px] lg:h-[410px] shrink-0 overflow-hidden bg-white">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                        />
                      </div>

                      {/* Khối nội dung */}
                      <div
                        className="relative flex-1 flex flex-col justify-start p-5 sm:p-7 lg:p-[40px_40px_32px_40px]"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(140,146,176,0.30) 0%, rgba(118,124,152,0.22) 50%, rgba(255,255,255,0.08) 100%)',
                          backdropFilter: 'blur(24px) saturate(115%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(115%)',
                          borderTop: '1px solid rgba(255,255,255,0.10)',
                        }}
                      >
                        <div>
                          <h3
                            className="font-['Be_Vietnam_Pro',sans-serif] font-semibold text-[18px] sm:text-[22px] lg:text-[26px] text-white uppercase tracking-normal leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis m-0"
                            title={item.title}
                          >
                            {item.title}
                          </h3>
                          <span className="block text-[14px] sm:text-[16px] lg:text-[19px] font-normal text-white/85 mt-[10px]">
                            {item.date}
                          </span>
                        </div>

                        <div className="mt-[16px] sm:mt-[20px] lg:mt-[28px]">
                          <span className="inline-flex items-center text-[14px] sm:text-[16px] lg:text-[19px] font-semibold text-white">
                            <span>Xem chi tiết</span>
                            <svg
                              className="ml-[6px] w-[1em] h-[1em] transition-transform duration-300 group-hover:translate-x-1"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================= SECTION 6: ĐĂNG KÝ NHẬN KHUYẾN MÃI (GLASSMORPHISM) ================= */}
          <section className="relative w-full py-28 bg-neutral-900 text-white overflow-hidden reveal-on-scroll">
            <div className="absolute inset-0 opacity-40">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=80"
                alt="Newsletter Background"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="relative max-w-xl mx-auto px-6 text-center">
              <div className="bg-white/20 backdrop-blur-[16px] p-8 sm:p-12 rounded-[24px] border border-white/40 shadow-2xl space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                  ĐĂNG KÝ NHẬN KHUYẾN MÃI
                </h3>
                <p className="text-xs text-gray-200 font-light">
                  Đừng bỏ lỡ hàng ngàn sản phẩm ưu đãi và chương trình siêu hấp dẫn từ THAITRINH.
                </p>

                <form onSubmit={handleNewsletterSubmit} className="space-y-3 pt-3">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-white text-gray-900 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-[#1e3a9e] transition text-center shadow-inner"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1e3a9e] hover:bg-white hover:text-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer shadow-lg active:scale-98"
                  >
                    ĐĂNG KÝ NGAY
                  </button>
                </form>

                {subscribedToast && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 pt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã đăng ký nhận tin thành công!</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* NÚT MESSENGER & ZALO NỔI MÉP PHẢI */}
      <aside className="fixed right-0 top-[576px] z-40 flex flex-col gap-[12px] pointer-events-auto">
        <a
          href="https://m.me"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat Messenger"
          className="w-[60px] h-[60px] bg-[#222222]/95 hover:bg-[#1e3a9e] border-y border-l border-white/25 flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:-translate-x-1 cursor-pointer rounded-l-[12px]"
        >
          <MessageSquare className="w-[26px] h-[26px] stroke-[1.8]" />
        </a>

        <a
          href="https://zalo.me"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat Zalo"
          className="w-[60px] h-[60px] bg-[#222222]/95 hover:bg-[#2b4fd0] border-y border-l border-white/25 flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:-translate-x-1 cursor-pointer rounded-l-[12px]"
        >
          <span className="font-black text-[13px] tracking-tight">Zalo</span>
        </a>
      </aside>
    </div>
  );
}
