import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  Share2, ChevronRight, ChevronLeft, Plus, Minus,
  Truck, RefreshCw, PhoneCall, MapPin, Search, Star,
  Wind, Droplets, Feather, ShoppingBag, Check, Send, User as UserIcon,
  X, Ruler, Calculator, Info
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/product/ProductCard';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';
import { getColorStyle, formatPrice } from '../../utils/colorHelper';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trạng thái biến thể & gallery
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [btnLoading, setBtnLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideHeight, setSizeGuideHeight] = useState('');
  const [sizeGuideWeight, setSizeGuideWeight] = useState('');
  const [recommendedSize, setRecommendedSize] = useState('');
  const [sizeGuideError, setSizeGuideError] = useState('');

  // Trạng thái danh sách đánh giá
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [searchReview, setSearchReview] = useState('');

  // Form nhập đánh giá của người dùng
  const [newRating, setNewRating] = useState(5);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const fetchProductReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const res = await api.get(`/reviews?product_id=${productId}`);
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setReviews(items);
    } catch (err) {
      console.error('Lỗi khi tải đánh giá sản phẩm:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Lấy chi tiết sản phẩm
        const res = await api.get(`/products/${slug}`);
        const data = res.data?.data || res.data?.product || res.data;
        if (!data) {
          setProduct(null);
          return;
        }
        setProduct(data);
        setActiveImgIndex(0);

        if (data.variants && data.variants.length > 0) {
          const first = data.variants[0];
          setSelectedColor(first.color);
          setSelectedSize(first.size);
        }

        // Tải đánh giá của sản phẩm
        fetchProductReviews(data.id);

        // 2. Lấy gợi ý sản phẩm
        const listRes = await api.get('/products');
        const items = Array.isArray(listRes.data)
          ? listRes.data
          : listRes.data?.items || listRes.data?.products || [];
        setRelatedProducts(items.filter((p) => p.slug !== slug));
      } catch (err) {
        console.error('Lỗi khi tải chi tiết:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (!showSizeGuide) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowSizeGuide(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSizeGuide]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api.get('/auth/profile')
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.height) setSizeGuideHeight((current) => current || String(data.height));
        if (data?.weight) setSizeGuideWeight((current) => current || String(data.weight));
      })
      .catch((error) => {
        console.warn('Không tải được số đo từ hồ sơ tài khoản:', error.response?.data?.error?.message || error.message);
      });
    return () => { cancelled = true; };
  }, [user]);

  // Lọc danh sách đánh giá theo số sao và từ khóa
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter > 0 && r.rating !== ratingFilter) return false;
      if (searchReview.trim()) {
        const kw = searchReview.toLowerCase().trim();
        const matchContent = (r.content || '').toLowerCase().includes(kw);
        const matchUser = (r.user?.full_name || '').toLowerCase().includes(kw);
        return matchContent || matchUser;
      }
      return true;
    });
  }, [reviews, ratingFilter, searchReview]);

  // Điểm đánh giá trung bình
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Submit đánh giá mới từ người dùng
  const handleSubmitProductReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newReviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn.');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        product_id: product.id,
        rating: newRating,
        content: newReviewContent.trim(),
      });
      setReviewSuccessMsg('Cảm ơn bạn đã gửi đánh giá cho sản phẩm!');
      setNewReviewContent('');
      setNewRating(5);
      setTimeout(() => setReviewSuccessMsg(''), 4500);
      fetchProductReviews(product.id);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
        <div className="lg:col-span-6 h-[540px] bg-gray-200 rounded-3xl"></div>
        <div className="lg:col-span-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy sản phẩm yêu cầu!</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-8 py-3 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition cursor-pointer"
        >
          QUAY LẠI TRANG CHỦ
        </button>
      </div>
    );
  }

  // Danh sách màu độc nhất
  const colors = Array.from(new Set((product.variants || []).map((v) => v.color).filter(Boolean)));
  const currentVariants = (product.variants || []).filter((v) => !selectedColor || v.color === selectedColor);

  // Lọc ảnh theo màu đang chọn
  const imagesByColor = (product.images || [])
    .filter((img) => !selectedColor || (img.color && img.color.toLowerCase() === selectedColor.toLowerCase()))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((img) => img.url);

  const images = imagesByColor.length > 0 
    ? imagesByColor 
    : (product.images && product.images.length > 0)
    ? product.images.map((i) => i.url)
    : [product.image_url || product.thumbnail || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'];

  const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  const sortedVariants = [...currentVariants].sort((a, b) => {
    const idxA = sizeOrder.indexOf(a.size);
    const idxB = sizeOrder.indexOf(b.size);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return (a.size || '').localeCompare(b.size || '');
  });

  const sizeGuideRows = Array.from(new Map(sortedVariants.map((variant) => [variant.size, variant])).values())
    .map((variant, index) => {
      const numericSize = Number.parseInt(variant.size, 10);
      if (Number.isFinite(numericSize) && /^\d+$/.test(String(variant.size))) {
        const offset = numericSize - 29;
        return {
          size: variant.size,
          weightMin: 48 + offset * 7,
          weightMax: 55 + offset * 7,
          heightMin: 155 + offset * 5,
          heightMax: 160 + offset * 5,
          shirtLength: 66 + offset,
          pantsLength: 102.5 + offset * 0.5,
          inStock: variant.stock > 0,
        };
      }

      const profiles = {
        XS: { weightMin: 40, weightMax: 48, heightMin: 148, heightMax: 158, shirtLength: 62, pantsLength: 94 },
        S: { weightMin: 45, weightMax: 55, heightMin: 155, heightMax: 165, shirtLength: 64, pantsLength: 96 },
        M: { weightMin: 55, weightMax: 65, heightMin: 160, heightMax: 170, shirtLength: 66, pantsLength: 98 },
        L: { weightMin: 65, weightMax: 75, heightMin: 165, heightMax: 175, shirtLength: 68, pantsLength: 100 },
        XL: { weightMin: 75, weightMax: 85, heightMin: 170, heightMax: 180, shirtLength: 70, pantsLength: 102 },
        '2XL': { weightMin: 85, weightMax: 95, heightMin: 175, heightMax: 185, shirtLength: 72, pantsLength: 104 },
        '3XL': { weightMin: 95, weightMax: 110, heightMin: 180, heightMax: 195, shirtLength: 74, pantsLength: 106 },
      };
      const profile = profiles[variant.size];
      return {
        size: variant.size,
        ...(profile || { weightMin: null, weightMax: null, heightMin: null, heightMax: null }),
        inStock: variant.stock > 0,
      };
    });

  const calculateRecommendedSize = () => {
    const heightValue = Number(sizeGuideHeight);
    const weightValue = Number(sizeGuideWeight);
    if (!heightValue || !weightValue || heightValue < 80 || heightValue > 250 || weightValue < 20 || weightValue > 300) {
      setRecommendedSize('');
      setSizeGuideError('Nhập chiều cao (80–250 cm) và cân nặng (20–300 kg) để tính size.');
      return;
    }

    const candidates = sizeGuideRows.filter((row) => row.inStock && row.weightMin != null && row.heightMin != null);
    if (candidates.length === 0) {
      setRecommendedSize('');
      setSizeGuideError('Sản phẩm hiện không có size còn hàng phù hợp để gợi ý.');
      return;
    }

    const distanceFromRange = (value, min, max) => value < min ? min - value : value > max ? value - max : 0;
    const bestMatch = candidates
      .map((row) => ({
        ...row,
        score: distanceFromRange(weightValue, row.weightMin, row.weightMax) / 10
          + distanceFromRange(heightValue, row.heightMin, row.heightMax) / 10,
      }))
      .sort((a, b) => a.score - b.score)[0];

    setRecommendedSize(bestMatch.size);
    setSizeGuideError('');
  };

  const selectedVariant = currentVariants.find((v) => v.size === selectedSize);
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const handleSelectColor = (colorName) => {
    setSelectedColor(colorName);
    setActiveImgIndex(0);
    setRecommendedSize('');
    setSizeGuideError('');
    const match = (product.variants || []).filter((v) => v.color === colorName);
    if (!match.some((m) => m.size === selectedSize)) {
      setSelectedSize(match[0]?.size || '');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert('Vui lòng chọn Kích thước');
      return;
    }
    if (isOutOfStock) {
      alert('Sản phẩm với size này đã hết hàng');
      return;
    }
    try {
      setBtnLoading(true);
      const res = await addToCart(selectedVariant.id, quantity, { product, variant: selectedVariant });
      if (res?.success) {
        setAlertMsg('Thêm vào giỏ hàng thành công!');
        setTimeout(() => setAlertMsg(''), 2500);
      } else if (res?.requiresAuth) {
        setShowLoginNotice(true);
      } else {
        alert(res?.message || 'Có lỗi khi thêm giỏ hàng');
      }
    } catch (err) {
      alert('Có lỗi khi thêm giỏ hàng');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      <LoginRequiredModal open={showLoginNotice} onClose={() => setShowLoginNotice(false)} productName={product.name} />
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            type="button"
            aria-label="Đóng hướng dẫn chọn size"
            onClick={() => setShowSizeGuide(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            className="relative flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-8">
              <div>
                <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  <Ruler className="h-3.5 w-3.5" /> Hỗ trợ chọn kích cỡ
                </p>
                <h2 id="size-guide-title" className="text-2xl font-black tracking-tight text-gray-950">Hướng dẫn chọn size</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                aria-label="Đóng"
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-black hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="rounded-2xl bg-gray-100 px-4 py-3 text-xs leading-5 text-gray-700">
                <span className="font-bold text-gray-950">Sản phẩm: </span>{product.name}
                <p className="mt-1 text-gray-500">Chọn size dựa trên chiều cao và cân nặng; nếu nằm giữa hai khoảng, bạn có thể chọn size lớn hơn để mặc thoải mái.</p>
              </div>

              <section aria-label="Tính size gợi ý">
                <div className="mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-700" />
                  <h3 className="text-sm font-black text-gray-950">Tìm size phù hợp với bạn</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-gray-600">
                    Chiều cao <span className="font-normal text-gray-400">(cm)</span>
                    <span className="relative mt-1.5 block">
                      <input
                        type="number"
                        min="80"
                        max="250"
                        value={sizeGuideHeight}
                        onChange={(event) => setSizeGuideHeight(event.target.value)}
                        placeholder="Ví dụ: 165"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-3 pr-10 text-sm font-bold text-gray-950 outline-none transition focus:border-black"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                    </span>
                  </label>
                  <label className="text-xs font-semibold text-gray-600">
                    Cân nặng <span className="font-normal text-gray-400">(kg)</span>
                    <span className="relative mt-1.5 block">
                      <input
                        type="number"
                        min="20"
                        max="300"
                        value={sizeGuideWeight}
                        onChange={(event) => setSizeGuideWeight(event.target.value)}
                        placeholder="Ví dụ: 58"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-3 pr-10 text-sm font-bold text-gray-950 outline-none transition focus:border-black"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kg</span>
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={calculateRecommendedSize}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-gray-800"
                >
                  Tính size <ChevronRight className="h-4 w-4" />
                </button>
                {sizeGuideError && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{sizeGuideError}</p>}
                {recommendedSize && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Size gợi ý</p>
                      <p className="mt-1 text-2xl font-black text-gray-950">{recommendedSize}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSize(recommendedSize);
                        setShowSizeGuide(false);
                      }}
                      className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
                    >
                      Chọn size này
                    </button>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-gray-950">Bảng size tham khảo</h3>
                </div>
                <p className="mb-3 flex items-start gap-1.5 text-[11px] leading-5 text-gray-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Chiều cao, cân nặng và chiều dài áo/quần là số đo tham khảo chung; thông số thực tế có thể khác theo thiết kế và chất liệu của từng sản phẩm.
                </p>
                {sizeGuideRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-950">
                          <th className="sticky left-0 z-10 min-w-32 border-b border-gray-200 bg-gray-50 px-3 py-3 font-black">Thông số</th>
                          {sizeGuideRows.map((row) => (
                            <th key={row.size} className={`min-w-20 border-b border-gray-200 px-4 py-3 text-center font-black ${recommendedSize === row.size ? 'text-emerald-700' : ''}`}>
                              {row.size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="odd:bg-white even:bg-gray-50">
                          <th className="sticky left-0 bg-inherit px-3 py-3 font-bold text-gray-700">Cân nặng (kg)</th>
                          {sizeGuideRows.map((row) => <td key={row.size} className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{row.weightMin == null ? '—' : `${row.weightMin}–${row.weightMax}`}</td>)}
                        </tr>
                        <tr className="odd:bg-white even:bg-gray-50">
                          <th className="sticky left-0 bg-inherit px-3 py-3 font-bold text-gray-700">Chiều cao (cm)</th>
                          {sizeGuideRows.map((row) => <td key={row.size} className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{row.heightMin == null ? '—' : `${row.heightMin}–${row.heightMax}`}</td>)}
                        </tr>
                        <tr className="odd:bg-white even:bg-gray-50">
                          <th className="sticky left-0 bg-inherit px-3 py-3 font-bold text-gray-700">Dài áo (cm)</th>
                          {sizeGuideRows.map((row) => <td key={row.size} className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{row.shirtLength == null ? '—' : row.shirtLength}</td>)}
                        </tr>
                        <tr className="odd:bg-white even:bg-gray-50">
                          <th className="sticky left-0 bg-inherit px-3 py-3 font-bold text-gray-700">Dài quần (cm)</th>
                          {sizeGuideRows.map((row) => <td key={row.size} className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{row.pantsLength == null ? '—' : row.pantsLength}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">Sản phẩm chưa có danh sách size để hiển thị bảng hướng dẫn.</p>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
      {/* 1. Breadcrumb nhỏ gọn */}
      <div className="max-w-[1180px] mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium overflow-x-auto">
        <Link to="/" className="hover:text-black">Trang chủ</Link>
        <span>/</span>
        <span className="hover:text-black">{product.category?.name || 'Sản phẩm'}</span>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* 2. CỤM ẢNH CỐ ĐỊNH + MUA HÀNG */}
      <div className="max-w-[1180px] mx-auto px-4 pt-2 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI (6/12): CỤM ẢNH */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 flex gap-3 h-[540px] select-none">
            <div className="w-[72px] h-full flex flex-col gap-2 overflow-y-auto pr-1 shrink-0 scrollbar-thin scrollbar-thumb-gray-200">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-[68px] h-[86px] rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImgIndex === idx
                      ? 'border-black ring-1 ring-black'
                      : 'border-transparent bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover object-center" />
                </button>
              ))}
            </div>

            <div className="relative flex-1 h-full bg-[#f3f4f6] rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
              <img
                src={images[activeImgIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-top transition-all duration-300"
              />

              {images.length > 1 && (
                <div className="absolute right-4 bottom-14 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-md flex items-center justify-center hover:bg-white transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-800" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-md flex items-center justify-center hover:bg-white transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-800" />
                  </button>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-[#2563eb] text-white py-2 px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-white text-[#2563eb] text-[10px] font-black px-1.5 py-0.5 rounded">NHẬP</span>
                  <span className="text-xs font-black tracking-wide">COOLNEW40K</span>
                </div>
                <span className="text-xs font-black uppercase tracking-tight">GIẢM 40K</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (6/12): THÔNG TIN SẢN PHẨM & MUA HÀNG */}
          <div className="lg:col-span-6 space-y-5 lg:pl-2">
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1.5">
                <span>Mã sản phẩm: <strong className="text-gray-700">{selectedVariant?.sku || 'TSZ598'}</strong></span>
                <button type="button" className="flex items-center gap-1 text-gray-500 hover:text-black font-medium cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-gray-600 font-semibold">{averageRating} ({reviews.length} đánh giá)</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">Đã bán 139</span>
              </div>
            </div>

            {/* Giá tiền */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-gray-950">
                {formatPrice(selectedVariant?.price || product.base_price || product.price || 0)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(Number(selectedVariant?.price || product.base_price || product.price || 0) * 1.25)}
              </span>
              <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                -20%
              </span>
            </div>

            {/* Voucher */}
            <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">VOUCHER</span>
                <span className="text-gray-800 font-semibold">Giảm 100K với mã <b>NEW100K</b></span>
              </div>
              <button type="button" className="text-blue-600 font-bold hover:underline text-[11px] cursor-pointer">Xem thêm &gt;</button>
            </div>

            {/* Freeship */}
            <div className="space-y-1.5 text-xs text-gray-600 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span><b>Freeship</b> toàn quốc cho mọi đơn hàng từ 200.000đ</span>
              </div>
            </div>

            {/* Màu sắc */}
            {colors.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-2">
                  Màu sắc: <b className="text-black">{selectedColor}</b>
                </span>
                <div className="flex items-center gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onClick={() => handleSelectColor(c)}
                      className={`w-8 h-8 rounded-full border-2 p-0.5 transition-all cursor-pointer ${
                        selectedColor.toLowerCase() === c.toLowerCase()
                          ? 'border-black scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-full block shadow-inner"
                        style={getColorStyle(c)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kích thước */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Kích thước: <b className="text-black">{selectedSize || 'Chưa chọn'}</b></span>
                <button
                  type="button"
                  onClick={() => {
                    setSizeGuideError('');
                    setShowSizeGuide(true);
                  }}
                  className="text-blue-600 underline cursor-pointer transition hover:text-blue-800"
                >
                  Hướng dẫn chọn size
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sortedVariants.map((v) => {
                  const outOfStock = v.stock <= 0;
                  const isCurrent = selectedSize === v.size;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => setSelectedSize(v.size)}
                      className={`relative w-12 h-10 rounded-xl text-xs font-extrabold transition-all border flex items-center justify-center cursor-pointer ${
                        outOfStock
                          ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed overflow-hidden'
                          : isCurrent
                          ? 'bg-black text-white border-black shadow'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-black'
                      }`}
                    >
                      <span className={outOfStock ? 'opacity-30' : ''}>{v.size}</span>
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-full border-t border-dashed border-gray-400 rotate-[-25deg]"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Số lượng + Thêm giỏ hàng */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex items-center border border-gray-200 rounded-xl h-12 px-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-xs text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={btnLoading || isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {btnLoading ? 'Đang thêm...' : isOutOfStock ? 'HẾT HÀNG' : 'Thêm vào giỏ'}
              </button>
            </div>

            {alertMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold py-2.5 px-4 rounded-xl">
                ✓ {alertMsg}
              </div>
            )}

            {/* 4 Cam kết */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-gray-100">
              <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-gray-800 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug text-gray-600">
                  <span className="font-bold text-gray-900 block">Free ship cho đơn từ 200k</span>
                </div>
              </div>

              <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex items-start gap-2.5">
                <RefreshCw className="w-4 h-4 text-gray-800 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug text-gray-600">
                  <span className="font-bold text-gray-900 block">60 ngày đổi trả miễn phí</span>
                </div>
              </div>

              <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex items-start gap-2.5">
                <PhoneCall className="w-4 h-4 text-gray-800 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug text-gray-600">
                  <span className="font-bold text-gray-900 block">Hotline 1900 8079</span>
                </div>
              </div>

              <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-800 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug text-gray-600">
                  <span className="font-bold text-gray-900 block">Đến tận nơi nhận hàng trả</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. KHỐI MÔ TẢ SẢN PHẨM */}
      <section className="bg-gray-50/70 border-y border-gray-100 py-16 mt-8">
        <div className="max-w-[1180px] mx-auto px-4">
          <h2 className="text-2xl font-black text-center text-gray-950 uppercase tracking-tight mb-12">
            MÔ TẢ SẢN PHẨM
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Nhanh khô</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                    <Wind className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Thoáng mát</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                    <Feather className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Siêu nhẹ</span>
                </div>
              </div>

              <div className="divide-y divide-gray-200 text-xs">
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">MÃ SẢN PHẨM</span>
                  <span className="font-bold text-gray-900">{selectedVariant?.sku || 'TSZ598'}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">CHẤT LIỆU</span>
                  <span className="font-bold text-gray-900 text-right">100% Sorona & Cool Feeling Polyester</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">KIỂU DÁNG</span>
                  <span className="font-bold text-gray-900 text-right">Regular Fit (Phom chuẩn tôn dáng)</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">PHÙ HỢP</span>
                  <span className="font-bold text-gray-900 text-right">Công sở, dạo phố, phong cách Smart Casual</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg aspect-video lg:aspect-[4/3] bg-gray-100">
              <img
                src={images[0]}
                alt="Lookbook"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. GỢI Ý SẢN PHẨM */}
      <section className="max-w-[1180px] mx-auto px-4 py-16">
        <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight mb-6">
          GỢI Ý SẢN PHẨM TƯƠNG TỰ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {relatedProducts.slice(0, 4).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. KHỐI ĐÁNH GIÁ SẢN PHẨM & FORM NHẬP ĐÁNH GIÁ CỦA NGƯỜI DÙNG ============ */}
      {/* ========================================================================= */}
      <section className="bg-gray-50/80 border-t border-gray-100 py-16">
        <div className="max-w-[1180px] mx-auto px-4 space-y-12">
          
          <div>
            <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight mb-2">
              ĐÁNH GIÁ SẢN PHẨM
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-gray-900 text-sm">{averageRating} / 5.0</span>
              <span>•</span>
              <span>Dựa trên {reviews.length} đánh giá thực tế từ khách hàng</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Bộ lọc đánh giá & thống kê */}
            <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">Tìm kiếm đánh giá</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchReview}
                    onChange={(e) => setSearchReview(e.target.value)}
                    placeholder="Tìm theo từ khóa (chất vải, form dáng...)"
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">Lọc theo số sao</label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setRatingFilter(0)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      ratingFilter === 0 ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>Tất cả đánh giá</span>
                    <span>({reviews.length})</span>
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                          ratingFilter === star ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{star} sao</span>
                          <div className="flex text-amber-400">
                            {[...Array(star)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <span className="text-[11px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>100% đánh giá xác thực từ người mua hàng</span>
              </div>
            </div>

            {/* Cột phải: Danh sách các đánh giá */}
            <div className="lg:col-span-8 space-y-4">
              {reviewsLoading ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-xs text-gray-500 animate-pulse">
                  Đang tải danh sách đánh giá...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-3">
                    <Star className="w-7 h-7 fill-amber-400" />
                  </div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    {reviews.length === 0
                      ? 'Chưa có đánh giá nào cho sản phẩm này'
                      : 'Không tìm thấy đánh giá phù hợp với bộ lọc'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    {reviews.length === 0
                      ? 'Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận về form dáng, chất liệu dưới phần form bên dưới!'
                      : 'Hãy thử chọn mức sao khác hoặc xóa từ khóa tìm kiếm.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredReviews.map((rev) => (
                    <div key={rev.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase">
                            {rev.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-950 block">
                              {rev.user?.full_name || 'Khách hàng ẩn danh'}
                            </span>
                            <div className="flex text-amber-400">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-gray-800 leading-relaxed pl-10">
                        {rev.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= FORM NHẬP ĐÁNH GIÁ CỦA NGƯỜI DÙNG ================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-5">
            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                VIẾT ĐÁNH GIÁ CỦA BẠN
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Chia sẻ ý kiến chân thật của bạn về chất liệu, độ bền và kích cỡ form dáng của sản phẩm này
              </p>
            </div>

            {reviewSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}

            {!user ? (
              <div className="p-6 bg-gray-50 rounded-2xl text-center space-y-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium">
                  Bạn cần đăng nhập tài khoản để có thể gửi đánh giá cho sản phẩm này.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProductReview} className="space-y-5 text-xs">
                {/* Chọn số sao */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-800 text-xs">
                    Mức độ hài lòng của bạn:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (newHoverRating || newRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setNewHoverRating(star)}
                          onMouseLeave={() => setNewHoverRating(0)}
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer transition hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </button>
                      );
                    })}
                    <span className="text-xs font-extrabold text-amber-600 ml-2">
                      {newRating === 5 && 'Tuyệt vời (5 sao)'}
                      {newRating === 4 && 'Hài lòng (4 sao)'}
                      {newRating === 3 && 'Bình thường (3 sao)'}
                      {newRating === 2 && 'Không hài lòng (2 sao)'}
                      {newRating === 1 && 'Rất tệ (1 sao)'}
                    </span>
                  </div>
                </div>

                {/* Nhập nội dung */}
                <div>
                  <label className="block font-bold text-gray-800 text-xs mb-1.5">
                    Nội dung nhận xét chi tiết:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newReviewContent}
                    onChange={(e) => setNewReviewContent(e.target.value)}
                    placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn khi mặc, chất vải có thoáng mát, form dáng có chuẩn, đường may có chắc chắn không..."
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400">
                    Đăng nhận xét dưới tên: <strong className="text-gray-700">{user.full_name || user.email}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-full transition shadow-md flex items-center gap-2 cursor-pointer disabled:bg-gray-400 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingReview ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
