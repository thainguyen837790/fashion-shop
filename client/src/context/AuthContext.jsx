import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Khởi tạo user đồng bộ từ localStorage để không bị giật/nhấp nháy trạng thái khi tải lại trang
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        return JSON.parse(storedUser);
      }
    } catch (err) {
      console.error('Lỗi parse user từ localStorage:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Xác thực lại token với server trong nền nếu có token
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Nếu token hết hạn hoặc không hợp lệ (401), dọn dẹp sạch sẽ
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    verifyToken();
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.error?.message ||
          'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
      };
    }
  };

  const completeProviderLogin = async (provider, payload) => {
    try {
      const res = await api.post(`/auth/${provider}`, payload);
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.' };
    }
  };

  const loginWithGoogle = (credential) => completeProviderLogin('google', { credential });
  const loginWithFacebook = (accessToken) => completeProviderLogin('facebook', { accessToken });

  // Đăng ký
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token, user: newUser } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.error?.message ||
          'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.',
      };
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, loginWithGoogle, loginWithFacebook, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
