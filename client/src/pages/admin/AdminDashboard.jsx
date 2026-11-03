import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Users,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  X,
  Palette,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  Sparkles,
  Sliders,
  DollarSign,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Star,
  Smile,
  Frown,
  ShieldCheck,
  UserCheck,
  Filter,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { getColorStyle, getColorHex, formatPrice } from '../../utils/colorHelper';

// Bảng màu thông dụng chuẩn thời trang
const PRESET_COLORS = [
  { name: 'Đen', hex: '#18181b' },
  { name: 'Trắng', hex: '#ffffff' },
  { name: 'Xanh Rêu', hex: '#556b2f' },
  { name: 'Xanh Navy', hex: '#0f172a' },
  { name: 'Xanh Dương', hex: '#1d4ed8' },
  { name: 'Xám', hex: '#64748b' },
  { name: 'Xám Tiêu', hex: '#94a3b8' },
  { name: 'Be', hex: '#d4b996' },
  { name: 'Nâu', hex: '#78350f' },
  { name: 'Tím', hex: '#7c3aed' },
  { name: 'Tím - Đen', hex: '#581c87' },
  { name: 'Đỏ', hex: '#dc2626' },
  { name: 'Vàng', hex: '#eab308' },
  { name: 'Cam', hex: '#ea580c' },
  { name: 'Hồng', hex: '#ec4899' },
  { name: 'Kẻ Caro', hex: '#374151' },
];

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'];

