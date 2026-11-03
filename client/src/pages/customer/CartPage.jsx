import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  X,
  ShieldCheck,
  Ticket,
  Users,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';
import { useCart, AVAILABLE_VOUCHERS } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { VIETNAM_PROVINCES, normalizeSouthernProvince } from '../../data/vietnamAddress';
import { formatPrice, parseRawPrice } from '../../utils/colorHelper';
import api from '../../api/axios';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    loading,
    selectedItemIds,
    toggleSelectItem,
    selectAllItems,
    isAllSelected,
    updateQuantity,
    removeItem,
    clearCart,
    changeVariant,
    addToCart,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    useCoolCash,
    setUseCoolCash,
    coolCashBalance,
    selectedItems,
    selectedSubtotal,
    originalSubtotal,
    shippingFee,
    voucherDiscount,
    coolCashDeduction,
    finalTotal,
    totalSavings,
    cashBackReward,
    fetchCart,
  } = useCart();

  // 1. Trạng thái Form thông tin khách hàng
  const [salutation, setSalutation] = useState('Anh');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  // Checkbox mở rộng
  const [hasOtherNote, setHasOtherNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [hasOtherReceiver, setHasOtherReceiver] = useState(false);
  const [otherReceiverName, setOtherReceiverName] = useState('');
  const [otherReceiverPhone, setOtherReceiverPhone] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [requireVat, setRequireVat] = useState(false);
  const [vatCompany, setVatCompany] = useState('');
  const [vatTaxCode, setVatTaxCode] = useState('');
  const [vatAddress, setVatAddress] = useState('');

  // 2. Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // 3. Banner đổi trả & freeship
  const [showPolicyBanner, setShowPolicyBanner] = useState(true);

  // 4. Mã giảm giá nhập tay
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // 5. Sổ địa chỉ modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressLoadError, setAddressLoadError] = useState('');

  // 6. Đặt hàng
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  // Chỉ lấy tên, số điện thoại và email từ tài khoản; địa chỉ giao hàng luôn để khách tự chọn/nhập.
  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.full_name || '');
      setPhone((prev) => prev || user.phone || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  // Tải sổ địa chỉ của user
  const fetchSavedAddresses = async () => {
    if (!user) {
      setSavedAddresses([]);
      setAddressLoadError('Vui lòng đăng nhập để sử dụng sổ địa chỉ đã lưu trong tài khoản.');
      return;
    }
    try {
      setLoadingAddresses(true);
      setAddressLoadError('');
      const res = await api.get('/addresses');
      setSavedAddresses(res.data || []);
    } catch (err) {
      setAddressLoadError(err.response?.data?.error?.message || 'Không tải được sổ địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleOpenAddressModal = () => {
    setIsAddressModalOpen(true);
    fetchSavedAddresses();
  };

  const handleSelectAddress = (addr) => {
    if (addr.recipient) setFullName(addr.recipient);
    if (addr.phone) setPhone(addr.phone);
    if (addr.street) setStreet(addr.street);
    if (addr.province) setProvince(normalizeSouthernProvince(addr.province));
    // Địa chỉ cũ có cấp quận/huyện; giữ lại thông tin này trong dòng phường/xã.
    setWard([addr.ward, addr.district].filter(Boolean).join(', '));
    setIsAddressModalOpen(false);
  };

  // Áp dụng voucher
  const handleApplyVoucher = (codeToApply) => {
    const code = (codeToApply || voucherInput).trim();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    const result = applyVoucher(code);
    if (result.success) {
      setVoucherSuccess(result.message);
      setVoucherError('');
      setVoucherInput('');
      setTimeout(() => setVoucherSuccess(''), 3000);
    } else {
      setVoucherError(result.message);
      setVoucherSuccess('');
      setTimeout(() => setVoucherError(''), 3000);
    }
  };

  // Xử lý ĐẶT HÀNG
  const handlePlaceOrder = async () => {
    if (!user || !localStorage.getItem('token')) {
      alert('Vui lòng đăng nhập để đặt hàng.');
      navigate('/login');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm trong giỏ hàng để đặt!');
      return;
    }

    if (!agreePrivacy) {
      alert('Vui lòng đồng ý với chính sách bảo vệ dữ liệu người dùng để tiếp tục.');
      return;
    }

    if (!fullName.trim()) {
      alert('Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!street.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    if (!province || !ward.trim()) {
      alert('Vui lòng chọn tỉnh/thành phố và nhập phường/xã/đặc khu.');
      return;
    }

    const fullAddress = [street.trim(), ward.trim(), province].filter(Boolean).join(', ');

    const orderPayload = {
      receiver_name: `${salutation} ${fullName.trim()}`,
      phone: phone.trim(),
      address_line: fullAddress,
      city: province,
      payment_method: paymentMethod,
      selected_item_ids: selectedItems.filter((i) => typeof i.id === 'number').map((i) => i.id),
      note: noteContent,
    };

    try {
      setIsSubmitting(true);
      const res = await api.post('/orders', orderPayload);
      const orderResult = res.data.order || res.data;
      if (res.data.checkoutUrl) {
        window.location.assign(res.data.checkoutUrl);
        return;
      }
      await fetchCart();

      setOrderSuccessModal(orderResult);
    } catch (err) {
      console.error('Lỗi đặt hàng:', err);
      setPaymentError(err.response?.data?.error?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thêm mẫu sản phẩm nếu giỏ hàng trống để dễ dàng thử nghiệm tính năng
  const handleAddSampleItems = async () => {
    try {
      const sample1 = {
        product: {
          name: 'Set chạy bộ nam Regular 360Reflect™ "Run Safe in The Dark"',
          slug: 'set-chay-bo-nam-regular-360reflect',
          images: [{ url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo-thethao-timden-1.jpg' }],
          variants: [
            { id: 101, size: 'S', color: 'Tím - Đen', price: 577000, stock: 20 },
            { id: 102, size: 'M', color: 'Tím - Đen', price: 577000, stock: 25 },
            { id: 103, size: 'L', color: 'Tím - Đen', price: 577000, stock: 15 },
          ],
        },
        variant: { id: 101, size: 'S', color: 'Tím - Đen', price: 577000, stock: 20 },
      };

      const sample2 = {
        product: {
          name: 'Pack 3 Shorts mặc nhà Coolmate Basics',
          slug: 'pack-3-shorts-mac-nha-coolmate-basics',
          images: [{ url: 'https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/February2025/combo3-shorts-macnha.jpg' }],
          variants: [
            { id: 201, size: '2XL', color: 'Ngẫu nhiên', price: 199000, stock: 30 },
            { id: 202, size: 'XL', color: 'Ngẫu nhiên', price: 199000, stock: 40 },
          ],
        },
        variant: { id: 201, size: '2XL', color: 'Ngẫu nhiên', price: 199000, stock: 30 },
      };

      await addToCart(sample1.variant.id, 1, sample1);
      await addToCart(sample2.variant.id, 1, sample2);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#f7f8fa] min-h-screen text-gray-900 pb-28 sm:pb-32 font-sans select-none">
      {paymentError && (
        <div role="alert" className="fixed right-4 top-4 z-[100] w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-950">Chưa thể khởi tạo thanh toán</p>
              <p className="mt-1 text-sm leading-5 text-gray-600">{paymentError}</p>
              {paymentError.includes('MOMO_') && (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Nhập thông tin sandbox MoMo vào <code className="rounded bg-gray-100 px-1">server/.env</code>, dùng URL HTTPS công khai cho IPN rồi khởi động lại backend.
                </p>
              )}
            </div>
            <button type="button" onClick={() => setPaymentError('')} aria-label="Đóng thông báo" className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1 bg-rose-500" />
        </div>
      )}
      {/* 1. Header Nhỏ / Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Link to="/" className="hover:text-black font-semibold">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-bold">Giỏ hàng & Thanh toán</span>
        </div>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Tiếp tục mua sắm
        </Link>
      </div>

      {/* 2. KHUNG NỘI DUNG CHÍNH (2 CỘT CHUẨN COOLMATE) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* CỘT TRÁI: THÔNG TIN CỦA BẠN & PHƯƠNG THỨC THANH TOÁN (7 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD 1: THÔNG TIN CỦA BẠN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                  Thông tin của bạn
                </h2>
                <button
                  type="button"
                  onClick={handleOpenAddressModal}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" /> Chọn từ sổ địa chỉ
                </button>
              </div>

              {/* Điều khoản bảo vệ dữ liệu */}
              <div className="mb-5 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="privacy-check"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="privacy-check"
                  className="text-xs text-gray-600 leading-relaxed cursor-pointer font-medium"
                >
                  Tôi đã đọc và đồng ý với các thông tin trong{' '}
                  <span className="font-semibold text-gray-800">
                    Chính sách bảo vệ dữ liệu người dùng
                  </span>{' '}
                  <a href="#privacy" className="text-blue-600 underline font-bold">
                    Tại đây
                  </a>
                </label>
              </div>

              {/* Form nhập thông tin */}
              <div className="space-y-3.5">
                {/* Hàng 1: Họ tên + SĐT */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Họ tên
                    </label>
                    <div className="flex rounded-2xl border border-gray-200 overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black bg-white transition">
                      <select
                        value={salutation}
                        onChange={(e) => setSalutation(e.target.value)}
                        className="bg-gray-50 border-r border-gray-200 text-xs font-bold px-3 py-3 text-gray-800 outline-none cursor-pointer"
                      >
                        <option value="Anh">Anh</option>
                        <option value="Chị">Chị</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nhập họ và tên..."
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-3 text-xs sm:text-sm font-semibold text-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                    />
                  </div>
                </div>

                {/* Hàng 2: Email */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Địa chỉ email nhận hoá đơn & thông báo..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 bg-gray-50/70 text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition"
                  />
                </div>

                {/* Hàng 3: Địa chỉ chi tiết (Số nhà, đường) */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Địa chỉ chi tiết
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường, thôn, xóm..."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>

                {/* Địa chỉ hai cấp theo đơn vị hành chính sau sáp nhập */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Tỉnh / Thành phố
                    </label>
                    <div className="relative">
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full px-3 py-3 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-900 bg-white outline-none focus:border-black transition appearance-none cursor-pointer pr-8"
                      >
                        <option value="" disabled>Chọn tỉnh/thành phố</option>
                        {VIETNAM_PROVINCES.map((provinceName) => (
                          <option key={provinceName} value={provinceName}>
                            {provinceName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Phường / Xã / Đặc khu
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập phường, xã hoặc đặc khu"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                    />
                  </div>
                </div>

                {/* Ghi chú giờ giao hàng */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pt-1">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>
                    Đơn hàng được giao trong giờ hành chính (thứ 2 đến thứ 7).{' '}
                    <a href="#delivery" className="text-blue-600 font-bold hover:underline">
                      Xem chi tiết
                    </a>
                  </span>
                </div>

                {/* CÁC TÙY CHỌN BỔ SUNG */}
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-3">
                  {/* Tùy chọn 1: Ghi chú khác */}
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-gray-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasOtherNote}
                        onChange={(e) => setHasOtherNote(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Ghi chú khác</span>
                    </label>
                    {hasOtherNote && (
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: Giao hàng buổi chiều, gọi trước khi đến..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="mt-2 w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black transition"
                      />
                    )}
                  </div>

                  {/* Tùy chọn 2: Người khác nhận hàng */}
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-gray-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasOtherReceiver}
                        onChange={(e) => setHasOtherReceiver(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Gọi người khác nhận hàng (nếu có)</span>
                    </label>
                    {hasOtherReceiver && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <input
                          type="text"
                          placeholder="Tên người nhận thay..."
                          value={otherReceiverName}
                          onChange={(e) => setOtherReceiverName(e.target.value)}
                          className="p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                        />
                        <input
                          type="tel"
                          placeholder="Số điện thoại người nhận thay..."
                          value={otherReceiverPhone}
                          onChange={(e) => setOtherReceiverPhone(e.target.value)}
                          className="p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tùy chọn 3: Quà tặng người thân/bạn bè */}
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-gray-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Quà tặng Người thân/Bạn bè</span>
                    </label>
                    {isGift && (
                      <input
                        type="text"
                        placeholder="Lời nhắn gửi trao yêu thương trên thiệp chúc..."
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        className="mt-2 w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                      />
                    )}
                  </div>

                  {/* Tùy chọn 4: Xuất hóa đơn VAT */}
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-gray-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireVat}
                        onChange={(e) => setRequireVat(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1">
                        Xuất hoá đơn VAT <Info className="w-3 h-3 text-gray-400" />
                      </span>
                    </label>
                    {requireVat && (
                      <div className="space-y-2.5 mt-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <input
                          type="text"
                          placeholder="Tên công ty..."
                          value={vatCompany}
                          onChange={(e) => setVatCompany(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                        />
                        <input
                          type="text"
                          placeholder="Mã số thuế..."
                          value={vatTaxCode}
                          onChange={(e) => setVatTaxCode(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                        />
                        <input
                          type="text"
                          placeholder="Địa chỉ công ty trên hóa đơn..."
                          value={vatAddress}
                          onChange={(e) => setVatAddress(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 2: PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs">
              <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight mb-4">
                Phương thức thanh toán
              </h2>

              <div className="space-y-2.5">
                {/* 1. Zalopay */}
                <label
                  onClick={() => setPaymentMethod('zalopay')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'zalopay'
                      ? 'border-black bg-gray-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="zalopay"
                    checked={paymentMethod === 'zalopay'}
                    onChange={() => setPaymentMethod('zalopay')}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <img
                    src="https://mcdn.coolmate.me/image/October2024/mceclip3_6.png"
                    alt="ZaloPay"
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Thanh toán qua Zalopay</p>
                    <p className="text-[11px] text-gray-500">
                      Hỗ trợ mọi hình thức thanh toán VISA mastercard JCB ApplePay
                    </p>
                  </div>
                </label>

                {/* 2. Thanh toán khi nhận hàng (COD) */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-black bg-gray-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <img
                    src="https://mcdn.coolmate.me/image/October2024/mceclip2_42.png"
                    alt="Thanh toán khi nhận hàng"
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Thanh toán khi nhận hàng</p>
                    <p className="text-[11px] text-gray-500">Thanh toán tiền mặt cho shipper khi nhận được kiện hàng</p>
                  </div>
                </label>

                {/* 3. MoMo */}
                <label
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'momo'
                      ? 'border-black bg-gray-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <img
                    src="https://mcdn.coolmate.me/image/October2024/mceclip1_171.png"
                    alt="MoMo"
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Ví MoMo</p>
                    <p className="text-[11px] text-gray-500">Mở ứng dụng MoMo để quét mã thanh toán tiện lợi</p>
                  </div>
                </label>

                {/* 5. VNPAY */}
                <label
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'vnpay'
                      ? 'border-black bg-gray-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <img
                    src="https://mcdn.coolmate.me/image/October2024/mceclip0_81.png"
                    alt="VNPAY"
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Ví điện tử VNPAY</p>
                    <p className="text-[11px] text-gray-500">Quét QR để thanh toán qua Mobile Banking</p>
                  </div>
                </label>

              </div>

              {/* Cam kết hài lòng */}
              <p className="text-xs text-gray-500 mt-5 text-center leading-relaxed font-medium">
                Nếu bạn không hài lòng với sản phẩm của chúng tôi? Bạn hoàn toàn có thể trả lại sản phẩm.{' '}
                <a href="#return-policy" className="text-blue-600 underline font-bold">
                  Tìm hiểu thêm Tại đây
                </a>
              </p>
            </div>

          </div>

          {/* ========================================================= */}
          {/* CỘT PHẢI: GIỎ HÀNG, MÃ GIẢM GIÁ & TÓM TẮT ĐƠN HÀNG (5 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CARD 1: GIỎ HÀNG */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                  Giỏ hàng
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {cart.items?.length || 0}
                  </span>
                </h2>
              </div>

              {/* Alert banner: Freeship & 60 ngày đổi trả */}
              {showPolicyBanner && (
                <div className="bg-[#eef4ff] text-[#2563eb] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-xs font-bold mb-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="tracking-tight text-[11px] sm:text-xs">
                      Yên tâm 60 ngày đổi trả - Freeship đơn từ 200k
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPolicyBanner(false)}
                    className="p-1 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-100/50 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Thanh chọn tất cả sản phẩm & Xóa tất cả */}
              {cart.items && cart.items.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => selectAllItems(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Tất cả sản phẩm</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-medium text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {/* Danh sách sản phẩm trong giỏ */}
              {cart.items && cart.items.length > 0 ? (
                <div className="space-y-4 divide-y divide-gray-100">
                  {cart.items.map((item) => {
                    const isChecked = selectedItemIds.includes(item.id);
                    const variants = item.available_variants || [];
                    const availableColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
                    const availableSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));

                    return (
                      <div key={item.id} className="pt-4 first:pt-0 flex gap-3 sm:gap-4 items-start">
                        {/* Checkbox chọn từng item */}
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Ảnh sản phẩm */}
                        <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Chi tiết sản phẩm & Giá */}
                        <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                                {item.product_name}
                              </h4>
                              <div className="text-right shrink-0">
                                <span className="block text-xs sm:text-sm font-black text-gray-950">
                                  {formatPrice(item.price)}
                                </span>
                                {item.original_price && parseRawPrice(item.original_price) > parseRawPrice(item.price) && (
                                  <span className="block text-[11px] text-gray-400 line-through">
                                    {formatPrice(item.original_price)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bộ chọn Màu sắc & Kích cỡ (dropdowns chuẩn Coolmate) */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {/* Dropdown Màu */}
                              {availableColors.length > 0 ? (
                                <div className="relative">
                                  <select
                                    value={item.color}
                                    onChange={(e) => {
                                      const newColor = e.target.value;
                                      const matched = variants.find(
                                        (v) => v.color === newColor && v.size === item.size
                                      ) || variants.find((v) => v.color === newColor);
                                      if (matched) changeVariant(item.id, matched.id, matched);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-lg outline-none cursor-pointer appearance-none transition"
                                  >
                                    {availableColors.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 top-2 pointer-events-none" />
                                </div>
                              ) : (
                                <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                  {item.color || 'Màu tiêu chuẩn'}
                                </span>
                              )}

                              {/* Dropdown Size */}
                              {availableSizes.length > 0 ? (
                                <div className="relative">
                                  <select
                                    value={item.size}
                                    onChange={(e) => {
                                      const newSize = e.target.value;
                                      const matched = variants.find(
                                        (v) => v.size === newSize && v.color === item.color
                                      ) || variants.find((v) => v.size === newSize);
                                      if (matched) changeVariant(item.id, matched.id, matched);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-lg outline-none cursor-pointer appearance-none transition"
                                  >
                                    {availableSizes.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 top-2 pointer-events-none" />
                                </div>
                              ) : (
                                <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                  {item.size || 'Freesize'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hàng dưới: Nút Xóa + Bộ tăng giảm số lượng */}
                          <div className="flex items-center justify-between mt-3 pt-1">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[11px] font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>

                            {/* Stepper số lượng */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-1 text-gray-500 hover:text-black hover:bg-gray-50 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-black text-gray-900 min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-1 text-gray-500 hover:text-black hover:bg-gray-50 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                    <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    Hãy lựa chọn những sản phẩm thời trang chất lượng từ cửa hàng nhé!
                  </p>
                </div>
              )}

              {/* Thông báo số người đang thêm sản phẩm (Social Proof) */}
              {cart.items && cart.items.length > 0 && (
                <div className="mt-5 bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-gray-600 font-medium border border-gray-100/70">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Có <strong className="text-gray-900 font-extrabold">13 người</strong> đang thêm
                    cùng sản phẩm giống bạn vào giỏ hàng.
                  </span>
                </div>
              )}
            </div>

            {/* CARD 2: MÃ GIẢM GIÁ */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs">
              <h3 className="text-lg font-black text-gray-950 tracking-tight mb-3">
                Mã giảm giá
              </h3>

              {/* Input nhập voucher */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 outline-none focus:border-black transition"
                />
                <button
                  type="button"
                  onClick={() => handleApplyVoucher()}
                  className="px-6 py-2.5 bg-black text-white text-xs font-black rounded-2xl hover:bg-gray-800 transition active:scale-95 shadow-sm uppercase tracking-wider shrink-0"
                >
                  ÁP DỤNG
                </button>
              </div>

              {voucherError && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5">{voucherError}</p>
              )}
              {voucherSuccess && (
                <p className="text-[11px] font-bold text-green-600 mt-1.5">{voucherSuccess}</p>
              )}

              {/* Danh sách voucher đề xuất (Hiển thị dạng Carousel thẻ ngang) */}
              <div className="mt-4 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_VOUCHERS.map((v) => {
                    const isApplied = appliedVoucher?.code === v.code;
                    return (
                      <div
                        key={v.code}
                        onClick={() => {
                          if (isApplied) removeVoucher();
                          else applyVoucher(v.code);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isApplied
                            ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-gray-900 tracking-tight">
                              {v.code}{' '}
                              <span className="text-[10px] font-semibold text-gray-400">
                                (Còn {v.count})
                              </span>
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isApplied
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isApplied && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-tight font-medium line-clamp-2">
                            {v.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                          <span>HSD: {v.expiry}</span>
                          <span className="text-blue-600 font-bold hover:underline">Điều kiện</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Nút Ví Voucher & Sử dụng Coolcash */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="w-full py-2.5 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 hover:border-black flex items-center justify-center gap-1.5 transition"
                  >
                    <Ticket className="w-4 h-4 text-blue-600" /> Ví Voucher
                  </button>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCoolCash}
                        onChange={(e) => setUseCoolCash(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>
                        Sử dụng Coolcash (Bạn đang có:{' '}
                        <strong>{coolCashBalance.toLocaleString('vi-VN')} Coolcash</strong>)
                      </span>
                    </label>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  <a
                    href="#referral"
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Bạn có mã giới thiệu? →
                  </a>
                </div>
              </div>
            </div>

            {/* CARD 3: TÓM TẮT ĐƠN HÀNG */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs">
              <h3 className="text-lg font-black text-gray-950 tracking-tight mb-4">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-3 text-xs sm:text-sm font-semibold text-gray-600">
                <div className="flex justify-between items-baseline">
                  <span>Tạm tính</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      {formatPrice(selectedSubtotal)}
                    </span>
                    {totalSavings > 0 && (
                      <span className="block text-[11px] text-gray-400 font-normal">
                        (tiết kiệm {formatPrice(totalSavings)})
                      </span>
                    )}
                  </div>
                </div>

                {voucherDiscount > 0 && (
                  <div className="flex justify-between items-baseline text-blue-600 font-bold">
                    <span>Giảm giá ({appliedVoucher?.code})</span>
                    <span>- {formatPrice(voucherDiscount)}</span>
                  </div>
                )}

                {coolCashDeduction > 0 && (
                  <div className="flex justify-between items-baseline text-orange-600 font-bold">
                    <span>Sử dụng Coolcash</span>
                    <span>- {formatPrice(coolCashDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span>Phí giao hàng</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-bold' : 'text-gray-900'}>
                    {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm sm:text-base font-black text-gray-950">Tổng cộng</span>
                    {originalSubtotal > 0 && finalTotal < originalSubtotal && (
                      <span className="block text-[11px] text-orange-600 font-bold">
                        (Giảm {Math.round(((originalSubtotal - finalTotal) / originalSubtotal) * 100)}% so với giá gốc)
                      </span>
                    )}
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-gray-950">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Thông báo tích lũy hoàn tiền CoolCash */}
              {finalTotal > 0 && (
                <div className="mt-5 bg-[#f0f5ff] border border-blue-100/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                    $
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">
                      Bạn sẽ nhận được{' '}
                      <span className="text-blue-600 font-black">
                        {cashBackReward.toLocaleString('vi-VN')} CoolCash
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                      Được hoàn sau khi đơn hàng của bạn được giao – sử dụng cho đơn hàng tiếp theo
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. THANH CỐ ĐỊNH PHÍA DƯỚI (BOTTOM FLOATING STICKY BAR) */}
      {/* ========================================================= */}
      <aside aria-label="Thanh xác nhận thanh toán" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 py-3 sm:py-3.5 px-4 sm:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
                {formatPrice(finalTotal)}
              </span>
              <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
            </div>
            <div className="text-[11px] sm:text-xs text-gray-500 font-bold flex items-center gap-2">
              <span>Hoàn {cashBackReward.toLocaleString('vi-VN')} CoolCash</span>
              <span>|</span>
              <span className="text-orange-600">
                Tiết kiệm {formatPrice(totalSavings)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting || selectedItems.length === 0}
            onClick={handlePlaceOrder}
            className={`px-8 sm:px-14 py-3.5 sm:py-4 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg active:scale-95 shrink-0 ${
              isSubmitting || selectedItems.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MODAL SỔ ĐỊA CHỈ */}
      {/* ========================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-950">Chọn địa chỉ giao hàng</h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {loadingAddresses ? (
                <p className="text-center text-xs text-gray-400 py-6">Đang tải sổ địa chỉ...</p>
              ) : addressLoadError ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-xs leading-5 text-amber-800">
                  {addressLoadError}
                </p>
              ) : savedAddresses.length > 0 ? (
                savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-black cursor-pointer transition flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <p className="font-extrabold text-gray-900">
                        {addr.recipient} - {addr.phone}
                      </p>
                      <p className="text-gray-500 mt-1">
                        {[addr.street, addr.ward, addr.district, normalizeSouthernProvince(addr.province) || addr.province].filter(Boolean).join(', ')}
                      </p>
                      {addr.is_default && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs">
                  <p className="font-bold text-gray-800">Chưa có địa chỉ nào được lưu</p>
                  <p className="mt-1">Bạn có thể điền thông tin trực tiếp tại khung bên trái nhé.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddressModalOpen(false)}
              className="w-full py-3 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL VÍ VOUCHER */}
      {/* ========================================================= */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" /> Ví Voucher của bạn
              </h3>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {AVAILABLE_VOUCHERS.map((v) => {
                const isApplied = appliedVoucher?.code === v.code;
                return (
                  <div
                    key={v.code}
                    onClick={() => {
                      if (isApplied) removeVoucher();
                      else applyVoucher(v.code);
                      setIsVoucherModalOpen(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isApplied
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-black text-gray-900">{v.code}</span>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          isApplied ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isApplied ? 'Đang dùng' : 'Áp dụng'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{v.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2">Hạn sử dụng: {v.expiry}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL ĐẶT HÀNG THÀNH CÔNG */}
      {/* ========================================================= */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-950">
              Đặt hàng thành công!
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">
              Cảm ơn bạn đã lựa chọn mua sắm. Mã đơn hàng của bạn là:
            </p>
            <div className="my-3 py-2 px-4 bg-gray-50 rounded-2xl border border-gray-200 font-mono font-black text-base text-gray-900 inline-block">
              #ORD-{orderSuccessModal.id}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 my-4 text-left text-xs text-gray-600 space-y-1.5 border border-gray-100">
              <p>
                <strong className="text-gray-900">Người nhận:</strong>{' '}
                {orderSuccessModal.receiver_name} - {orderSuccessModal.phone}
              </p>
              <p>
                <strong className="text-gray-900">Địa chỉ:</strong>{' '}
                {orderSuccessModal.address_line}
              </p>
              <p>
                <strong className="text-gray-900">Thanh toán:</strong>{' '}
                <span className="uppercase font-bold text-blue-600">
                  {orderSuccessModal.payment_method}
                </span>
              </p>
              <p>
                <strong className="text-gray-900">Tổng thanh toán:</strong>{' '}
                <strong className="text-sm font-black text-gray-950">
                  {Number(orderSuccessModal.total_amount).toLocaleString('vi-VN')}đ
                </strong>
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setOrderSuccessModal(null);
                  navigate('/account?tab=orders');
                }}
                className="flex-1 py-3.5 border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-black transition"
              >
                Xem đơn hàng
              </button>
              <button
                onClick={() => {
                  setOrderSuccessModal(null);
                  navigate('/');
                }}
                className="flex-1 py-3.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition shadow-md"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
