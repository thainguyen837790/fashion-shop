import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, X, TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// ================= DỮ LIỆU MEGA MENU =================
const OCCASIONS = [
  { label: 'MẶC HÀNG NGÀY', link: '/?occasion=hang-ngay' },
  { label: 'MẶC Ở NHÀ', link: '/?occasion=o-nha' },
  { label: 'MẶC THỂ THAO', link: '/?occasion=the-thao' },
];

const SPORT_FEATURED_COLLECTIONS = [
  { label: 'HOÀNG SAO X COOLMATE', link: '/?collection=hoang-sao' },
  { label: 'SEAMLESS MOTION', link: '/?collection=seamless-motion' },
  { label: 'RUN SAFE IN THE DARK', link: '/?collection=run-safe' },
  { label: 'ZEROMARK™', link: '/?collection=zeromark' },
];

const MEGA_MENU = {
  men: {
    watermark: 'NAM',
    columns: [
      {
        title: 'ÁO NAM',
        link: '/?category=ao-nam',
        items: [
          { label: 'Tất cả áo', link: '/?category=ao-nam' },
          { label: 'Áo Khoác Nam', link: '/?category=ao-khoac' },
          { label: 'Áo Dài Tay & Hoodies', link: '/?category=ao-dai-tay' },
          { label: 'Áo Thun Thể Thao', link: '/?category=ao-thun' },
          { label: 'Áo Polo & Sơ Mi', link: '/?category=ao-so-mi' },
          { label: 'Áo Ba Lỗ (Tanktop)', link: '/?category=ao-tanktop' },
        ],
      },
      {
        title: 'QUẦN NAM',
        link: '/?category=quan-nam',
        items: [
          { label: 'Tất cả quần', link: '/?category=quan-nam' },
          { label: 'Quần Short Thể Thao', link: '/?category=quan-short' },
          { label: 'Quần Dài Kaki & Jeans', link: '/?category=quan-kaki' },
          { label: 'Quần Jogger & Pants', link: '/?category=quan-jogger' },
        ],
      },
    ],
    banner: {
      img: 'https://owen.vn/media/catalog/category/cate_ao1_11zon.jpg',
      fallback: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1400',
      alt: 'Bộ sưu tập nam',
      link: '/?gender=nam',
    },
    bottomLabel: 'THEO NHU CẦU',
    bottomLinks: OCCASIONS,
  },
  women: {
    watermark: 'NỮ',
    columns: [
      {
        title: 'ÁO NỮ',
        link: '/?category=ao-nu',
        items: [
          { label: 'Tất cả áo', link: '/?category=ao-nu' },
          { label: 'Áo Khoác', link: '/?category=ao-khoac-nu' },
          { label: 'Áo Dài Tay', link: '/?category=ao-dai-tay-nu' },
          { label: 'Áo Thun & Polo', link: '/?category=ao-thun-nu' },
        ],
      },
      {
        title: 'QUẦN & VÁY NỮ',
        link: '/?category=quan-nu',
        items: [
          { label: 'Tất cả quần', link: '/?category=quan-nu' },
          { label: 'Jogger & Pants', link: '/?category=jogger-nu' },
          { label: 'Quần Legging', link: '/?category=legging-nu' },
          { label: 'Quần Shorts', link: '/?category=shorts-nu' },
          { label: 'Váy - Đầm', link: '/?category=vay-dam' },
        ],
      },
    ],
    banner: {
      img: 'https://elise.vn/media/wysiwyg/A-2026/cv-tp.jpg',
      fallback: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1400',
      alt: 'Bộ sưu tập nữ',
      link: '/?gender=nu',
    },
    bottomLabel: 'THEO NHU CẦU',
    bottomLinks: OCCASIONS,
  },
  sport: {
    watermark: 'SPORT',
    columns: [
      {
        title: 'THỂ THAO NAM',
        link: '/?category=the-thao-nam',
        items: [
          { label: 'Chạy bộ', link: '/?category=chay-bo-nam' },
          { label: 'Bóng đá', link: '/?category=bong-da-nam' },
          { label: 'Cầu lông', link: '/?category=cau-long-nam' },
          { label: 'Gym', link: '/?category=gym-nam' },
        ],
      },
      {
        title: 'THỂ THAO NỮ',
        link: '/?category=the-thao-nu',
        items: [
          { label: 'Gym', link: '/?category=gym-nu' },
          { label: 'Cầu lông', link: '/?category=cau-long-nu' },
          { label: 'Pickleball', link: '/?category=pickleball-nu' },
        ],
      },
    ],
    banner: {
      img: 'https://mcdn.coolmate.me/uploads/2026/08/06/masterhero_banner_desk.jpg?aio=w-1920',
      fallback: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400',
      alt: 'Bộ sưu tập thể thao',
      link: '/?category=the-thao',
    },
    bottomLabel: 'NỔI BẬT',
    bottomLinks: SPORT_FEATURED_COLLECTIONS,
  },
};

