import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { parseRawPrice } from '../utils/colorHelper';

const CartContext = createContext();

export const AVAILABLE_VOUCHERS = [
  {
    code: 'NEW80K',
    title: 'Khách hàng mới',
    discount: 80000,
    minOrder: 299000,
    description: '[Khách hàng mới] Giảm 80K đơn đầu tiên từ 299K (không áp dụng Outlet)',
    expiry: '31/10/2026',
    count: 1,
  },
  {
    code: 'WELCOMENGCQSA',
    title: 'Giảm 15%',
    percent: 15,
    maxDiscount: 50000,
    minOrder: 0,
    description: 'Giảm 15% tối đa 50K cho đơn bất kỳ (Không áp dụng cho danh mục SALE)',
    expiry: '16/11/2026',
    count: 1,
  },
  {
    code: 'FREESHIP',
    title: 'Miễn phí vận chuyển',
    isFreeship: true,
    minOrder: 0,
    description: 'Miễn phí vận chuyển cho mọi đơn hàng',
    expiry: '31/12/2026',
    count: 3,
  },
];

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_amount: 0, total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(AVAILABLE_VOUCHERS[0]); // Mặc định áp dụng NEW80K như trong ảnh
  const [useCoolCash, setUseCoolCash] = useState(false);

  // 1. Tải giỏ hàng từ server (nếu đã đăng nhập) hoặc từ localStorage (nếu là khách)
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (user && token) {
      try {
        setLoading(true);
        localStorage.removeItem('guest_cart');

        const res = await api.get('/cart');
        const serverCart = res.data || { items: [], total_amount: 0, total_count: 0 };
        setCart(serverCart);

        // Mặc định chọn tất cả sản phẩm
        setSelectedItemIds((prev) => {
          const validIds = (serverCart.items || []).map((it) => it.id);
          // Giữ lại các ID đang chọn còn tồn tại, nếu chưa có thì chọn tất cả
          const remaining = prev.filter((id) => validIds.includes(id));
          return remaining.length > 0 ? remaining : validIds;
        });
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('Lỗi fetchCart:', err);
        }
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.removeItem('guest_cart');
      setCart({ items: [], total_amount: 0, total_count: 0 });
      setSelectedItemIds([]);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Cập nhật selectedItemIds khi cart.items thay đổi
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      setSelectedItemIds((prev) => {
        const itemIds = cart.items.map((i) => i.id);
        if (prev.length === 0) return itemIds;
        const filtered = prev.filter((id) => itemIds.includes(id));
        return filtered.length > 0 ? filtered : itemIds;
      });
    } else {
      setSelectedItemIds([]);
    }
  }, [cart.items]);

  // 2. Thêm vào giỏ hàng
  const addToCart = async (variantId, quantity = 1) => {
    const token = localStorage.getItem('token');

    if (!user || !token) {
      localStorage.removeItem('guest_cart');
      return { success: false, requiresAuth: true, message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.' };
    }

    try {
      await api.post('/cart/items', { variantId, quantity });
      await fetchCart();
      setIsDrawerOpen(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error?.message || 'Không thể thêm vào giỏ hàng',
      };
    }
  };

  // 3. Cập nhật số lượng
  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }

    const token = localStorage.getItem('token');
    if (user && token && typeof itemId === 'number') {
      try {
        await api.put(`/cart/items/${itemId}`, { quantity });
        await fetchCart();
      } catch (err) {
        alert(err.response?.data?.error?.message || 'Lỗi cập nhật');
      }
    } else {
      localStorage.removeItem('guest_cart');
      setCart({ items: [], total_amount: 0, total_count: 0 });
    }
  };

  // 4. Xóa món hàng
  const removeItem = async (itemId) => {
    const token = localStorage.getItem('token');
    if (user && token && typeof itemId === 'number') {
      try {
        await api.delete(`/cart/items/${itemId}`);
        await fetchCart();
      } catch (err) {
        alert('Không thể xóa món hàng');
      }
    } else {
      localStorage.removeItem('guest_cart');
      setCart({ items: [], total_amount: 0, total_count: 0 });
      setSelectedItemIds([]);
    }
  };

  // 5. Xóa tất cả món hàng
  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (user && token) {
      try {
        await api.delete('/cart');
        await fetchCart();
      } catch (err) {
        console.error('Lỗi clearCart:', err);
      }
    } else {
      localStorage.removeItem('guest_cart');
      setCart({ items: [], total_amount: 0, total_count: 0 });
      setSelectedItemIds([]);
    }
  };

  // 6. Thay đổi phân loại (Màu / Size)
  const changeVariant = async (itemId, newVariantId, newVariantInfo = null) => {
    const token = localStorage.getItem('token');
    if (user && token && typeof itemId === 'number') {
      try {
        await api.put(`/cart/items/${itemId}/variant`, { variantId: newVariantId });
        await fetchCart();
      } catch (err) {
        console.error('Lỗi changeVariant:', err);
      }
    } else {
      localStorage.removeItem('guest_cart');
      setCart({ items: [], total_amount: 0, total_count: 0 });
    }
  };

  // 7. Checkbox chọn từng sản phẩm & chọn tất cả
  const toggleSelectItem = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = (select) => {
    if (select) {
      setSelectedItemIds((cart.items || []).map((item) => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const isAllSelected = useMemo(() => {
    if (!cart.items || cart.items.length === 0) return false;
    return cart.items.length === selectedItemIds.length;
  }, [cart.items, selectedItemIds]);

  // 8. Quản lý Mã giảm giá (Vouchers)
  const applyVoucher = (code) => {
    const found = AVAILABLE_VOUCHERS.find(
      (v) => v.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (!found) {
      return { success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' };
    }
    setAppliedVoucher(found);
    return { success: true, message: `Áp dụng thành công mã ${found.code}!` };
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  // 9. Tính toán tài chính chi tiết
  const selectedItems = useMemo(() => {
    return (cart.items || []).filter((item) => selectedItemIds.includes(item.id));
  }, [cart.items, selectedItemIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + parseRawPrice(item.price) * (item.quantity || 1), 0);
  }, [selectedItems]);

  const originalSubtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) =>
        sum + parseRawPrice(item.original_price || Math.round(parseRawPrice(item.price) * 1.25 / 1000) * 1000) * (item.quantity || 1),
      0
    );
  }, [selectedItems]);

  // Phí ship: Freeship từ 200k hoặc nếu có voucher freeship
  const shippingFee = useMemo(() => {
    if (selectedSubtotal === 0) return 0;
    if (selectedSubtotal >= 200000 || appliedVoucher?.isFreeship) return 0;
    return 30000;
  }, [selectedSubtotal, appliedVoucher]);

  // Giảm giá từ Voucher
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher || selectedSubtotal === 0) return 0;
    if (appliedVoucher.minOrder && selectedSubtotal < appliedVoucher.minOrder) return 0;

    if (appliedVoucher.discount) {
      return Math.min(appliedVoucher.discount, selectedSubtotal);
    }
    if (appliedVoucher.percent) {
      const discount = Math.round((selectedSubtotal * appliedVoucher.percent) / 100);
      return appliedVoucher.maxDiscount ? Math.min(discount, appliedVoucher.maxDiscount) : discount;
    }
    return 0;
  }, [appliedVoucher, selectedSubtotal]);

  // CoolCash balance (từ profile user)
  const coolCashBalance = Number(user?.thai_cash || 50000);

  // CoolCash được sử dụng
  const coolCashDeduction = useMemo(() => {
    if (!useCoolCash || selectedSubtotal === 0) return 0;
    const remainingAfterVoucher = Math.max(0, selectedSubtotal - voucherDiscount);
    return Math.min(coolCashBalance, remainingAfterVoucher);
  }, [useCoolCash, coolCashBalance, selectedSubtotal, voucherDiscount]);

  // Tổng thanh toán cuối cùng
  const finalTotal = useMemo(() => {
    if (selectedSubtotal === 0) return 0;
    return Math.max(0, selectedSubtotal - voucherDiscount - coolCashDeduction + shippingFee);
  }, [selectedSubtotal, voucherDiscount, coolCashDeduction, shippingFee]);

  // Tiết kiệm được
  const totalSavings = useMemo(() => {
    const rawSavings = originalSubtotal - selectedSubtotal;
    return Math.max(0, rawSavings) + voucherDiscount + coolCashDeduction;
  }, [originalSubtotal, selectedSubtotal, voucherDiscount, coolCashDeduction]);

  // Hoàn tiền CoolCash tích lũy nhận được (1% đơn hàng, tối thiểu 7.000đ khi có đơn)
  const cashBackReward = useMemo(() => {
    if (finalTotal === 0) return 0;
    const calculated = Math.round((finalTotal * 0.01) / 1000) * 1000;
    return Math.max(7000, calculated);
  }, [finalTotal]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isDrawerOpen,
        setIsDrawerOpen,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        changeVariant,
        selectedItemIds,
        toggleSelectItem,
        selectAllItems,
        isAllSelected,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
