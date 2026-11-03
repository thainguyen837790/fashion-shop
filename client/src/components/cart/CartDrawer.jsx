import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice, parseRawPrice } from '../../utils/colorHelper';

export default function CartDrawer() {
  const { cart, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const items = cart?.items || [];

  // Hàm trích xuất giá an toàn từ mọi cấu trúc dữ liệu cartItem
  const getItemPrice = (item) => {
    const raw =
      item.variant?.price ??
      item.price ??
      item.variant?.product?.base_price ??
      item.product?.base_price ??
      0;
    return parseRawPrice(raw);
  };

  // Tính lại tổng tiền chính xác 100% từ các món trong giỏ
  const totalAmount = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * (item.quantity || 1);
  }, 0);

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const isFreeShip = totalAmount >= 200000;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-900" />
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                GIỎ HÀNG CỦA BẠN ({totalCount})
              </h2>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Freeship */}
          <div className="bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900 flex items-center justify-between border-b border-blue-100">
            {isFreeShip ? (
              <span className="font-semibold text-emerald-700">✓ Đơn hàng của bạn đã được MIỄN PHÍ VẬN CHUYỂN!</span>
            ) : (
              <span>
                Mua thêm <strong className="text-blue-700">{formatPrice(200000 - totalAmount)}</strong> để được <strong>Freeship</strong>
              </span>
            )}
          </div>

          {/* Danh sách sản phẩm */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-100">
            {items.length > 0 ? (
              items.map((item) => {
                const itemPrice = getItemPrice(item);
                const itemQty = item.quantity || 1;
                const itemImg =
                  item.variant?.product?.images?.[0]?.url ||
                  item.image_url ||
                  item.image ||
                  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
                const itemName =
                  item.variant?.product?.name || item.product_name || item.name || 'Sản phẩm thời trang';
                const itemColor = item.variant?.color || item.color || 'Tiêu chuẩn';
                const itemSize = item.variant?.size || item.size || 'Freesize';

                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                    <img
                      src={itemImg}
                      alt={itemName}
                      className="w-20 h-24 object-cover rounded-xl border border-gray-100 bg-gray-50 shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">
                            {itemName}
                          </h4>
                          <button
                            onClick={() => removeItem && removeItem(item.id)}
                            className="text-gray-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-1.5 text-[11px] text-gray-600 font-medium mt-1.5">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md">{itemColor}</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md">Size {itemSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg h-7">
                          <button
                            onClick={() => updateQuantity && updateQuantity(item.id, Math.max(1, itemQty - 1))}
                            className="w-6 h-full flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-800">
                            {itemQty}
                          </span>
                          <button
                            onClick={() => updateQuantity && updateQuantity(item.id, itemQty + 1)}
                            className="w-6 h-full flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Đơn giá chính xác */}
                        <span className="text-xs font-extrabold text-gray-950">
                          {formatPrice(itemPrice * itemQty)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Giỏ hàng của bạn đang trống</p>
                <p className="text-[11px] text-gray-400 mt-1">Hãy chọn sản phẩm bạn yêu thích nhé</p>
              </div>
            )}
          </div>

          {/* Footer Tổng tiền */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-bold text-gray-500">Tạm tính:</span>
                <span className="text-base font-black text-gray-950">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                * Có thể áp dụng mã giảm giá ở bước tiếp theo
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/cart');
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition shadow-lg active:scale-98 cursor-pointer tracking-wider"
              >
                <span>XEM GIỎ HÀNG & ĐẶT HÀNG</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}