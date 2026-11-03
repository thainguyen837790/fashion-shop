import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User, Users, UserCheck, Package, Coins, Ticket,
  MapPin, Star, HelpCircle, Power, X, CheckCircle2, AlertCircle,
  Clock, Truck, XCircle, Search, ShoppingBag, Eye, RefreshCw,
  Copy, ChevronRight, Calendar, CreditCard, ArrowRight, MessageSquare,
  FileText, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import { formatPrice } from '../../utils/colorHelper';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Chuyển hướng người dùng chưa đăng nhập về trang đăng nhập
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/account' } }, replace: true });
    }
  }, [user, navigate]);

  const isAdmin = user?.role === 'admin';

  // Đọc tab từ URL param (?tab=orders) nếu có (với admin luôn cố định là 'info')
  const initialTab = isAdmin ? 'info' : (searchParams.get('tab') || 'info');
  const [activeTab, setActiveTab] = useState(initialTab);

  // Nếu là tài khoản Admin thì luôn giới hạn ở tab 'info'
  useEffect(() => {
    if (isAdmin && activeTab !== 'info') {
      setActiveTab('info');
      setSearchParams({ tab: 'info' });
    }
  }, [isAdmin, activeTab]);

  // Cập nhật URL khi đổi tab
  const handleSelectTab = (tabId) => {
    if (isAdmin && tabId !== 'info') return;
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Dữ liệu profile hiển thị (khởi tạo từ thông tin người dùng đang đăng nhập)
  const [profile, setProfile] = useState(() => ({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    gender: user?.gender || 'Nam',
    birthday: user?.birthday || '',
    height: user?.height || '',
    weight: user?.weight || '',
  }));

  // Modal states tài khoản
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Form states tài khoản
  const [infoForm, setInfoForm] = useState({ ...profile });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ==========================================
  // QUẢN LÝ ĐƠN HÀNG (ORDER HISTORY)
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');
  
  // Modals đơn hàng
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Tôi muốn thay đổi địa chỉ nhận hàng');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Quản lý Sổ địa chỉ
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    phone: '',
    province: 'Bắc Ninh',
    district: 'Từ Sơn',
    ward: 'Phù Chẩn',
    street: '',
    is_default: false,
  });

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  // Tải dữ liệu người dùng từ database
  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data) {
          const loadedProfile = {
            full_name: res.data.full_name || user.full_name || '',
            phone: res.data.phone || user.phone || '',
            email: res.data.email || user.email || '',
            gender: res.data.gender || 'Nam',
            birthday: res.data.birthday || '',
            height: res.data.height || '',
            weight: res.data.weight || '',
          };
          setProfile(loadedProfile);
          setInfoForm(loadedProfile);
        }
      } catch (err) {
        console.log('Không thể tải profile từ backend');
      }
    };
    fetchUser();
  }, [user]);

  // Tải đơn hàng khi mở tab 'orders' (chỉ cho khách hàng)
  useEffect(() => {
    if (!isAdmin && activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, isAdmin]);

  // Tải địa chỉ khi mở tab 'addresses' hoặc khi đăng nhập (chỉ cho khách hàng)
  useEffect(() => {
    if (!isAdmin && user) {
      fetchAddresses();
    }
  }, [activeTab, isAdmin, user]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
      showNotification('error', 'Không thể tải lịch sử đơn hàng.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data || []);
    } catch (err) {
      console.log('Lỗi tải danh sách địa chỉ');
    }
  };

  // Đếm số lượng đơn hàng theo từng trạng thái
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length, pending: 0, shipping: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Lọc danh sách đơn hàng theo Tab và Từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearchKeyword.trim()) {
        const kw = orderSearchKeyword.toLowerCase().trim();
        const matchId = String(order.id).includes(kw) || `ord-${order.id}`.toLowerCase().includes(kw);
        const matchProduct = (order.items || []).some((item) =>
          (item.product_name || '').toLowerCase().includes(kw) ||
          (item.variant?.product?.name || '').toLowerCase().includes(kw)
        );
        return matchId || matchProduct;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchKeyword]);

  // Cấu hình nhãn trạng thái đơn hàng
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Chờ xác nhận & xử lý',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          color: '#d97706',
          step: 1,
        };
      case 'shipping':
        return {
          text: 'Đang vận chuyển',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Truck,
          color: '#2563eb',
          step: 2,
        };
      case 'delivered':
        return {
          text: 'Giao hàng thành công',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          color: '#059669',
          step: 3,
        };
      case 'cancelled':
        return {
          text: 'Đã hủy đơn',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          color: '#dc2626',
          step: 0,
        };
      default:
        return {
          text: status,
          badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Clock,
          color: '#4b5563',
          step: 1,
        };
    }
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Xác nhận hủy đơn hàng
  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      setCancelSubmitting(true);
      await api.patch(`/orders/${cancelModalOrder.id}/cancel`, { reason: cancelReason });
      showNotification('success', `Đã hủy đơn hàng #ORD-${cancelModalOrder.id} thành công!`);
      setCancelModalOrder(null);
      fetchOrders();
    } catch (err) {
      showNotification('error', err.response?.data?.error?.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Mở modal gửi đánh giá sản phẩm
  const handleOpenReviewModal = (item) => {
    setReviewModalItem(item);
    setReviewRating(item.review?.rating || 5);
    setReviewContent(item.review?.content || '');
  };

  // Gửi đánh giá sản phẩm
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    if (!reviewContent.trim()) {
      showNotification('error', 'Vui lòng nhập nội dung đánh giá.');
      return;
    }
    try {
      setReviewSubmitting(true);
      const productId = reviewModalItem.variant?.product_id || reviewModalItem.variant?.product?.id;
      await api.post('/reviews', {
        product_id: productId,
        order_item_id: reviewModalItem.id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      showNotification('success', 'Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.');
      setReviewModalItem(null);
      setReviewContent('');
      setReviewRating(5);
      fetchOrders();
    } catch (err) {
      showNotification('error', err.response?.data?.error?.message || 'Không thể gửi đánh giá.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Mua lại đơn hàng
  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) return;
    try {
      let added = 0;
      for (const item of order.items) {
        if (item.variant_id) {
          await addToCart(item.variant_id, item.quantity || 1);
          added++;
        }
      }
      if (added > 0) {
        showNotification('success', `Đã thêm ${added} sản phẩm vào giỏ hàng!`);
        navigate('/cart');
      } else {
        showNotification('error', 'Sản phẩm trong đơn không còn khả dụng.');
      }
    } catch (err) {
      showNotification('error', 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
  };

  // Cập nhật thông tin tài khoản
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/auth/profile', infoForm);
      if (res.data?.user) {
        setProfile(res.data.user);
      } else {
        setProfile(infoForm);
      }
      setIsEditInfoOpen(false);
      showNotification('success', 'Cập nhật thông tin tài khoản thành công!');
    } catch (err) {
      showNotification('error', err.response?.data?.error?.message || 'Không thể lưu thông tin.');
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_new_password) {
      showNotification('error', 'Mật khẩu mới không trùng khớp!');
      return;
    }
    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setIsChangePassOpen(false);
      setPassForm({ current_password: '', new_password: '', confirm_new_password: '' });
      showNotification('success', 'Đổi mật khẩu thành công!');
    } catch (err) {
      showNotification('error', err.response?.data?.error?.message || 'Mật khẩu hiện tại không đúng.');
    } finally {
      setLoading(false);
    }
  };

  // Xóa tài khoản
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await api.delete('/auth/delete-account');
      logout();
      navigate('/');
      window.location.reload();
    } catch (err) {
      showNotification('error', 'Không thể xóa tài khoản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Địa chỉ
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressForm({
      recipient: profile.full_name || '',
      phone: profile.phone || '',
      province: 'Bắc Ninh',
      district: 'Từ Sơn',
      ward: 'Phù Chẩn',
      street: '',
      is_default: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      recipient: addr.recipient,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
      is_default: addr.is_default,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, addressForm);
        showNotification('success', 'Cập nhật địa chỉ thành công!');
      } else {
        await api.post('/addresses', addressForm);
        showNotification('success', 'Thêm địa chỉ mới thành công!');
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      showNotification('error', 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      showNotification('success', 'Đã xóa địa chỉ');
      fetchAddresses();
    } catch (err) {
      showNotification('error', 'Lỗi khi xóa địa chỉ');
    }
  };

  // Địa chỉ mặc định hiển thị nhanh cho khách hàng
  const defaultAddress = useMemo(() => {
    return addresses.find((a) => a.is_default) || addresses[0] || null;
  }, [addresses]);

  // Cấu hình menu theo vai trò: Admin chỉ có Thông tin tài khoản & Đăng xuất
  const menuItems = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'info', label: 'Thông tin tài khoản', icon: User },
      ];
    }
    return [
      { id: 'info', label: 'Thông tin tài khoản', icon: User },
      { id: 'orders', label: 'Lịch sử đơn hàng', icon: Package, badge: orders.length > 0 ? orders.length : null },
      { id: 'addresses', label: 'Sổ địa chỉ', icon: MapPin },
      { id: 'cash', label: 'Lịch sử CoolCash', icon: Coins },
      { id: 'vouchers', label: 'Ví Voucher', icon: Ticket },
      { id: 'friends', label: 'Giới thiệu bạn bè', icon: Users },
      { id: 'faq', label: 'Chính sách & Hỗ trợ', icon: HelpCircle },
    ];
  }, [isAdmin, orders.length]);

  return (
    <div className="bg-[#f0f2f5] min-h-screen py-8 sm:py-12 text-gray-900 font-['Be_Vietnam_Pro',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Thông báo Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
              : 'bg-red-50 text-red-800 border border-red-200 shadow-sm'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* ================= CỘT TRÁI: MENU ĐIỀU HƯỚNG ================= */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            
            {/* Nếu là Admin: nút truy cập thẳng vào trang Quản Trị Hệ Thống */}
            {isAdmin && (
              <Link
                to="/admin"
                className="w-full mb-3 flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-black bg-black text-white hover:bg-neutral-800 transition text-left cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Trang Quản Trị Admin</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[13px] font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-white md:bg-transparent text-gray-800 hover:bg-gray-200/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Nút Đăng xuất */}
            <div className="pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
              >
                <Power className="w-4 h-4 text-red-600" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* ================= CỘT PHẢI: KHUNG NỘI DUNG HIỂN THỊ ================= */}
          <div className="md:col-span-8 lg:col-span-9 bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 min-h-[600px]">

            {/* ================= TAB 1: THÔNG TIN TÀI KHOẢN ================= */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <h2 className="text-xl font-black text-gray-950 tracking-tight">
                      Thông tin tài khoản
                    </h2>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-black text-white">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Quản Trị Viên (Admin)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-[13px]">
                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Họ và tên</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.full_name}</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Số điện thoại</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.phone}</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Giới tính</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.gender}</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Ngày sinh</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.birthday}</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Chiều cao</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.height} cm</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Cân nặng</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.weight} kg</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        setInfoForm({ ...profile });
                        setIsEditInfoOpen(true);
                      }}
                      className="px-8 py-2.5 rounded-full border border-black text-black font-extrabold text-[11px] uppercase tracking-wider hover:bg-black hover:text-white transition cursor-pointer"
                    >
                      CẬP NHẬT
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h2 className="text-xl font-black text-gray-950 mb-4 tracking-tight">
                    Thông tin đăng nhập
                  </h2>

                  <div className="space-y-2 text-[13px]">
                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Email</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900">{profile.email}</span>
                    </div>

                    <div className="grid grid-cols-12 py-1">
                      <span className="col-span-4 sm:col-span-3 text-gray-500 font-medium">Mật khẩu</span>
                      <span className="col-span-8 sm:col-span-9 font-bold text-gray-900 tracking-widest">••••••••••••</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => setIsChangePassOpen(true)}
                      className="px-8 py-2.5 rounded-full border border-black text-black font-extrabold text-[11px] uppercase tracking-wider hover:bg-black hover:text-white transition cursor-pointer"
                    >
                      ĐỔI MẬT KHẨU
                    </button>
                  </div>
                </div>

                {/* ================= ĐỊA CHỈ NHẬN HÀNG (DÀNH CHO KHÁCH HÀNG) ================= */}
                {!isAdmin && (
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                      <h2 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-800" />
                        Địa chỉ nhận hàng mặc định
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('addresses')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Quản lý sổ địa chỉ ({addresses.length}) &gt;
                      </button>
                    </div>

                    {defaultAddress ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-sm">{defaultAddress.recipient}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                            Mặc định
                          </span>
                        </div>
                        <p className="text-gray-600">
                          Số điện thoại: <span className="font-bold text-gray-900">{defaultAddress.phone}</span>
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          Địa chỉ: <span className="font-semibold text-gray-900">{defaultAddress.street}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.province}</span>
                        </p>
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(defaultAddress)}
                            className="px-6 py-2.5 rounded-full border border-black text-black font-extrabold text-[11px] uppercase tracking-wider hover:bg-black hover:text-white transition cursor-pointer"
                          >
                            CẬP NHẬT ĐỊA CHỈ
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="text-xs font-bold text-gray-600 hover:text-black underline cursor-pointer"
                          >
                            Thêm địa chỉ khác
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-800">Chưa thiết lập địa chỉ nhận hàng</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Thêm địa chỉ để nhận hàng nhanh chóng khi đặt hàng</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="px-6 py-2.5 rounded-full bg-black text-white font-extrabold text-[11px] uppercase tracking-wider hover:bg-gray-800 transition cursor-pointer shrink-0"
                        >
                          THÊM ĐỊA CHỈ MỚI +
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dành riêng cho Quản trị viên (Admin) */}
                {isAdmin && (
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">Bảng Điều Khiển Quản Trị</h3>
                        <p className="text-xs text-gray-500">Truy cập để duyệt đơn, quản lý sản phẩm, người dùng và đánh giá</p>
                      </div>
                      <Link
                        to="/admin"
                        className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition"
                      >
                        Mở Dashboard &gt;
                      </Link>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100">
                  <h2 className="text-xl font-black text-gray-950 mb-3 tracking-tight">
                    Nâng cao
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      className="px-8 py-2.5 rounded-full bg-red-600 text-white font-extrabold text-[11px] uppercase tracking-wider hover:bg-red-700 transition cursor-pointer shadow-xs"
                    >
                      ĐĂNG XUẤT
                    </button>

                    {!isAdmin && (
                      <button
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        className="px-8 py-2.5 rounded-full border border-red-500 text-red-600 font-extrabold text-[11px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition cursor-pointer"
                      >
                        XOÁ TÀI KHOẢN
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: LỊCH SỬ ĐƠN HÀNG (CHỈ DÀNH CHO KHÁCH HÀNG) ================= */}
            {!isAdmin && activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Header danh sách đơn */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                      Lịch sử đơn hàng
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Theo dõi quá trình vận chuyển và thông tin chi tiết từng đơn hàng của bạn
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-full transition self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>

                {/* Các Tab lọc trạng thái đơn hàng */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {[
                    { id: 'all', label: 'Tất cả', count: statusCounts.all },
                    { id: 'pending', label: 'Chờ xử lý', count: statusCounts.pending },
                    { id: 'shipping', label: 'Đang giao', count: statusCounts.shipping },
                    { id: 'delivered', label: 'Đã giao', count: statusCounts.delivered },
                    { id: 'cancelled', label: 'Đã hủy', count: statusCounts.cancelled },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderStatusFilter(tab.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        orderStatusFilter === tab.id
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        orderStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Thanh tìm kiếm đơn hàng */}
                <div className="relative">
                  <input
                    type="text"
                    value={orderSearchKeyword}
                    onChange={(e) => setOrderSearchKeyword(e.target.value)}
                    placeholder="Tìm đơn hàng theo Mã đơn hàng (#ORD-...) hoặc Tên sản phẩm..."
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl pl-10 pr-10 py-3 focus:outline-none focus:border-black focus:bg-white transition"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  {orderSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchKeyword('')}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* TRẠNG THÁI: ĐANG TẢI (SKELETON) */}
                {ordersLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-3xl p-6 space-y-4 animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-1/3" />
                          <div className="h-6 bg-gray-200 rounded-full w-24" />
                        </div>
                        <div className="h-16 bg-gray-100 rounded-2xl" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-8 bg-gray-200 rounded-full w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TRẠNG THÁI: CHƯA CÓ ĐƠN HÀNG HOẶC KHÔNG TÌM THẤY */}
                {!ordersLoading && filteredOrders.length === 0 && (
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-black text-gray-900 mb-1">
                      {orderSearchKeyword
                        ? 'Không tìm thấy đơn hàng nào phù hợp'
                        : orderStatusFilter === 'all'
                        ? 'Bạn chưa có đơn hàng nào'
                        : `Chưa có đơn hàng nào ở trạng thái này`}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mb-6">
                      Khám phá các thiết kế thời trang nam thanh lịch, năng động chuẩn form tại THAITRINH.
                    </p>
                    <Link
                      to="/"
                      className="px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md transition active:scale-95 cursor-pointer"
                    >
                      MUA SẮM NGAY
                    </Link>
                  </div>
                )}

                {/* DANH SÁCH THẺ ĐƠN HÀNG */}
                {!ordersLoading && filteredOrders.length > 0 && (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const statusInfo = getStatusBadge(order.status);
                      const StatusIcon = statusInfo.icon;
                      const isPending = order.status === 'pending';
                      const isDelivered = order.status === 'delivered';

                      return (
                        <div
                          key={order.id}
                          className="border border-gray-200 hover:border-gray-300 rounded-3xl p-5 sm:p-6 transition-all duration-200 bg-white shadow-2xs space-y-4"
                        >
                          {/* Hàng trên: Mã đơn, Thời gian, Badge trạng thái */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-gray-950 text-sm">
                                  #ORD-{order.id}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatOrderDate(order.created_at)}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Thanh toán: <strong className="text-gray-700 uppercase">{order.payment_method}</strong> ({order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                              </div>
                            </div>

                            {/* Badge trạng thái */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>

                          {/* Danh sách mặt hàng trong đơn */}
                          <div className="divide-y divide-gray-100">
                            {(order.items || []).map((item) => {
                              const product = item.variant?.product;
                              const imageUrl =
                                product?.images?.[0]?.url ||
                                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

                              return (
                                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                      <img
                                        src={imageUrl}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover object-center"
                                      />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                      {product?.slug ? (
                                        <Link
                                          to={`/products/${product.slug}`}
                                          className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-1 transition"
                                        >
                                          {item.product_name}
                                        </Link>
                                      ) : (
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                                          {item.product_name}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <span>Số lượng: <strong className="text-gray-800">x{item.quantity}</strong></span>
                                        <span>•</span>
                                        <span>Đơn giá: {formatPrice(item.unit_price)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Cột giá & nút đánh giá nếu đơn đã hoàn thành */}
                                  <div className="text-right shrink-0 space-y-1.5">
                                    <span className="text-xs sm:text-sm font-black text-gray-950 block">
                                      {formatPrice(Number(item.unit_price) * item.quantity)}
                                    </span>

                                    {isDelivered && (
                                      item.review ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          ★ Đã đánh giá ({item.review.rating}★)
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReviewModal(item)}
                                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                        >
                                          ★ Đánh giá
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Hàng dưới: Địa chỉ giao, Tổng tiền, Nút thao tác */}
                          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>Người nhận: <strong className="text-gray-800">{order.receiver_name}</strong> - {order.phone}</div>
                              <div className="line-clamp-1">Địa chỉ: {[order.address_line, order.city].filter(Boolean).join(', ')}</div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-gray-500 font-medium">Tổng thanh toán:</span>
                                <span className="text-base sm:text-lg font-black text-gray-950">
                                  {formatPrice(order.total_amount)}
                                </span>
                              </div>

                              {/* Nhóm nút hành động */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() => setCancelModalOrder(order)}
                                    className="px-4 py-2 rounded-full border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                                  >
                                    Hủy đơn hàng
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(order)}
                                  className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Chi tiết</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReorder(order)}
                                  className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Mua lại</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: SỔ ĐỊA CHỈ ================= */}
            {!isAdmin && activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    Địa chỉ của tôi
                  </h2>
                  {addresses.length > 0 && (
                    <button
                      onClick={handleOpenAddModal}
                      className="px-6 py-2.5 rounded-full bg-black text-white font-extrabold text-xs hover:bg-gray-800 transition cursor-pointer"
                    >
                      Thêm địa chỉ mới +
                    </button>
                  )}
                </div>

                {addresses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-gray-500 font-medium mb-5">
                      Chưa có địa chỉ nhận hàng nào được lưu
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="px-8 py-3 rounded-full bg-black text-white font-extrabold text-xs uppercase tracking-wider hover:bg-gray-800 transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      THÊM ĐỊA CHỈ MỚI +
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="py-5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-950 text-sm">{addr.recipient}</span>
                            {addr.is_default && (
                              <span className="px-2.5 py-0.5 rounded-full border border-gray-300 text-[11px] font-medium text-gray-700 flex items-center gap-1">
                                ★ Mặc định
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-gray-800">{addr.phone}</div>
                          <div className="text-gray-500">
                            {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pt-1">
                          <button
                            onClick={() => handleOpenEditModal(addr)}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Cập nhật
                          </button>
                          {!addr.is_default && (
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-xs font-medium text-red-500 hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: COOLCASH ================= */}
            {!isAdmin && activeTab === 'cash' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    Ví hoàn tiền CoolCash
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tích lũy tiền hoàn tự động từ mỗi đơn hàng thành công để trừ trực tiếp vào đơn sau
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-black text-white space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
                    <span>Số dư khả dụng</span>
                    <span>🪙 CoolCash Rewards</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight">
                    50.000đ
                  </div>
                  <p className="text-xs text-blue-200/80">
                    Tương đương 50.000đ trừ trực tiếp vào giỏ hàng khi thanh toán.
                  </p>
                </div>
              </div>
            )}

            {/* ================= TAB 5: VÍ VOUCHER ================= */}
            {!isAdmin && activeTab === 'vouchers' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    Ví Voucher ưu đãi
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mã giảm giá đặc quyền dành riêng cho tài khoản của bạn
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { code: 'NEW100K', discount: 'Giảm 100K', desc: 'Cho đơn hàng từ 500.000đ', exp: 'HSD: 31/12/2026' },
                    { code: 'COOLNEW40K', discount: 'Giảm 40K', desc: 'Cho đơn hàng đầu tiên từ 200.000đ', exp: 'HSD: 31/12/2026' },
                  ].map((v) => (
                    <div key={v.code} className="border border-blue-200 bg-blue-50/40 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">VOUCHER</span>
                        <span className="text-[11px] text-gray-500 font-medium">{v.exp}</span>
                      </div>
                      <div className="font-black text-lg text-gray-900">{v.discount}</div>
                      <p className="text-xs text-gray-600">{v.desc}</p>
                      <div className="pt-2 flex items-center justify-between border-t border-blue-100">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-1 rounded border border-blue-200">
                          {v.code}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">Đã lưu trong ví</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 6: GIỚI THIỆU BẠN BÈ ================= */}
            {!isAdmin && activeTab === 'friends' && (
              <div className="space-y-6 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-gray-950 tracking-tight">
                  Giới thiệu bạn bè – Cả hai cùng nhận 50K
                </h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Gửi mã giới thiệu hoặc đường link cho bạn bè. Khi bạn bè hoàn tất đơn hàng đầu tiên, cả 2 sẽ nhận ngay 50.000 CoolCash vào ví!
                </p>
                <div className="max-w-sm mx-auto p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                  <span className="font-mono font-black text-base text-gray-900">THAITRINH50K</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('THAITRINH50K');
                      showNotification('success', 'Đã sao chép mã giới thiệu!');
                    }}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 cursor-pointer"
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 7: CHÍNH SÁCH & HỖ TRỢ ================= */}
            {!isAdmin && activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    Chính sách & Hỗ trợ khách hàng
                  </h2>
                </div>

                <div className="space-y-4 text-xs text-gray-700">
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-sm">Chính sách đổi trả trong 60 ngày</h4>
                    <p className="leading-relaxed">
                      Bạn có thể yêu cầu đổi trả sản phẩm hoàn toàn miễn phí trong vòng 60 ngày vì bất kỳ lý do gì. Nhân viên sẽ đến tận nơi nhận hàng trả và hoàn tiền trong 2-3 ngày làm việc.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-sm">Miễn phí vận chuyển toàn quốc</h4>
                    <p className="leading-relaxed">
                      Áp dụng freeship tiêu chuẩn toàn quốc cho tất cả đơn hàng có giá trị thanh toán từ 200.000đ trở lên.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-sm">Liên hệ tổng đài hỗ trợ</h4>
                    <p className="leading-relaxed">
                      Hotline hỗ trợ miễn phí: <strong>1900 8079</strong> (Hỗ trợ từ 8h30 đến 22h00 các ngày trong tuần).
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT ĐƠN HÀNG (ORDER DETAIL MODAL) =========================== */}
      {/* ========================================================================= */}
      {!isAdmin && selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900">
                    Chi tiết đơn hàng #ORD-{selectedOrderDetail.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(selectedOrderDetail.status).badgeClass}`}>
                    {getStatusBadge(selectedOrderDetail.status).text}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian đặt: {formatOrderDate(selectedOrderDetail.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tiến trình đơn hàng (Delivery Timeline) */}
            <div className="py-2">
              <div className="flex items-center justify-between max-w-md mx-auto text-center relative">
                {/* Đường line tiến trình */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -z-0" />
                <div
                  className={`absolute top-4 left-6 h-0.5 -z-0 transition-all duration-500 ${
                    selectedOrderDetail.status === 'cancelled'
                      ? 'bg-red-500 w-full'
                      : selectedOrderDetail.status === 'delivered'
                      ? 'bg-emerald-500 w-full'
                      : selectedOrderDetail.status === 'shipping'
                      ? 'bg-blue-500 w-1/2'
                      : 'bg-amber-500 w-1/4'
                  }`}
                />

                {/* Bước 1 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1.5">Đặt hàng</span>
                </div>

                {/* Bước 2 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                    selectedOrderDetail.status === 'cancelled'
                      ? 'bg-red-500 text-white'
                      : ['shipping', 'delivered'].includes(selectedOrderDetail.status)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white ring-4 ring-amber-100'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1.5">Tiếp nhận</span>
                </div>

                {/* Bước 3 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                    selectedOrderDetail.status === 'cancelled'
                      ? 'bg-gray-200 text-gray-400'
                      : selectedOrderDetail.status === 'delivered'
                      ? 'bg-emerald-500 text-white'
                      : selectedOrderDetail.status === 'shipping'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1.5">Đang giao</span>
                </div>

                {/* Bước 4 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                    selectedOrderDetail.status === 'cancelled'
                      ? 'bg-red-500 text-white ring-4 ring-red-100'
                      : selectedOrderDetail.status === 'delivered'
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {selectedOrderDetail.status === 'cancelled' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1.5">
                    {selectedOrderDetail.status === 'cancelled' ? 'Đã hủy' : 'Hoàn thành'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin người nhận & Thanh toán */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="space-y-1">
                <span className="font-bold text-gray-900 block mb-1">Địa chỉ nhận hàng:</span>
                <div className="font-semibold text-gray-800">{selectedOrderDetail.receiver_name}</div>
                <div className="text-gray-600">{selectedOrderDetail.phone}</div>
                <div className="text-gray-500 leading-relaxed">
                  {[selectedOrderDetail.address_line, selectedOrderDetail.city].filter(Boolean).join(', ')}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-900 block mb-1">Hình thức thanh toán:</span>
                <div className="font-semibold text-gray-800 uppercase">
                  {selectedOrderDetail.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'VNPay Online'}
                </div>
                <div className="text-gray-600">
                  Trạng thái: <strong className={selectedOrderDetail.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedOrderDetail.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </strong>
                </div>
                <div className="text-gray-500">Đơn vị vận chuyển: THAITRINH Express (Tiêu chuẩn)</div>
              </div>
            </div>

            {/* Danh sách sản phẩm trong modal chi tiết */}
            <div className="space-y-3">
              <span className="font-bold text-xs text-gray-900 block">Sản phẩm trong đơn:</span>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl px-3">
                {(selectedOrderDetail.items || []).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 line-clamp-1">{item.product_name}</p>
                      <span className="text-[11px] text-gray-500">Số lượng: x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-gray-950 shrink-0">
                      {formatPrice(Number(item.unit_price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bảng tính tổng tiền */}
            <div className="space-y-1.5 text-xs border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính tiền hàng:</span>
                <span>{formatPrice(selectedOrderDetail.total_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="text-emerald-600 font-bold">Miễn phí (0đ)</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-950 pt-2 border-t">
                <span>Tổng số tiền thanh toán:</span>
                <span className="text-base text-black">{formatPrice(selectedOrderDetail.total_amount)}</span>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ĐÁNH GIÁ SẢN PHẨM (PRODUCT REVIEW MODAL) ======================== */}
      {/* ========================================================================= */}
      {!isAdmin && reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900">Đánh giá sản phẩm</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{reviewModalItem.product_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Chọn số sao */}
              <div className="text-center space-y-2 py-2">
                <span className="block font-bold text-gray-800 text-xs">Chất lượng sản phẩm tổng thể:</span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (reviewHoverRating || reviewRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition hover:scale-110"
                      >
                        <Star className={`w-7 h-7 ${isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    );
                  })}
                </div>
                <span className="block text-xs font-semibold text-gray-500">
                  {reviewRating === 5 && 'Tuyệt vời - Rất hài lòng'}
                  {reviewRating === 4 && 'Hài lòng - Đúng mô tả'}
                  {reviewRating === 3 && 'Bình thường - Tạm ổn'}
                  {reviewRating === 2 && 'Không hài lòng'}
                  {reviewRating === 1 && 'Rất tệ'}
                </span>
              </div>

              {/* Ô nhập nội dung */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Cảm nhận của bạn về chất liệu, độ bền và kích cỡ form dáng:
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Hãy chia sẻ trải nghiệm thực tế khi mặc, chất vải có thoáng mát, đường may có chỉn chu không..."
                  className="w-full p-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition cursor-pointer"
                >
                  {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN HỦY ĐƠN HÀNG (CANCEL ORDER MODAL) ====================== */}
      {/* ========================================================================= */}
      {!isAdmin && cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">
                Xác nhận hủy đơn hàng #ORD-{cancelModalOrder.id}?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sau khi hủy, các sản phẩm sẽ được tự động hoàn lại kho hàng.
              </p>
            </div>

            <div className="space-y-2 text-xs pt-2">
              <label className="block font-bold text-gray-700">Lý do hủy đơn hàng:</label>
              {[
                'Tôi muốn thay đổi địa chỉ nhận hàng',
                'Tôi muốn đổi sang kích thước hoặc màu sắc khác',
                'Tôi không còn nhu cầu mua nữa',
                'Tôi muốn áp dụng thêm mã giảm giá',
                'Lý do khác',
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer text-gray-800">
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Giữ lại đơn
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={cancelSubmitting}
                className="px-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:bg-gray-400 transition cursor-pointer"
              >
                {cancelSubmitting ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL CẬP NHẬT THÔNG TIN */}
      {isEditInfoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-black text-gray-900">Cập nhật thông tin</h3>
              <button onClick={() => setIsEditInfoOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInfo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={infoForm.full_name || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, full_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={infoForm.phone || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={infoForm.gender || 'Nam'}
                    onChange={(e) => setInfoForm({ ...infoForm, gender: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày sinh (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={infoForm.birthday || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, birthday: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={infoForm.height || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, height: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={infoForm.weight || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, weight: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditInfoOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL ĐỔI MẬT KHẨU */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-black text-gray-900">Đổi mật khẩu</h3>
              <button onClick={() => setIsChangePassOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passForm.current_password}
                  onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={passForm.new_password}
                  onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passForm.confirm_new_password}
                  onChange={(e) => setPassForm({ ...passForm, confirm_new_password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
                >
                  {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL XÁC NHẬN XÓA TÀI KHOẢN */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Xác nhận xóa tài khoản?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ dữ liệu lịch sử và giỏ hàng của bạn khỏi hệ thống và không thể khôi phục.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-5 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:bg-gray-400 cursor-pointer"
              >
                {loading ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL THÊM / CẬP NHẬT ĐỊA CHỈ */}
      {!isAdmin && isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-gray-900">
                {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipient}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                    placeholder="Ví dụ: Nguyen Thai"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="0977837790"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tỉnh/Thành phố</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="Bắc Ninh"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quận/Huyện</label>
                  <input
                    type="text"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="Từ Sơn"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phường/Xã</label>
                  <input
                    type="text"
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                    placeholder="Phù Chẩn"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, đường) *</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="Ví dụ: Số 12, ngõ 34"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="defaultAddress" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
                >
                  {loading ? 'Đang lưu...' : (editingAddress ? 'Cập nhật' : 'Thêm địa chỉ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsLogoutConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Power className="h-6 w-6" />
            </div>
            <h2 id="logout-confirm-title" className="text-center text-xl font-black tracking-tight text-gray-950">
              Xác nhận đăng xuất
            </h2>
            <p id="logout-confirm-description" className="mt-2 text-center text-sm leading-6 text-gray-500">
              Bạn có chắc muốn đăng xuất khỏi tài khoản ThaiTrinh không?
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-xs font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-full bg-gray-950 px-5 py-3 text-xs font-black text-white shadow-lg shadow-gray-950/10 transition hover:bg-red-600"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