const NAV_ITEMS = [
  { key: 'men', label: 'NAM', to: '/?gender=nam' },
  { key: 'women', label: 'NỮ', to: '/?gender=nu' },
  { key: 'sport', label: 'THỂ THAO', to: '/?category=the-thao' },
];

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [displayMenu, setDisplayMenu] = useState('men');
  const searchContainerRef = useRef(null);
  const closeTimer = useRef(null);

  const hotKeywords = ['Áo thun Cotton', 'Quần short nam', 'Áo Polo thể thao', 'Áo sơ mi'];

  const openMenu = (key) => {
    clearTimeout(closeTimer.current);
    setActiveMenu(key);
    setDisplayMenu(key);
  };
  const closeMenu = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };
  const closeNow = () => {
    clearTimeout(closeTimer.current);
    setActiveMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setIsFocused(false);
      navigate(`/?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const mega = MEGA_MENU[displayMenu];
  const isOpen = Boolean(activeMenu);

  const navLinkBase =
    'relative h-full flex items-center text-[13px] font-black uppercase tracking-wider transition-colors';
  const Underline = ({ active }) => (
    <span
      className={`absolute left-0 right-0 bottom-3 mx-auto h-[2px] bg-black origin-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}
    />
  );

  // Hiệu ứng trượt vào lần lượt cho các phần tử trong menu
  const reveal = (i) => ({
    className: `transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    }`,
    style: { transitionDelay: isOpen ? `${90 + i * 45}ms` : '0ms' },
  });

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 select-none"
        onMouseLeave={closeMenu}
      >
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* LOGO */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              onClick={closeNow}
              className="text-xl sm:text-2xl font-black tracking-tighter text-black flex items-center"
            >
              THAITRINH<span className="text-blue-600">.</span>
            </Link>
          </div>

          {/* MENU ĐIỀU HƯỚNG CHÍNH */}
          <nav className="hidden lg:flex items-center gap-9 h-full">
            <Link
              to="/?collection=thu-dong"
              onMouseEnter={closeNow}
              className={`group ${navLinkBase} text-blue-600`}
            >
              THU ĐÔNG
              <span className="absolute left-0 right-0 bottom-3 mx-auto h-[2px] bg-blue-600 origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                onMouseEnter={() => openMenu(item.key)}
                onClick={closeNow}
                className={`group ${navLinkBase} ${
                  activeMenu === item.key ? 'text-black' : 'text-gray-900'
                }`}
              >
                {item.label}
                <Underline active={activeMenu === item.key} />
              </Link>
            ))}

            <Link
              to="/?category=phu-kien"
              onMouseEnter={closeNow}
              className={`group ${navLinkBase} text-gray-900`}
            >
              PHỤ KIỆN
              <Underline active={false} />
            </Link>

            <Link
              to="/?sale=true"
              onMouseEnter={closeNow}
              className={`group ${navLinkBase} text-red-600 hover:opacity-85`}
            >
              <span className="absolute top-2 -right-5 rounded-full bg-red-600 px-1.5 py-[1px] text-[9px] font-bold text-white tracking-tight">
                -50%
              </span>
              SALE
            </Link>
          </nav>

          {/* CỤM PHẢI: TÌM KIẾM + GIỎ HÀNG + ADMIN / USER */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" onMouseEnter={closeNow}>
            {/* TÌM KIẾM */}
            <div ref={searchContainerRef} className="relative">
              <form
                onSubmit={handleSearch}
                className={`relative flex items-center transition-all duration-300 rounded-full border ${
                  isFocused
                    ? 'w-60 sm:w-72 md:w-80 bg-white border-black ring-2 ring-black/5 shadow-md'
                    : 'w-44 sm:w-56 md:w-64 bg-gray-100/90 border-transparent hover:bg-gray-200/70 hover:border-gray-200'
                }`}
              >
                <input
                  type="text"
                  value={keyword}
                  onFocus={() => setIsFocused(true)}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm sản phẩm, phong cách..."
                  className="w-full pl-4 pr-16 py-2 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />

                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="p-1 mr-1 text-gray-400 hover:text-gray-700 transition rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className={`p-1.5 mr-1 rounded-full transition flex items-center justify-center cursor-pointer ${
                    isFocused ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </form>

              {isFocused && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tìm kiếm phổ biến</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hotKeywords.map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setKeyword(tag);
                          setIsFocused(false);
                          navigate(`/?q=${encodeURIComponent(tag)}`);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition text-gray-700 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GIỎ HÀNG */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded-full transition cursor-pointer"
              title="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {cart?.total_count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  {cart.total_count}
                </span>
              )}
            </Link>

            {/* NÚT ADMIN */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="px-3 py-1 bg-black text-white rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-neutral-800 transition"
              >
                Admin
              </Link>
            )}

            {/* USER PROFILE */}
            {user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-gray-100 transition group"
                title="Thông tin tài khoản"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition">
                  {user.full_name ? user.full_name.trim().charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
                <span className="text-xs font-bold text-gray-900 hidden sm:inline max-w-[120px] truncate">
                  {user.full_name || (user.email ? user.email.split('@')[0] : 'Tài khoản')}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold bg-black text-white rounded-full hover:bg-gray-800 transition"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        {/* ================= BẢNG MEGA MENU NỀN TỐI ================= */}
        <div
          className={`hidden lg:block absolute left-0 right-0 top-full origin-top transform-gpu transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_40px_70px_-30px_rgba(0,0,0,0.7)] ${
            isOpen
              ? 'opacity-100 translate-y-0 visible pointer-events-auto'
              : 'opacity-0 -translate-y-2 invisible pointer-events-none'
          }`}
        >
          {mega && (
            <div className="relative overflow-hidden bg-[#060a1c] text-white">
              {/* Quầng sáng màu: xanh trái, cam nâu phải */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse 45% 70% at 8% 0%, rgba(60,90,220,0.38) 0%, transparent 70%),
                    radial-gradient(ellipse 40% 65% at 100% 100%, rgba(200,110,70,0.32) 0%, transparent 70%),
                    radial-gradient(ellipse 30% 50% at 55% 110%, rgba(120,70,150,0.25) 0%, transparent 70%)
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
              {/* Đường gradient mảnh ở mép trên */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

              {/* Chữ watermark mờ */}
              <span
                className="absolute -left-4 -bottom-12 text-[200px] leading-none font-black tracking-tighter text-transparent pointer-events-none select-none"
                style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.07)' }}
              >
                {mega.watermark}
              </span>

              <div className="relative max-w-[1500px] mx-auto px-8 py-10">
                <div className="grid grid-cols-12 gap-10 items-stretch">
                  {/* CỘT DANH MỤC (4/12) */}
                  <div className="col-span-4 grid grid-cols-2 gap-8">
                    {mega.columns.map((col, cIdx) => (
                      <div key={col.title} className="space-y-4">
                        <div {...reveal(cIdx)}>
                          <Link
                            to={col.link}
                            onClick={closeNow}
                            className="group flex items-center gap-2 text-xs font-black tracking-wider text-white hover:text-blue-300 transition-colors"
                          >
                            <span className="text-[10px] font-bold text-blue-400">
                              {String(cIdx + 1).padStart(2, '0')}
                            </span>
                            <span>{col.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                          </Link>
                          <div className="mt-3 h-px w-full bg-gradient-to-r from-white/25 to-transparent" />
                        </div>

                        <ul className="space-y-0.5">
                          {col.items.map((item, iIdx) => {
                            const r = reveal(cIdx * 3 + iIdx + 2);
                            return (
                              <li key={item.label} className={r.className} style={r.style}>
                                <Link
                                  to={item.link}
                                  onClick={closeNow}
                                  className="group flex items-center py-1.5 text-[13px] font-medium text-white/65 hover:text-white transition-colors"
                                >
                                  <span className="h-px w-0 bg-blue-400 transition-all duration-300 group-hover:w-4 group-hover:mr-2" />
                                  {item.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* BANNER NGANG DUY NHẤT (8/12) */}
                  <div className="col-span-8">
                    <Link
                      to={mega.banner.link}
                      onClick={closeNow}
                      className="group relative block h-[300px] rounded-2xl overflow-hidden bg-neutral-900 ring-1 ring-white/15 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.9)]"
                    >
                      <img
                        src={mega.banner.img}
                        alt={mega.banner.alt}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = mega.banner.fallback;
                        }}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                      {/* Lớp tối nhẹ ở đáy cho nút nổi bật */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                      {/* Khung viền mảnh, hover nở ra */}
                      <div className="absolute inset-3 rounded-xl border border-white/25 transition-all duration-500 group-hover:inset-2 group-hover:border-white/60 pointer-events-none" />

                      {/* Nút tròn góc dưới phải */}
                      <span className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110">
                        <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* THANH CHIP DƯỚI ĐÁY (kính mờ) */}
              <div className="relative bg-white/[0.04] backdrop-blur-md border-t border-white/10 py-3.5">
                <div className="max-w-[1500px] mx-auto px-8 flex items-center gap-5 overflow-x-auto">
                  <span className="text-white/45 font-bold text-[11px] uppercase tracking-[0.2em] whitespace-nowrap">
                    {mega.bottomLabel}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {mega.bottomLinks.map((l) => (
                      <Link
                        key={l.label}
                        to={l.link}
                        onClick={closeNow}
                        className="whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/85 transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* LỚP PHỦ MỜ (hoạt động cho cả 3 menu) */}
      <div
        className={`fixed inset-0 top-16 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 pointer-events-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
