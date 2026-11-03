import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getColorStyle, formatPrice } from '../../utils/colorHelper';
import LoginRequiredModal from '../common/LoginRequiredModal';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');

  if (!product) return null;

  // 1. Danh sách màu sắc thực tế từ variants
  const availableColors = Array.from(
    new Set((product.variants || []).map((v) => v.color).filter(Boolean))
  );

  // Màu đang hoạt động (nếu người dùng chưa chọn, lấy màu đầu tiên)
  const activeColor = selectedColor || availableColors[0] || '';

  // 2. Lọc variants theo màu đang được chọn
  const filteredByColor = (product.variants || []).filter((v) => {
    if (!activeColor) return true;
    return v.color && v.color.toLowerCase().trim() === activeColor.toLowerCase().trim();
  });

  // Khử trùng lặp theo Size để mỗi size (S, M, L, XL, 2XL...) chỉ xuất hiện duy nhất 1 lần
  const uniqueSizeMap = new Map();
  filteredByColor.forEach((v) => {
    const sizeKey = (v.size || '').toUpperCase().trim();
    if (sizeKey && !uniqueSizeMap.has(sizeKey)) {
      uniqueSizeMap.set(sizeKey, v);
    }
  });

  // Nếu lọc theo màu không có variant nào, fallback lấy theo unique size của toàn bộ variants
  if (uniqueSizeMap.size === 0) {
    (product.variants || []).forEach((v) => {
      const sizeKey = (v.size || '').toUpperCase().trim();
      if (sizeKey && !uniqueSizeMap.has(sizeKey)) {
        uniqueSizeMap.set(sizeKey, v);
      }
    });
  }

  const availableVariants = Array.from(uniqueSizeMap.values());

  // 3. Sắp xếp size theo thứ tự chuẩn thời trang
  const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'];
  const sortedVariants = [...availableVariants].sort((a, b) => {
    const idxA = sizeOrder.indexOf(a.size?.toUpperCase()?.trim());
    const idxB = sizeOrder.indexOf(b.size?.toUpperCase()?.trim());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return (a.size || '').localeCompare(b.size || '');
  });

  // 4. Giá sản phẩm (ưu tiên biến thể màu đang chọn nếu có, tự chuẩn hóa 449 -> 449.000đ)
  const activeVariant = filteredByColor?.[0] || product.variants?.[0];
  const rawPrice = Number(activeVariant?.price ?? product.base_price ?? product.price ?? 0);
  const normalizedPrice = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 1000 : rawPrice;
  const formattedPrice = formatPrice(normalizedPrice);

  // 5. Tự động đổi ảnh tương ứng với màu đang chọn
  const matchedColorImage = (product.images || []).find(
    (img) => img.color && activeColor && img.color.toLowerCase().trim() === activeColor.toLowerCase().trim()
  );

  const primaryImage =
    matchedColorImage?.url ||
    (product.images && product.images[0]?.url) ||
    product.image_url ||
    product.thumbnail ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

  // Ảnh phụ hiển thị khi hover (mặt sau / góc chụp thứ 2)
  const hoverImage =
    (product.images && product.images[1]?.url) || primaryImage;

  // Xử lý thêm nhanh vào giỏ hàng
  const handleQuickAdd = async (e, variant) => {
    e.preventDefault();
    e.stopPropagation();

    if (!variant || variant.stock <= 0 || adding) return;

    try {
      setAdding(true);
      const res = await addToCart(variant.id, 1, { product, variant });
      if (res?.success) {
        setSuccessMsg(`Đã thêm size ${variant.size}!`);
        setTimeout(() => setSuccessMsg(''), 1500);
      } else if (res?.requiresAuth) {
        setShowLoginNotice(true);
      } else {
        alert(res?.message || 'Không thể thêm vào giỏ hàng');
      }
    } catch {
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white select-none">
      <LoginRequiredModal open={showLoginNotice} onClose={() => setShowLoginNotice(false)} productName={product.name} />
      {/* Khung ảnh sản phẩm (tỉ lệ 3:4) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100">
        <Link to={`/products/${product.slug || product.id}`} className="block w-full h-full relative">
          <img
            src={primaryImage}
            alt={product.name || 'Sản phẩm'}
            className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
          />
          {/* Hiệu ứng lật sang ảnh góc thứ 2 khi hover */}
          {hoverImage !== primaryImage && (
            <img
              src={hoverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Thông báo thêm thành công */}
        {successMsg && (
          <div className="absolute top-3 inset-x-3 z-20 bg-black/85 text-white text-xs font-semibold text-center py-2 rounded-xl backdrop-blur-sm shadow-md animate-in fade-in">
            ✓ {successMsg}
          </div>
        )}

        {/* BẢNG THÊM NHANH VÀO GIỎ HÀNG (Hover hiển thị chuẩn Coolmate) */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-xl flex flex-col gap-2 max-h-[85%] overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 px-1">
              <span className="truncate">Thêm nhanh vào giỏ hàng</span>
              <Plus className="w-4 h-4 text-gray-700 stroke-[2.5] shrink-0" />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {sortedVariants.length > 0 ? (
                sortedVariants.map((v) => {
                  const isOutOfStock = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock || adding}
                      onClick={(e) => handleQuickAdd(e, v)}
                      className={`relative h-10 rounded-xl text-xs font-bold tracking-tight transition-all duration-150 flex items-center justify-center border shadow-xs ${
                        isOutOfStock
                          ? 'bg-gray-100/70 text-gray-300 border-gray-200/60 cursor-not-allowed overflow-hidden'
                          : adding
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-white text-gray-900 border-gray-200 hover:bg-black hover:text-white hover:border-black active:scale-95'
                      }`}
                    >
                      <span className={isOutOfStock ? 'opacity-40' : ''}>
                        {v.size}
                      </span>

                      {isOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-full border-t border-dashed border-gray-400 rotate-[-25deg] transform"></span>
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-3 text-center text-[11px] text-gray-500 py-1 font-semibold">
                  Hết hàng
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin sản phẩm bên dưới */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        {/* Nút chọn màu sắc (Color Swatches) */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {availableColors.map((color) => {
              const isActive = activeColor.toLowerCase().trim() === color.toLowerCase().trim();
              const colorStyle = getColorStyle(color);

              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'ring-2 ring-black ring-offset-2 scale-105'
                      : 'ring-1 ring-gray-200 hover:scale-105'
                  }`}
                >
                  <span
                    className="w-full h-full rounded-full border border-black/10"
                    style={colorStyle}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Tên sản phẩm */}
        <Link to={`/products/${product.slug || product.id}`} className="group-hover:text-blue-600 transition">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Giá sản phẩm */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-gray-950">
            {formattedPrice}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(normalizedPrice * 1.25)}
          </span>
        </div>
      </div>
    </div>
  );
}
