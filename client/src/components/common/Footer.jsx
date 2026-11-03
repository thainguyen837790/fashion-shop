import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, RefreshCw, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-12 mt-auto border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hàng 1: Giá trị cốt lõi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0 text-blue-500">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide">60 ngày đổi trả miễn phí</h4>
              <p className="text-xs text-gray-400 mt-0.5">Đổi trả tận nơi với bất kỳ lý do gì</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0 text-blue-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide">Miễn phí giao hàng</h4>
              <p className="text-xs text-gray-400 mt-0.5">Áp dụng cho mọi đơn hàng từ 200.000đ</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0 text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide">Chất lượng đảm bảo</h4>
              <p className="text-xs text-gray-400 mt-0.5">Tự hào sản xuất tại Việt Nam (Made in Vietnam)</p>
            </div>
          </div>
        </div>

        {/* Hàng 2: Các cột thông tin & Liên kết */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          {/* Cột 1: Thương hiệu */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-black tracking-tight text-white inline-flex items-center">
              THAITRINH<span className="text-blue-600 text-3xl leading-none">.</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Giải pháp mặc đẹp, tối giản và tự tin cho cả nam và nữ. Trải nghiệm mua sắm tiện lợi với dịch vụ khách hàng 100% hài lòng.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-400 border border-blue-400/30 px-2.5 py-1 rounded-full">
                Fashion & AI Sentiment
              </span>
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Khám phá</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link to="/?gender=nam" className="hover:text-white transition">Thời trang nam</Link></li>
              <li><Link to="/?gender=nu" className="hover:text-white transition">Thời trang nữ</Link></li>
              <li><Link to="/?category=ao-thun" className="hover:text-white transition">Áo thun thể thao & dạo phố</Link></li>
              <li><Link to="/?category=ao-so-mi" className="hover:text-white transition">Áo sơ mi công sở</Link></li>
              <li><Link to="/?category=dam-vay" className="hover:text-white transition">Đầm & Váy nữ</Link></li>
            </ul>
          </div>

          {/* Cột 3: Dịch vụ khách hàng */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Dịch vụ khách hàng</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="#rules" className="hover:text-white transition">Chính sách đổi trả 60 ngày</a></li>
              <li><a href="#shipping" className="hover:text-white transition">Chính sách vận chuyển & kiểm hàng</a></li>
              <li><a href="#size" className="hover:text-white transition">Hướng dẫn chọn kích cỡ chuẩn</a></li>
              <li><a href="#faq" className="hover:text-white transition">Câu hỏi thường gặp (FAQs)</a></li>
              <li><a href="#privacy" className="hover:text-white transition">Bảo mật thông tin khách hàng</a></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Liên hệ & Hỗ trợ</h4>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Hotline: <b className="text-white">0901.234.567</b> (8h30 - 22h)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Email: contact@thaitrinh.fashion</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Khu II, Đường 3/2, P. Xuân Khánh, Cần Thơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hàng 3: Bản quyền */}
        <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 ThaiTrinh Fashion. Dự án E-commerce & Tích hợp PhoBERT Sentiment Analysis.</p>
          <div className="flex gap-6">
            <span>Điều khoản dịch vụ</span>
            <span>Chính sách quyền riêng tư</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
