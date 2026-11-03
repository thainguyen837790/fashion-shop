import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState('');
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(null);

  const { login, loginWithGoogle, loginWithFacebook, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(redirectPath, { replace: true });
  }, [user, navigate, redirectPath]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return undefined;
    let cancelled = false;
    const setupGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => googleCallbackRef.current?.(response.credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
        text: 'continue_with', width: Math.max(googleButtonRef.current.clientWidth, 250),
      });
    };
    if (window.google?.accounts?.id) setupGoogle();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setupGoogle;
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, []);

  googleCallbackRef.current = async (credential) => {
    setError('');
    setProviderLoading('google');
    const result = await loginWithGoogle(credential);
    if (!result.success) setError(result.message);
    else navigate(redirectPath, { replace: true });
    setProviderLoading('');
  };

  const handleFacebookLogin = async () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      setError('Đăng nhập Facebook chưa được cấu hình. Hãy thêm VITE_FACEBOOK_APP_ID vào client/.env.');
      return;
    }
    setError('');
    setProviderLoading('facebook');
    try {
      const initFacebook = () => {
        if (!window.FB) throw new Error('Không tải được Facebook SDK.');
        window.FB.init({ appId, cookie: true, xfbml: false, version: 'v23.0' });
        window.FB.login(async (response) => {
          if (!response.authResponse?.accessToken) {
            setError('Bạn đã đóng hoặc từ chối đăng nhập Facebook.');
            setProviderLoading('');
            return;
          }
          const result = await loginWithFacebook(response.authResponse.accessToken);
          if (!result.success) setError(result.message);
          else navigate(redirectPath, { replace: true });
          setProviderLoading('');
        }, { scope: 'public_profile,email' });
      };
      if (window.FB) initFacebook();
      else {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
        script.async = true;
        script.onload = initFacebook;
        script.onerror = () => { setError('Không tải được Facebook SDK. Vui lòng thử lại.'); setProviderLoading(''); };
        document.body.appendChild(script);
      }
    } catch (err) {
      setError(err.message || 'Không thể khởi chạy đăng nhập Facebook.');
      setProviderLoading('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message || 'Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.');
        return;
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Đã có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Chào mừng trở lại</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Đăng nhập</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">Đăng nhập để lưu sản phẩm, theo dõi đơn hàng và tiếp tục mua sắm.</p>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-gray-800">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Nhập địa chỉ email" className="w-full rounded-xl border border-gray-300 bg-white/70 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-bold text-gray-800">Mật khẩu</label>
            <span className="text-[11px] font-semibold text-gray-400">Bảo mật tài khoản</span>
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className="w-full rounded-xl border border-gray-300 bg-white/70 py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-900">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-gray-950/10 transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
          {loading ? 'Đang đăng nhập...' : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /><span>Hoặc đăng nhập với</span><span className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-h-11 items-center justify-center overflow-hidden rounded-xl [&>div]:!w-full [&_iframe]:!w-full" ref={googleButtonRef} aria-label="Đăng nhập bằng Google">
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && <button type="button" disabled className="w-full rounded-xl border border-gray-200 bg-white px-2 py-3 text-[11px] font-bold text-gray-400" title="Cần cấu hình VITE_GOOGLE_CLIENT_ID">G Google</button>}
        </div>
        <button type="button" disabled={Boolean(providerLoading)} onClick={handleFacebookLogin} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1877F2] text-sm font-black text-white">f</span>
          {providerLoading === 'facebook' ? 'Đang kết nối...' : 'Facebook'}
        </button>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-5 text-center">
        <p className="text-xs text-gray-500">Chưa có tài khoản? <Link to="/register" className="font-black text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">Đăng ký ngay</Link></p>
      </div>

      <details className="mt-5 rounded-xl border border-gray-200/80 bg-white/45 px-4 py-3 text-[11px] text-gray-500">
        <summary className="cursor-pointer font-bold text-gray-600">Tài khoản demo</summary>
        <div className="mt-2 space-y-1 leading-5">
          <p>Khách hàng: <code>customer@gmail.com</code> · Mật khẩu: <code>123456</code></p>
          <p>Quản trị: <code>admin@thaitrinh.fashion</code> · Mật khẩu: <code>123456</code></p>
        </div>
      </details>
    </AuthLayout>
  );
}
