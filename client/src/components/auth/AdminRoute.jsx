import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'admin') {
    alert('Khu vực dành riêng cho Quản trị viên!');
    return <Navigate to="/" replace />;
  }

  return children;
}