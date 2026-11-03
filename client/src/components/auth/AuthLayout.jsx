import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import defaultEditorial from '../../assets/dangnhap.jpg';

export default function AuthLayout({ children, image = defaultEditorial }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e9e7e2] px-3 py-5 sm:px-6 sm:py-8">
      {/* Nền động */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-[-10rem] h-[28rem] w-[28rem] animate-orb rounded-full bg-white/80 blur-3xl" />
        <div className="absolute -bottom-40 right-[-8rem] h-[30rem] w-[30rem] animate-orb-slow rounded-full bg-[#d6cfc4] blur-3xl" />
        <div className="absolute inset-0 bg-grain opacity-[0.07]" />
      </div>

      <div className="relative grid w-full max-w-[1160px] animate-card-in overflow-hidden rounded-[28px] bg-[#f5f4f1] shadow-[0_40px_120px_-40px_rgba(25,22,18,0.45)] ring-1 ring-black/5 md:min-h-[690px] md:grid-cols-[0.94fr_1.06fr]">
        {/* ========== TRÁI: FORM ========== */}
        <section className="relative flex min-w-0 flex-col px-6 py-6 sm:px-10 sm:py-8 lg:px-14">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/40 to-transparent blur-3xl"
            aria-hidden="true"
          />

          <Link
            to="/"
            aria-label="ThaiTrinh, về trang chủ"
            className="group relative inline-flex w-fit animate-rise items-center gap-2 text-lg font-black tracking-tight text-gray-950 [animation-delay:100ms]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-950 text-sm font-black text-white shadow-lg shadow-black/20 transition-transform duration-500 group-hover:rotate-[360deg]">
              T
            </span>
            THAITRINH<span className="-ml-2 text-blue-600">.</span>
          </Link>

          <div className="relative flex flex-1 items-center py-8 md:py-10">
            <div className="mx-auto w-full max-w-[370px] animate-rise [animation-delay:250ms]">
              {children}
            </div>
          </div>

          <div className="relative flex animate-rise items-center justify-between gap-4 border-t border-black/5 pt-4 text-[10px] font-medium text-gray-400 [animation-delay:500ms]">
            <span>© 2026 ThaiTrinh Fashion</span>
            <Link
              to="/"
              className="group inline-flex items-center gap-1 transition hover:text-gray-900"
            >
              Tiếp tục mua sắm
              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* ========== PHẢI: EDITORIAL ========== */}
        <aside className="relative hidden min-h-[690px] overflow-hidden md:block">
          {/* Ảnh zoom chậm (Ken Burns) */}
          <img
            src={image}
            alt="Phong cách thời trang ThaiTrinh"
            className="absolute inset-0 h-full w-full animate-kenburns object-cover object-center will-change-transform"
          />

          {/* Lớp phủ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-transparent to-blue-500/20 mix-blend-soft-light" />

          {/* Vệt sáng quét */}
          <div
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent [animation-delay:1s] [animation-duration:5s]"
            aria-hidden="true"
          />

          {/* Khung viền mảnh */}
          <div
            className="pointer-events-none absolute inset-4 rounded-[20px] border border-white/15"
            aria-hidden="true"
          />

          {/* Badge */}
          <div className="absolute left-8 top-8 flex animate-rise items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-xl [animation-delay:400ms]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            THAITRINH · EVERYDAY EDIT
          </div>

          {/* Số kiểu tạp chí */}
          <div className="absolute right-9 top-8 animate-rise text-right font-serif text-white/80 [animation-delay:550ms]">
            <div className="text-4xl font-light leading-none tracking-tight">26</div>
            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/60">
              Collection
            </div>
          </div>

          {/* Thẻ nội dung chính */}
          <div className="absolute bottom-8 left-8 right-8 animate-rise overflow-hidden rounded-3xl border border-white/25 bg-white/10 p-6 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl [animation-delay:700ms] lg:bottom-10 lg:left-10 lg:right-10 lg:p-7">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl"
              aria-hidden="true"
            />

            <h2 className="max-w-md text-2xl font-black leading-[1.1] tracking-tight lg:text-[2rem]">
              <span className="block animate-line [animation-delay:900ms]">Tự tin trong</span>
              <span className="block animate-line [animation-delay:1050ms]">
                từng{' '}
                <span className="font-serif font-normal italic text-white/90">lựa chọn.</span>
              </span>
            </h2>

            <p className="mt-3 max-w-sm text-xs leading-5 text-white/80">
              Khám phá những thiết kế dành cho nhịp sống và phong cách riêng của bạn.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
