import { ArrowRight, LockKeyhole, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginRequiredModal({ open, onClose, productName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white p-7 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] sm:p-9">
        <button type="button" onClick={onClose} aria-label="Đóng thông báo" className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black">
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg shadow-black/10">
          <LockKeyhole className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">THAIRTRINH · MEMBER</p>
        <h2 id="login-required-title" className="mt-2 text-center text-xl font-black tracking-tight text-gray-950">Đăng nhập để thêm vào giỏ</h2>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-gray-500">
          {productName ? `Đăng nhập để lưu ${productName} vào giỏ hàng và tiếp tục mua sắm.` : 'Đăng nhập để lưu sản phẩm vào giỏ hàng và tiếp tục mua sắm.'}
        </p>

        <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-gray-800">
            Đăng nhập ngay <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-600 transition hover:border-gray-400 hover:text-black">
            Tiếp tục xem
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">Chưa có tài khoản? <Link to="/register" className="font-bold text-gray-800 underline underline-offset-2">Đăng ký miễn phí</Link></p>
      </section>
    </div>
  );
}
