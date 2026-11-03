import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import registerEditorial from '../../assets/dangky.jpg';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      if (!result.success) {
        setError(result.message || 'Đăng ký không thành công. Vui lòng thử lại bằng email khác.');
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout image={registerEditorial}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Gia nhập cộng đồng</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Tạo tài khoản</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">Tạo tài khoản ThaiTrinh để lưu sản phẩm và nhận ưu đãi dành riêng cho thành viên.</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="register-name" className="mb-1 block text-[11px] font-bold text-gray-800">Họ và tên</label>
          <div className="relative">
            <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="register-name" name="full_name" type="text" required autoComplete="name" value={formData.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" className="w-full rounded-xl border border-gray-300 bg-white/70 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>
        <div>
          <label htmlFor="register-email" className="mb-1 block text-[11px] font-bold text-gray-800">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="register-email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="w-full rounded-xl border border-gray-300 bg-white/70 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>
        <div>
          <label htmlFor="register-phone" className="mb-1 block text-[11px] font-bold text-gray-800">Số điện thoại <span className="font-normal text-gray-400">(không bắt buộc)</span></label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="register-phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} placeholder="0901 234 567" className="w-full rounded-xl border border-gray-300 bg-white/70 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className="mb-1 block text-[11px] font-bold text-gray-800">Mật khẩu</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" className="w-full rounded-xl border border-gray-300 bg-white/70 py-2.5 pl-9 pr-9 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div>
            <label htmlFor="register-confirm-password" className="mb-1 block text-[11px] font-bold text-gray-800">Xác nhận mật khẩu</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input id="register-confirm-password" name="confirm_password" type={showConfirmPassword ? 'text' : 'password'} required autoComplete="new-password" value={formData.confirm_password} onChange={handleChange} placeholder="Nhập lại mật khẩu" className="w-full rounded-xl border border-gray-300 bg-white/70 py-2.5 pl-9 pr-9 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
              <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 pt-1 text-[10px] leading-4 text-gray-500"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" /> Thông tin của bạn được bảo vệ an toàn.</p>
        <button type="submit" disabled={loading} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-gray-950/10 transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
          {loading ? 'Đang tạo tài khoản...' : <>Tạo tài khoản <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-5 border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-500">Đã có tài khoản? <Link to="/login" className="font-black text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">Đăng nhập</Link></p>
      </div>
    </AuthLayout>
  );
}