const toSkuPart = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function AdminDashboard() {
  // Tab hiện tại: 'dashboard' | 'orders' | 'products' | 'reviews' | 'users'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dữ liệu chung
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalStock: 0,
    totalCategories: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    recentOrders: [],
    recentReviews: [],
    sentimentStats: { positive: 0, negative: 0 },
  });
  const [loading, setLoading] = useState(true);

  // === DỮ LIỆU SẢN PHẨM ===
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Modal Sản phẩm
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    category_id: '',
    description: '',
  });
  const [productColors, setProductColors] = useState([
    { name: 'Đen', hex: '#18181b', images: [''] },
  ]);
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#556b2f');
  const [selectedSizes, setSelectedSizes] = useState(['M', 'L', 'XL']);
  const [defaultStock, setDefaultStock] = useState(30);
  const [variantList, setVariantList] = useState([]);

  // === DỮ LIỆU ĐƠN HÀNG (ORDERS) ===
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderUpdatingId, setOrderUpdatingId] = useState(null);

  // === DỮ LIỆU BÌNH LUẬN & ĐÁNH GIÁ (REVIEWS) ===
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewProductStats, setReviewProductStats] = useState([]);
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewSearch, setReviewSearch] = useState('');

  // === DỮ LIỆU NGƯỜI DÙNG (USERS) ===
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Tải dữ liệu Dashboard & Thống kê
  const loadStatsAndProducts = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, catsRes, reviewProductStatsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/admin/products').catch(() => ({ data: [] })),
        api.get('/admin/categories').catch(() => ({ data: [] })),
        api.get('/admin/review-product-stats').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data || {});
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setReviewProductStats(Array.isArray(reviewProductStatsRes.data) ? reviewProductStatsRes.data : []);
      const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
      setCategories(cats);

      if (cats.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Lỗi load admin stats & products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách đơn hàng
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = {};
      if (orderStatusFilter !== 'all') params.status = orderStatusFilter;
      if (orderSearch.trim()) params.q = orderSearch.trim();
      const res = await api.get('/admin/orders', { params });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi load danh sách đơn hàng:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng (Duyệt đơn, Đã giao, Hủy đơn)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrderUpdatingId(orderId);
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder((prev) => ({ ...prev, status: newStatus }));
      }
      // Cập nhật lại số liệu thống kê
      api.get('/admin/stats').then((res) => setStats(res.data || {}));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật đơn hàng.');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  // Tải danh sách đánh giá
  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const params = {};
      if (reviewSentimentFilter !== 'all') params.sentiment = reviewSentimentFilter;
      if (reviewRatingFilter !== 'all') params.rating = reviewRatingFilter;
      if (reviewSearch.trim()) params.q = reviewSearch.trim();
      const res = await api.get('/admin/reviews', { params });
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi load danh sách đánh giá:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Ẩn / Hiện đánh giá
  const handleToggleReviewVisibility = async (reviewId) => {
    try {
      const res = await api.patch(`/admin/reviews/${reviewId}/visibility`);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, is_hidden: res.data?.review?.is_hidden } : r
        )
      );
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Lỗi cập nhật hiển thị.');
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này vĩnh viễn?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setStats((prev) => ({ ...prev, totalReviews: Math.max(0, prev.totalReviews - 1) }));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Lỗi khi xóa đánh giá.');
    }
  };

  // Tải danh sách người dùng
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userSearch.trim()) params.q = userSearch.trim();
      const res = await api.get('/admin/users', { params });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi load danh sách người dùng:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Đổi vai trò người dùng (Admin <-> Customer)
  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    const confirmMsg =
      newRole === 'admin'
        ? 'Bạn có chắc chắn muốn cấp quyền Quản trị viên (Admin) cho người dùng này?'
        : 'Bạn có chắc chắn muốn hạ quyền người này xuống Khách hàng (Customer)?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Không thể đổi vai trò người dùng.');
    }
  };

  // Effect khi chuyển tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStatsAndProducts();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'products') {
      if (products.length === 0) loadStatsAndProducts();
    } else if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // Effect khi thay đổi bộ lọc đơn hàng
  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [orderStatusFilter]);

  // Effect khi thay đổi bộ lọc đánh giá
  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [reviewSentimentFilter, reviewRatingFilter]);

  // Effect khi thay đổi bộ lọc người dùng
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [userRoleFilter]);

  // ========================================================
  // XỬ LÝ SẢN PHẨM & BIẾN THỂ (PRODUCT MATRIX & COLOR PICKER)
  // ========================================================
  useEffect(() => {
    let basePrice = parseFloat(formData.base_price) || 0;
    if (basePrice > 0 && basePrice < 1000) {
      basePrice = basePrice * 1000;
    }
    const newVariants = [];

    productColors.forEach((colorObj) => {
      selectedSizes.forEach((size) => {
        const existing = variantList.find(
          (v) => v.color === colorObj.name && v.size === size
        );

        newVariants.push({
          color: colorObj.name,
          size: size,
          price: basePrice > 0 ? basePrice : existing?.price || 0,
          stock: existing?.stock !== undefined ? existing.stock : defaultStock,
          sku: existing?.sku || `SKU-${toSkuPart(colorObj.name)}-${toSkuPart(size)}`,
        });
      });
    });

    setVariantList(newVariants);
  }, [productColors, selectedSizes, formData.base_price, defaultStock]);

  const handleAddPresetColor = (preset) => {
    if (productColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) return;
    setProductColors((prev) => [
      ...prev,
      { name: preset.name, hex: preset.hex, images: [''] },
    ]);
  };

  const handleAddCustomColor = () => {
    if (!customColorInput.trim()) return;
    const name = customColorInput.trim();
    if (productColors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Màu này đã có trong danh sách!');
      return;
    }
    const hex = customColorHex || getColorHex(name, '#556b2f');
    setProductColors((prev) => [...prev, { name, hex, images: [''] }]);
    setCustomColorInput('');
  };

  const handleUpdateColorHex = (colorName, newHex) => {
    setProductColors((prev) =>
      prev.map((c) => (c.name === colorName ? { ...c, hex: newHex } : c))
    );
  };

  const handleRemoveColor = (colorName) => {
    if (productColors.length <= 1) {
      alert('Sản phẩm cần có ít nhất 1 màu!');
      return;
    }
    setProductColors((prev) => prev.filter((c) => c.name !== colorName));
  };

  const handleAddImageToColor = (colorName) => {
    setProductColors((prev) =>
      prev.map((c) => {
        if (c.name === colorName) {
          return { ...c, images: [...(c.images || []), ''] };
        }
        return c;
      })
    );
  };

  const handleUpdateColorImage = (colorName, imgIndex, newUrl) => {
    setProductColors((prev) =>
      prev.map((c) => {
        if (c.name === colorName) {
          const updatedImgs = [...(c.images || [])];
          updatedImgs[imgIndex] = newUrl;
          return { ...c, images: updatedImgs };
        }
        return c;
      })
    );
  };

  const handleRemoveColorImage = (colorName, imgIndex) => {
    setProductColors((prev) =>
      prev.map((c) => {
        if (c.name === colorName) {
          const updatedImgs = (c.images || []).filter((_, idx) => idx !== imgIndex);
          return { ...c, images: updatedImgs.length > 0 ? updatedImgs : [''] };
        }
        return c;
      })
    );
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSelectAllSizes = () => {
    if (selectedSizes.length === STANDARD_SIZES.length) {
      setSelectedSizes(['M', 'L']);
    } else {
      setSelectedSizes([...STANDARD_SIZES]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      base_price: '',
      category_id: categories[0]?.id || '',
      description: '',
    });
    setProductColors([{ name: 'Đen', hex: '#18181b', images: [''] }]);
    setSelectedSizes(['M', 'L', 'XL']);
    setDefaultStock(30);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      base_price: prod.base_price || prod.price || '',
      category_id: prod.category_id || categories[0]?.id || '',
      description: prod.description || '',
    });

    const colorsMap = new Map();
    (prod.variants || []).forEach((v) => {
      if (v.color && !colorsMap.has(v.color)) {
        const matchedImgs = (prod.images || [])
          .filter((img) => img.color && img.color.toLowerCase() === v.color.toLowerCase())
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((img) => img.url);

        const matchedPreset = PRESET_COLORS.find(
          (pc) => pc.name.toLowerCase() === v.color.toLowerCase()
        );

        colorsMap.set(v.color, {
          name: v.color,
          hex: matchedPreset?.hex || getColorHex(v.color, '#556b2f'),
          images: matchedImgs.length > 0 ? matchedImgs : [''],
        });
      }
    });

    const parsedColors = Array.from(colorsMap.values());
    setProductColors(
      parsedColors.length > 0
        ? parsedColors
        : [{ name: 'Đen', hex: '#18181b', images: [prod.images?.[0]?.url || ''] }]
    );

    const sizes = Array.from(new Set((prod.variants || []).map((v) => v.size).filter(Boolean)));
    setSelectedSizes(sizes.length > 0 ? sizes : ['M', 'L', 'XL']);
    setShowProductModal(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm!');
      return;
    }
    if (!formData.base_price || Number(formData.base_price) <= 0) {
      alert('Vui lòng nhập giá bán hợp lệ!');
      return;
    }
    if (productColors.length === 0) {
      alert('Vui lòng gán ít nhất một màu sắc cho sản phẩm!');
      return;
    }
    if (selectedSizes.length === 0) {
      alert('Vui lòng chọn ít nhất một kích thước!');
      return;
    }

    const imagesPayload = [];
    let orderIndex = 0;
    productColors.forEach((c) => {
      (c.images || []).forEach((urlStr, sortIdx) => {
        if (urlStr && urlStr.trim()) {
          imagesPayload.push({
            url: urlStr.trim(),
            color: c.name,
            sort_order: sortIdx,
          });
          orderIndex++;
        }
      });
    });

    if (imagesPayload.length === 0) {
      imagesPayload.push({
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        color: productColors[0].name,
        sort_order: 0,
      });
    }

    let normalizedPrice = parseFloat(formData.base_price);
    if (normalizedPrice > 0 && normalizedPrice < 1000) {
      normalizedPrice = normalizedPrice * 1000;
    }

    const payload = {
      name: formData.name.trim(),
      base_price: normalizedPrice,
      category_id: parseInt(formData.category_id),
      description: formData.description.trim(),
      images: imagesPayload,
      variants: variantList.map((v) => ({
        ...v,
        price: normalizedPrice,
      })),
    };

    try {
      setSubmittingProduct(true);
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/admin/products', payload);
        alert('Tạo sản phẩm và gán bộ ảnh thành công!');
      }
      setShowProductModal(false);
      await loadStatsAndProducts();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Có lỗi khi lưu sản phẩm');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm: "${name}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setStats((prev) => ({ ...prev, totalProducts: Math.max(0, prev.totalProducts - 1) }));
      alert('Đã xóa sản phẩm thành công!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Không thể xóa sản phẩm.');
    }
  };

  const handleSeedSampleProducts = async () => {
    try {
      setLoading(true);
      await api.post('/admin/seed-sample');
      await loadStatsAndProducts();
      alert('Đã nạp thành công các sản phẩm mẫu chuẩn Coolmate!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Lỗi nạp sản phẩm mẫu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat =
        !selectedCategoryFilter || String(p.category_id) === String(selectedCategoryFilter);
      return matchName && matchCat;
    });
  }, [products, productSearch, selectedCategoryFilter]);

  // Trợ giúp hiển thị trạng thái đơn hàng
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Đang giao hàng
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao thành công
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Helper Sentiment badge
  const getSentimentBadge = (label, score) => {
    const confidence = Number.isFinite(Number(score)) ? ` ${Math.round(Number(score) * 100)}%` : '';
    switch (label) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Smile className="w-3.5 h-3.5" /> Tích cực{confidence}
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Frown className="w-3.5 h-3.5" /> Tiêu cực{confidence}
          </span>
        );
      default:
        return <span className="text-xs text-gray-400">Chưa phân tích</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans pb-16">
      
      {/* 1. TOP HEADER QUẢN TRỊ VIÊN */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black shadow-md">
                AD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-gray-950">
                    Bảng Điều Khiển Quản Trị
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-white">
                    Admin Portal
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Hệ thống kiểm soát đơn hàng, phê duyệt giao dịch, hàng hóa & đánh giá
                </p>
              </div>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-3">
              {stats.pendingOrders > 0 && (
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusFilter('pending');
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs hover:bg-amber-600 transition animate-pulse cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>{stats.pendingOrders} đơn chờ duyệt</span>
                </button>
              )}

              <Link
                to="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                <span>Xem Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS (TAB BAR) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto border-t border-gray-100 pt-1 -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-tight transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Tổng Quan & Thống Kê</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-tight transition cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Đơn Hàng & Duyệt Đơn</span>
              {stats.pendingOrders > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                  {stats.pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-tight transition cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Quản Lý Sản Phẩm</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-tight transition cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>Bình Luận & Đánh Giá</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-tight transition cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản Lý Người Dùng</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 2. NỘI DUNG CHÍNH THEO TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD (TỔNG QUAN & THỐNG KÊ) ================ */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Doanh thu */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tổng Doanh Thu
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-950">
                  {formatPrice(stats.totalRevenue || 0)}
                </div>
                <p className="text-[11px] text-gray-400">
                  Đã trừ các đơn bị hủy ({stats.totalOrders} đơn hàng)
                </p>
              </div>

              {/* Đơn chờ duyệt */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Đơn Cần Duyệt
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 flex items-baseline gap-2">
                  <span>{stats.pendingOrders || 0}</span>
                  <span className="text-xs font-bold text-gray-400">/ {stats.totalOrders} đơn</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Đang chờ xuất kho & giao đơn vị vận chuyển
                </p>
              </div>

              {/* Tổng sản phẩm & Tồn kho */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Sản Phẩm & Tồn Kho
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Boxes className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-950">
                  {stats.totalProducts}{' '}
                  <span className="text-xs font-normal text-gray-400">mẫu</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Tổng {stats.totalStock?.toLocaleString('vi-VN')} chiếc trong kho
                </p>
              </div>

              {/* Đánh giá & Khách hàng */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Khách Hàng & Đánh Giá
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-950">
                  {stats.totalUsers}{' '}
                  <span className="text-xs font-normal text-gray-400">khách</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {stats.totalReviews || 0} đánh giá phản hồi từ khách
                </p>
              </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xs">
              <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-black text-gray-950">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Thống kê cảm xúc theo sản phẩm
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">Mỗi dòng là sản phẩm đã có bình luận; chọn xem chi tiết để đọc từng bình luận.</p>
                </div>
                <button onClick={loadStatsAndProducts} className="text-xs font-bold text-blue-600 hover:underline">Làm mới thống kê</button>
              </div>
              {reviewProductStats.length ? (
                <div className="divide-y divide-gray-100">
                  {reviewProductStats.map((product) => {
                    const classified = product.sentimentStats.positive + product.sentimentStats.negative;
                    const positivePercent = classified ? Math.round((product.sentimentStats.positive / classified) * 100) : 0;
                    const negativePercent = classified ? 100 - positivePercent : 0;
                    return (
                      <div key={product.id} className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-12 sm:items-center sm:px-8">
                        <div className="sm:col-span-5">
                          <Link to={`/admin/products/${product.id}/reviews`} className="font-bold text-gray-900 hover:text-blue-600">{product.name}</Link>
                          <p className="mt-1 text-[11px] text-gray-400">{product.reviewCount} bình luận · {classified} đã được AI phân loại</p>
                        </div>
                        <div className="sm:col-span-4">
                          <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="bg-emerald-500" style={{ width: `${positivePercent}%` }} title={`Tích cực ${positivePercent}%`} />
                            <div className="bg-rose-500" style={{ width: `${negativePercent}%` }} title={`Tiêu cực ${negativePercent}%`} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold sm:col-span-2 sm:justify-end">
                          <span className="text-emerald-700">+{product.sentimentStats.positive}</span>
                          <span className="text-rose-700">−{product.sentimentStats.negative}</span>
                        </div>
                        <div className="sm:col-span-1 sm:text-right">
                          <Link to={`/admin/products/${product.id}/reviews`} className="text-xs font-bold text-blue-600 hover:underline">Chi tiết</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-gray-400">Chưa có sản phẩm nào được bình luận.</p>
              )}
            </section>

            {/* BẢNG THỐNG KÊ PHÂN TÍCH CẢM XÚC AI (SENTIMENT ANALYSIS) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Thống Kê Phân Tích Cảm Xúc Đánh Giá (AI Sentiment)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Mô hình tự động phân loại cảm nhận của khách hàng khi gửi đánh giá
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Xem chi tiết đánh giá <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(() => {
                const total =
                  (stats.sentimentStats?.positive || 0) +
                  (stats.sentimentStats?.negative || 0);
                const posPercent = total > 0 ? Math.round(((stats.sentimentStats?.positive || 0) / total) * 100) : 0;
                const negPercent = total > 0 ? Math.round(((stats.sentimentStats?.negative || 0) / total) * 100) : 0;

                return (
                  <div className="space-y-4">
                    {/* Thanh tỷ lệ tổng hợp */}
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${posPercent}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                        title={`Tích cực: ${posPercent}%`}
                      />
                      <div
                        style={{ width: `${negPercent}%` }}
                        className="bg-rose-500 transition-all duration-500"
                        title={`Tiêu cực: ${negPercent}%`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smile className="w-6 h-6 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block">Tích Cực</span>
                            <span className="text-xs text-emerald-700">
                              {stats.sentimentStats?.positive || 0} đánh giá ({posPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Frown className="w-6 h-6 text-rose-600" />
                          <div>
                            <span className="text-xs font-bold text-rose-950 block">Tiêu Cực</span>
                            <span className="text-xs text-rose-700">
                              {stats.sentimentStats?.negative || 0} đánh giá ({negPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* HAI BẢNG TÓM TẮT: ĐƠN HÀNG MỚI NHẤT & ĐÁNH GIÁ MỚI NHẤT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Đơn hàng mới nhất */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-black" /> Đơn Hàng Mới Nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Xem tất cả &gt;
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">#{ord.id}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold text-gray-800">{ord.receiver_name}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(ord.created_at).toLocaleDateString('vi-VN')} • {ord.items?.length || 0} sản phẩm
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-gray-900 block">
                              {formatPrice(ord.total_amount)}
                            </span>
                            {getOrderStatusBadge(ord.status)}
                          </div>

                          {ord.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'shipping')}
                              className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                            >
                              Duyệt ngay
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Chưa có đơn hàng nào
                    </div>
                  )}
                </div>
              </div>

              {/* Đánh giá mới nhất */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Đánh Giá Mới Nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Xem tất cả &gt;
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {stats.recentReviews && stats.recentReviews.length > 0 ? (
                    stats.recentReviews.map((rev) => (
                      <div key={rev.id} className="py-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 truncate max-w-[140px]">
                            {rev.user?.full_name || 'Khách hàng'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                            {getSentimentBadge(rev.sentiment_label, rev.sentiment_score)}
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-600 line-clamp-2">
                          "{rev.content}"
                        </p>

                        <p className="text-[10px] text-gray-400 font-medium truncate">
                          Sản phẩm: {rev.product?.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Chưa có đánh giá nào
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUẢN LÝ & DUYỆT ĐƠN HÀNG (ORDERS) =============== */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header tab đơn hàng */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950">
                    Danh Sách & Phê Duyệt Đơn Hàng
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kiểm tra, duyệt giao hàng và quản lý tiến độ xử lý đơn hàng của khách
                  </p>
                </div>

                <button
                  onClick={loadOrders}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Bộ lọc trạng thái & Thanh tìm kiếm */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'pending', label: 'Chờ xử lý' },
                    { id: 'shipping', label: 'Đang giao' },
                    { id: 'delivered', label: 'Đã giao' },
                    { id: 'cancelled', label: 'Đã hủy' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        orderStatusFilter === tab.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn, tên khách, SĐT, thành phố..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadOrders();
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:border-black"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* BẢNG ĐƠN HÀNG */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <th className="py-3.5 px-5">Mã đơn</th>
                      <th className="py-3.5 px-4">Khách hàng</th>
                      <th className="py-3.5 px-4">Sản phẩm đặt</th>
                      <th className="py-3.5 px-4">Tổng tiền & TT</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Đang tải danh sách đơn hàng...
                        </td>
                      </tr>
                    ) : orders.length > 0 ? (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/50 transition">
                          {/* Mã đơn & Thời gian */}
                          <td className="py-4 px-5">
                            <span className="font-extrabold text-gray-950 font-mono">
                              #{ord.id}
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(ord.created_at).toLocaleDateString('vi-VN')}{' '}
                              {new Date(ord.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </td>

                          {/* Khách hàng */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-gray-900 block">
                              {ord.receiver_name}
                            </span>
                            <span className="text-[11px] text-gray-500 block">
                              {ord.phone}
                            </span>
                            <span className="text-[10px] text-gray-400 line-clamp-1">
                              {ord.address_line}, {ord.city}
                            </span>
                          </td>

                          {/* Sản phẩm */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {ord.items?.slice(0, 2).map((item) => (
                                <div key={item.id} className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-gray-800 line-clamp-1 max-w-xs">
                                    {item.product_name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                              {ord.items?.length > 2 && (
                                <span className="text-[10px] text-blue-600 font-bold">
                                  + {ord.items.length - 2} sản phẩm khác
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Tổng tiền & Phương thức */}
                          <td className="py-4 px-4">
                            <span className="font-black text-gray-950 text-sm block">
                              {formatPrice(ord.total_amount)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold uppercase text-gray-500">
                                {ord.payment_method}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span
                                className={`text-[10px] font-bold ${
                                  ord.payment_status === 'paid'
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {ord.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-4 px-4">
                            {getOrderStatusBadge(ord.status)}
                          </td>

                          {/* Hành động */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Nút xem chi tiết modal */}
                              <button
                                onClick={() => setViewingOrder(ord)}
                                className="px-2.5 py-1.5 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition font-bold text-xs cursor-pointer"
                              >
                                Chi tiết
                              </button>

                              {/* Duyệt đơn: pending -> shipping */}
                              {ord.status === 'pending' && (
                                <button
                                  disabled={orderUpdatingId === ord.id}
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'shipping')}
                                  className="px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition cursor-pointer"
                                >
                                  Duyệt đơn
                                </button>
                              )}

                              {/* Đang giao -> Đã giao */}
                              {ord.status === 'shipping' && (
                                <button
                                  disabled={orderUpdatingId === ord.id}
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                                >
                                  Đã giao
                                </button>
                              )}

                              {/* Hủy đơn */}
                              {['pending', 'shipping'].includes(ord.status) && (
                                <button
                                  disabled={orderUpdatingId === ord.id}
                                  onClick={() => {
                                    if (window.confirm(`Hủy đơn hàng #${ord.id}?`)) {
                                      handleUpdateOrderStatus(ord.id, 'cancelled');
                                    }
                                  }}
                                  className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  title="Hủy đơn"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">
                          <ShoppingBag className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-gray-300" />
                          <p className="text-xs font-bold text-gray-600">Không tìm thấy đơn hàng nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {viewingOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-gray-950">
                        Chi Tiết Đơn Hàng #{viewingOrder.id}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Ngày đặt: {new Date(viewingOrder.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingOrder(null)}
                      className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-6 text-xs">
                    {/* Thông tin người nhận & trạng thái */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <span className="font-bold text-gray-500 text-[11px] uppercase block mb-1">
                          Người nhận hàng:
                        </span>
                        <p className="font-extrabold text-gray-900">{viewingOrder.receiver_name}</p>
                        <p className="text-gray-600">{viewingOrder.phone}</p>
                        <p className="text-gray-600">{viewingOrder.address_line}, {viewingOrder.city}</p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 text-[11px] uppercase block mb-1">
                          Trạng thái & Thanh toán:
                        </span>
                        <div className="mb-2">{getOrderStatusBadge(viewingOrder.status)}</div>
                        <p className="text-gray-600">
                          Phương thức: <b>{viewingOrder.payment_method?.toUpperCase()}</b>
                        </p>
                        <p className="text-gray-600">
                          Trạng thái TT: <b>{viewingOrder.payment_status === 'paid' ? 'Đã trả' : 'Chưa trả'}</b>
                        </p>
                      </div>
                    </div>

                    {/* Danh sách các sản phẩm */}
                    <div>
                      <h4 className="font-black text-gray-900 uppercase text-xs mb-3">
                        Danh sách sản phẩm ({viewingOrder.items?.length || 0})
                      </h4>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                        {viewingOrder.items?.map((item) => {
                          const primaryImg =
                            item.variant?.product?.images?.[0]?.url ||
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

                          return (
                            <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={primaryImg}
                                  alt=""
                                  className="w-12 h-14 object-cover rounded-xl border border-gray-200 bg-gray-50 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-gray-900">{item.product_name}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Phân loại: Màu {item.variant?.color || 'Chuẩn'} - Size {item.variant?.size || 'M'}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    SKU: {item.variant?.sku}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-extrabold text-gray-900 block">
                                  {formatPrice(item.unit_price)} x {item.quantity}
                                </span>
                                <span className="text-[11px] font-bold text-blue-600">
                                  = {formatPrice(Number(item.unit_price) * item.quantity)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tổng cộng */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="font-black text-gray-900">Tổng thanh toán:</span>
                      <span className="font-black text-xl text-gray-950">
                        {formatPrice(viewingOrder.total_amount)}
                      </span>
                    </div>

                    {/* Thao tác chuyển trạng thái nhanh */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {viewingOrder.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'shipping')}
                          className="px-4 py-2 bg-black text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition cursor-pointer"
                        >
                          Duyệt Đơn & Chuyển Sang Giao Hàng
                        </button>
                      )}
                      {viewingOrder.status === 'shipping' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'delivered')}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Xác Nhận Đã Giao Hàng Thành Công
                        </button>
                      )}
                      {['pending', 'shipping'].includes(viewingOrder.status) && (
                        <button
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                              handleUpdateOrderStatus(viewingOrder.id, 'cancelled');
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition cursor-pointer"
                        >
                          Hủy Đơn Hàng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: QUẢN LÝ SẢN PHẨM & BIẾN THỂ (PRODUCTS) =========== */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Thanh công cụ sản phẩm */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Quản Lý Hàng Hóa & Biến Thể
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thêm mới, gán màu sắc chuẩn thời trang, tùy chỉnh mã màu Hex và phân loại kích cỡ
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={loadStatsAndProducts}
                  className="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 transition cursor-pointer"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSeedSampleProducts}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                  title="Tải lại các mẫu sản phẩm chuẩn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nạp mẫu Coolmate</span>
                </button>

                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm sản phẩm mới</span>
                </button>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Tìm theo tên sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:border-black"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl outline-none focus:border-black"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <th className="py-3.5 px-5">Sản phẩm</th>
                      <th className="py-3.5 px-4">Danh mục</th>
                      <th className="py-3.5 px-4">Giá bán</th>
                      <th className="py-3.5 px-4">Màu sắc đã gán</th>
                      <th className="py-3.5 px-4">Kích cỡ & Kho</th>
                      <th className="py-3.5 px-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        const colors = p.colors || [];
                        const sizes = p.sizes || [];
                        const totalStock = p.total_stock || 0;

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.primary_image}
                                  alt={p.name}
                                  className="w-12 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                    #{p.id} • {p.slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 font-semibold text-gray-700">
                              {p.category?.name || 'Chưa phân loại'}
                            </td>

                            <td className="py-4 px-4 font-black text-gray-950">
                              {formatPrice(p.price || p.base_price)}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {colors.length > 0 ? (
                                  colors.map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md text-[11px] font-bold"
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                        style={getColorStyle(c, getColorHex(c, '#556b2f'))}
                                      />
                                      {c}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-[11px]">Chưa gán màu</span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {sizes.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[10px] font-bold"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-[11px] text-gray-500 font-semibold">
                                  Kho: <strong className="text-gray-900">{totalStock}</strong> cái
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/products/${p.slug || p.id}`}
                                  target="_blank"
                                  className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition"
                                  title="Xem sản phẩm ngoài cửa hàng"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(p)}
                                  className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                  title="Chỉnh sửa sản phẩm"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition cursor-pointer"
                                  title="Xóa sản phẩm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">
                          <Package className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-gray-300" />
                          <p className="text-xs font-bold text-gray-600">Không có sản phẩm nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL THÊM / SỬA SẢN PHẨM */}
            {showProductModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
                  
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-lg font-black text-gray-950">
                        {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm & Gán Màu Sắc'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Thiết lập tên hàng, giá niêm yết, các màu chuẩn kèm link ảnh và kích cỡ tương ứng
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <Package className="w-4 h-4 text-black" /> 1. Thông Tin Cơ Bản
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">
                            Tên sản phẩm *
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Áo Khoác Nam có mũ Daily Wear..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm font-semibold outline-none focus:border-black transition"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">
                            Danh mục *
                          </label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-800 bg-white outline-none focus:border-black transition cursor-pointer"
                          >
                            <option value="">-- Chọn danh mục --</option>
                            <optgroup label="─── ÁO NAM ───">
                              {categories
                                .filter((c) => ['ao-khoac', 'ao-dai-tay', 'ao-thun', 'ao-so-mi', 'ao-tanktop'].includes(c.slug))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="─── QUẦN NAM ───">
                              {categories
                                .filter((c) => ['quan-nam', 'quan-short', 'quan-kaki', 'quan-jogger'].includes(c.slug))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="─── THỜI TRANG NỮ ───">
                              {categories
                                .filter((c) => ['ao-nu', 'quan-nu', 'ao-khoac-nu', 'vay-dam'].includes(c.slug))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="─── THỂ THAO & KHÁC ───">
                              {categories
                                .filter((c) => !['ao-khoac', 'ao-dai-tay', 'ao-thun', 'ao-so-mi', 'ao-tanktop', 'quan-nam', 'quan-short', 'quan-kaki', 'quan-jogger', 'ao-nu', 'quan-nu', 'ao-khoac-nu', 'vay-dam'].includes(c.slug))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">
                            Giá bán (VNĐ) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="VD: 449000"
                              value={formData.base_price}
                              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                              required
                              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-900 outline-none focus:border-black transition pr-10"
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400 pointer-events-none">
                              đ
                            </span>
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">
                            Mô tả ngắn
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Chất liệu modal mềm mịn, kháng khuẩn tự nhiên..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium outline-none focus:border-black transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 2: GÁN MÀU SẮC CHUẨN KÈM COLOR PICKER & ALBUM ẢNH */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-black" /> 2. Gán Màu Sắc Chuẩn & Link Ảnh
                        </h4>
                        <span className="text-[11px] text-gray-500 font-semibold">
                          Đã thêm: <strong>{productColors.length}</strong> màu
                        </span>
                      </div>

                      {/* Gợi ý click nhanh */}
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium mb-1.5">
                          Click để thêm nhanh màu sắc phổ biến:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((preset) => {
                            const isAdded = productColors.some(
                              (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                            );
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => handleAddPresetColor(preset)}
                                disabled={isAdded}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                                  isAdded
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                    : 'bg-white text-gray-800 border-gray-200 hover:border-black cursor-pointer'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: preset.hex }}
                                />
                                <span>{preset.name}</span>
                                {!isAdded && <Plus className="w-3 h-3 text-gray-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Thêm màu tùy chỉnh kèm Color Picker Hex */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColorHex}
                          onChange={(e) => setCustomColorHex(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer shrink-0"
                          title="Chọn mã màu Hex"
                        />
                        <input
                          type="text"
                          placeholder="Nhập tên màu tùy chỉnh (VD: Xanh Rêu, Xanh Olive...)"
                          value={customColorInput}
                          onChange={(e) => setCustomColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomColor();
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 text-xs outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-2xl hover:bg-black transition cursor-pointer shrink-0"
                        >
                          + Thêm màu
                        </button>
                      </div>

                      {/* Danh sách các màu đã gán */}
                      <div className="space-y-3.5 pt-2">
                        {productColors.map((colorObj) => (
                          <div
                            key={colorObj.name}
                            className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200/80 space-y-3"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                              <div className="flex items-center gap-2.5">
                                {/* Color Picker trực tiếp cho màu này */}
                                <input
                                  type="color"
                                  value={colorObj.hex || getColorHex(colorObj.name, '#556b2f')}
                                  onChange={(e) => handleUpdateColorHex(colorObj.name, e.target.value)}
                                  className="w-6 h-6 rounded-full border border-black/20 p-0 cursor-pointer shrink-0"
                                  title="Click để điều chỉnh mã màu Hex"
                                />
                                <span className="text-xs font-black text-gray-900">
                                  {colorObj.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  ({colorObj.hex || getColorHex(colorObj.name, '#556b2f')})
                                </span>
                                <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                  {(colorObj.images || []).filter((u) => u && u.trim()).length} ảnh
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddImageToColor(colorObj.name)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 text-blue-600 rounded-lg text-xs font-bold border border-gray-200 transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm link ảnh</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(colorObj.name)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition cursor-pointer"
                                  title="Xóa màu này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Danh sách link ảnh của màu */}
                            <div className="space-y-2">
                              {(colorObj.images || ['']).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="flex items-center gap-2.5">
                                  <span className="text-[11px] font-bold text-gray-400 w-4 text-center shrink-0">
                                    #{imgIdx + 1}
                                  </span>
                                  <input
                                    type="url"
                                    placeholder={`Dán link ảnh ${imgIdx === 0 ? 'đại diện' : 'chi tiết ' + (imgIdx + 1)} cho màu "${colorObj.name}" (https://...)...`}
                                    value={imgUrl}
                                    onChange={(e) =>
                                      handleUpdateColorImage(colorObj.name, imgIdx, e.target.value)
                                    }
                                    className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-black"
                                  />

                                  {imgUrl && imgUrl.trim() ? (
                                    <img
                                      src={imgUrl}
                                      alt=""
                                      className="w-9 h-11 object-cover rounded-lg border border-gray-200 bg-white shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-11 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-[9px] text-gray-400 shrink-0 bg-white">
                                      Trống
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorImage(colorObj.name, imgIdx)}
                                    disabled={(colorObj.images || []).length <= 1}
                                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-white transition cursor-pointer shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KHỐI 3: KÍCH THƯỚC (SIZE) */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-black" /> 3. Kích Thước (Size)
                        </h4>
                        <button
                          type="button"
                          onClick={handleSelectAllSizes}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {selectedSizes.length === STANDARD_SIZES.length ? 'Thu gọn' : 'Chọn tất cả'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {STANDARD_SIZES.map((size) => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`w-12 h-10 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Submit */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowProductModal(false)}
                        className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                      >
                        Hủy bỏ
                      </button>

                      <button
                        type="submit"
                        disabled={submittingProduct}
                        className="px-6 py-2.5 rounded-2xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {submittingProduct
                          ? 'Đang lưu...'
                          : editingProduct
                          ? 'Lưu cập nhật'
                          : 'Hoàn tất & Tạo sản phẩm'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: QUẢN LÝ BÌNH LUẬN & ĐÁNH GIÁ (REVIEWS) ========== */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header tab đánh giá */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Quản Lý Bình Luận & Đánh Giá
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kiểm duyệt nội dung phản hồi, lọc theo mức độ hài lòng và ẩn/xóa bình luận không phù hợp
                  </p>
                </div>

                <button
                  onClick={loadReviews}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reviewsLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Bộ lọc Sentiment, Rating & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-100">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Cảm xúc AI</label>
                  <select
                    value={reviewSentimentFilter}
                    onChange={(e) => setReviewSentimentFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl outline-none focus:border-black"
                  >
                    <option value="all">Tất cả cảm xúc</option>
                    <option value="positive">Tích cực (Positive)</option>
                    <option value="negative">Tiêu cực (Negative)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Số sao</label>
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl outline-none focus:border-black"
                  >
                    <option value="all">Tất cả các sao</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Tìm kiếm nội dung</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm theo nội dung, tên người đánh giá, tên sản phẩm..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadReviews();
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:border-black"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG ĐÁNH GIÁ */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <th className="py-3.5 px-5">Khách hàng</th>
                      <th className="py-3.5 px-4">Sản phẩm</th>
                      <th className="py-3.5 px-4">Đánh giá</th>
                      <th className="py-3.5 px-4">Nội dung bình luận</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {reviewsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Đang tải danh sách đánh giá...
                        </td>
                      </tr>
                    ) : reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <tr key={rev.id} className={`hover:bg-gray-50/50 transition ${rev.is_hidden ? 'bg-gray-50/40 opacity-70' : ''}`}>
                          {/* Khách hàng */}
                          <td className="py-4 px-5">
                            <span className="font-bold text-gray-900 block">
                              {rev.user?.full_name || 'Khách hàng'}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </td>

                          {/* Sản phẩm */}
                          <td className="py-4 px-4">
                            <Link
                              to={`/products/${rev.product?.slug || rev.product?.id}`}
                              target="_blank"
                              className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-1 max-w-xs"
                            >
                              {rev.product?.name || 'Sản phẩm'}
                            </Link>
                            <Link
                              to={`/admin/products/${rev.product?.id}/reviews`}
                              className="mt-1 inline-block text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Xem thống kê cảm xúc
                            </Link>
                          </td>

                          {/* Đánh giá sao & cảm xúc */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-400">
                                {[...Array(rev.rating || 5)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>
                              <span className="font-black text-gray-800">{rev.rating} sao</span>
                            </div>
                            <div className="mt-1">{getSentimentBadge(rev.sentiment_label, rev.sentiment_score)}</div>
                          </td>

                          {/* Nội dung */}
                          <td className="py-4 px-4 max-w-md">
                            <p className="text-gray-800 leading-relaxed line-clamp-3">
                              {rev.content}
                            </p>
                          </td>

                          {/* Trạng thái ẩn/hiện */}
                          <td className="py-4 px-4">
                            {rev.is_hidden ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">
                                <EyeOff className="w-3 h-3" /> Đã ẩn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                <Eye className="w-3 h-3" /> Đang hiển thị
                              </span>
                            )}
                          </td>

                          {/* Hành động */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleReviewVisibility(rev.id)}
                                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                  rev.is_hidden
                                    ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                }`}
                                title={rev.is_hidden ? 'Hiển thị lại' : 'Ẩn đánh giá'}
                              >
                                {rev.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition cursor-pointer"
                                title="Xóa đánh giá vĩnh viễn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">
                          <Star className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-gray-300" />
                          <p className="text-xs font-bold text-gray-600">Không tìm thấy đánh giá nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: QUẢN LÝ NGƯỜI DÙNG (USERS) ====================== */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header tab người dùng */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                    <Users className="w-5 h-5 text-black" />
                    Quản Lý Danh Sách Khách Hàng & Người Dùng
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xem thông tin tài khoản, lịch sử mua sắm và phân quyền Quản trị viên (Admin)
                  </p>
                </div>

                <button
                  onClick={loadUsers}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Bộ lọc vai trò & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'customer', label: 'Khách hàng' },
                    { id: 'admin', label: 'Quản trị viên (Admin)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserRoleFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        userRoleFilter === tab.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, email, số điện thoại..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadUsers();
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:border-black"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* BẢNG NGƯỜI DÙNG */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <th className="py-3.5 px-5">ID & Họ Tên</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Số điện thoại</th>
                      <th className="py-3.5 px-4">Đơn hàng / Đánh giá</th>
                      <th className="py-3.5 px-4">Vai trò</th>
                      <th className="py-3.5 px-5 text-right">Phân quyền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Đang tải danh sách người dùng...
                        </td>
                      </tr>
                    ) : users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition">
                          {/* Họ tên */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                                {u.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <span className="font-extrabold text-gray-900 block">
                                  {u.full_name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  #{u.id} • Tham gia {new Date(u.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-4 px-4 font-mono text-gray-700">
                            {u.email}
                          </td>

                          {/* SĐT */}
                          <td className="py-4 px-4 text-gray-700">
                            {u.phone || 'Chưa cập nhật'}
                          </td>

                          {/* Số đơn & Đánh giá */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-gray-900 block">
                              {u._count?.orders || 0} đơn hàng
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {u._count?.reviews || 0} đánh giá
                            </span>
                          </td>

                          {/* Vai trò */}
                          <td className="py-4 px-4">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-black text-white">
                                <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                                <UserCheck className="w-3.5 h-3.5" /> Khách hàng
                              </span>
                            )}
                          </td>

                          {/* Nút phân quyền */}
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                u.role === 'admin'
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'bg-black text-white hover:bg-neutral-800 shadow-xs'
                              }`}
                            >
                              {u.role === 'admin' ? 'Hạ quyền Customer' : 'Cấp quyền Admin'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">
                          <Users className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-gray-300" />
                          <p className="text-xs font-bold text-gray-600">Không tìm thấy người dùng nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
