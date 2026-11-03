// client/src/utils/colorHelper.js
// Bộ giải mã và chuẩn hóa màu sắc toàn diện cho Coolmate Fashion Shop

export const COLOR_MAP = {
  // Màu tối & Đen
  'đen tuyền': '#09090b',
  'đen': '#18181b',
  'xám đen': '#334155',
  'than chì': '#374151',
  'than': '#374151',
  'xanh bóng đêm': '#090d16',

  // Trắng & Sáng
  'trắng kem': '#f5f2eb',
  'trắng ngà': '#fefce8',
  'trắng tinh': '#ffffff',
  'trắng': '#ffffff',
  'kem': '#f5f2eb',

  // Xám & Ghi
  'xám tiêu': '#94a3b8',
  'xám nhạt': '#cbd5e1',
  'xám đậm': '#475569',
  'xám khói': '#64748b',
  'xám castlerock': '#475569',
  'ghi nhạt': '#cbd5e1',
  'ghi đậm': '#475569',
  'ghi': '#64748b',
  'xám': '#64748b',

  // Xanh lá & Rêu (Chuẩn màu quân nhu / thời trang rêu thực tế, không bị đen ngòm)
  'xanh rêu': '#556b2f',
  'rêu': '#556b2f',
  'rêu lính': '#4d5d36',
  'xanh bộ đội': '#4d5d36',
  'xanh lính': '#4d5d36',
  'xanh olive': '#556b2f',
  'olive': '#556b2f',
  'xanh lá': '#16a34a',
  'xanh lục': '#15803d',
  'xanh mint': '#86efac',
  'mint': '#86efac',
  'xanh laurel': '#78909c',
  'xanh bơ': '#84cc16',
  'bơ': '#84cc16',
  'xanh cốm': '#84cc16',
  'cốm': '#84cc16',

  // Xanh ngọc
  'xanh ngọc': '#0d9488',
  'ngọc bích': '#0f766e',

  // Xanh dương & Navy
  'xanh navy': '#0f172a',
  'navy': '#0f172a',
  'xanh đen': '#0f172a',
  'xanh dương': '#1d4ed8',
  'xanh biển': '#0284c7',
  'xanh aqua': '#38bdf8',
  'aqua': '#38bdf8',
  'xanh coban': '#1d4ed8',
  'cobalt': '#1e40af',
  'xanh pastel': '#93c5fd',
  'xanh da trời': '#38bdf8',
  'da trời': '#38bdf8',
  'xanh nhạt': '#bfdbfe',
  'xanh': '#2563eb', // Generic fallback xanh dương

  // Be & Nâu
  'be xám': '#d6d3d1',
  'be trench coat': '#d4b996',
  'be nhạt': '#ede8d0',
  'be': '#d4b996',
  'cát': '#d4b996',
  'nâu đậm': '#451a03',
  'nâu tây': '#854d0e',
  'nâu ganache': '#451a03',
  'nâu coffee': '#5c3a21',
  'nâu': '#78350f',
  'cà phê': '#5c3a21',
  'bò': '#a16207',
  'da bò': '#a16207',

  // Tím & Hồng
  'tím - đen': '#581c87',
  'tím than': '#3b0764',
  'tím pastel': '#c084fc',
  'lavender': '#a78bfa',
  'tím': '#7c3aed',
  'hồng nhạt': '#fbcfe8',
  'hồng pastel': '#f472b6',
  'hồng phấn': '#fbcfe8',
  'hồng cánh sen': '#db2777',
  'hồng': '#ec4899',

  // Nóng: Đỏ, Cam, Vàng
  'đỏ đô': '#881337',
  'đỏ rượu': '#9f1239',
  'đỏ mận': '#881337',
  'đỏ tươi': '#ef4444',
  'đỏ': '#dc2626',
  'cam đất': '#c2410c',
  'cam cháy': '#c2410c',
  'cam': '#ea580c',
  'vàng nghệ': '#ca8a04',
  'vàng mù tạt': '#ca8a04',
  'vàng chanh': '#facc15',
  'vàng': '#eab308',
};

// Lấy style CSS hoàn chỉnh cho màu sắc (Hỗ trợ cả đơn sắc, Gradient đa màu, Caro)
export const getColorStyle = (colorName, customHex = null) => {
  if (customHex && customHex.startsWith('#')) {
    return { backgroundColor: customHex };
  }

  if (!colorName) return { backgroundColor: '#18181b' };

  const name = String(colorName).toLowerCase().trim();

  // Nhận diện combo nhiều màu / ngẫu nhiên / mix
  if (
    name.includes('combo') ||
    name.includes('set') ||
    name.includes('mix') ||
    name.includes('ngẫu nhiên') ||
    name.includes('/') ||
    name.includes('+')
  ) {
    return {
      background: 'linear-gradient(135deg, #18181b 33%, #556b2f 33% 66%, #0f172a 66%)',
    };
  }

  // Nhận diện họa tiết Kẻ Caro
  if (name.includes('caro')) {
    return {
      background: 'repeating-linear-gradient(45deg, #374151, #374151 5px, #f3f4f6 5px, #f3f4f6 10px)',
    };
  }

  // SẮP XẾP TỪ KHÓA THEO ĐỘ DÀI GIẢM DẦN ĐỂ KHÔNG BỊ TRÙNG TỪ ĐƠN LẺ
  // Ví dụ: 'xanh rêu' dài 8 ký tự sẽ được kiểm tra TRƯỚC 'xanh' (4 ký tự)
  const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((k) => name.includes(k));

  return { backgroundColor: matchedKey ? COLOR_MAP[matchedKey] : '#556b2f' };
};

// Lấy mã Hex đơn giản (dùng cho color picker hoặc title)
export const getColorHex = (colorName, fallback = '#556b2f') => {
  if (!colorName) return fallback;
  const name = String(colorName).toLowerCase().trim();

  const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((k) => name.includes(k));
  return matchedKey ? COLOR_MAP[matchedKey] : fallback;
};

// Format giá tiền: Tự động nhân 1000 nếu nhập giá rút gọn (VD: 449 -> 449.000đ)
/**
 * Chuyển đổi số thành tiền VNĐ chuẩn xác
 */
export function formatPrice(rawPrice) {
  let val = Math.round(Number(rawPrice) || 0);

  // Fallback an toàn nếu backend trả về số tắt (< 1000)
  if (val > 0 && val < 1000) {
    val = val * 1000;
  }

  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

/**
 * Lấy giá trị số thực tế để tính toán cộng trừ
 */
export function parseRawPrice(rawPrice) {
  let val = Math.round(Number(rawPrice) || 0);
  if (val > 0 && val < 1000) {
    val = val * 1000;
  }
  return val;
}
