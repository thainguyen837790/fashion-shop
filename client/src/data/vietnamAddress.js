// Khu vực giao hàng được giới hạn theo yêu cầu: TP.HCM mới và 5 tỉnh/thành
// vùng Đồng bằng sông Cửu Long sau sắp xếp đơn vị hành chính năm 2025.
export const VIETNAM_PROVINCES = [
  'Thành phố Hồ Chí Minh',
  'An Giang',
  'Thành phố Cần Thơ',
  'Đồng Tháp',
  'Vĩnh Long',
  'Cà Mau',
];

const provinceAliases = new Map([
  ['thành phố hồ chí minh', 'Thành phố Hồ Chí Minh'],
  ['tp. hồ chí minh', 'Thành phố Hồ Chí Minh'],
  ['tp hồ chí minh', 'Thành phố Hồ Chí Minh'],
  ['hồ chí minh', 'Thành phố Hồ Chí Minh'],
  ['bình dương', 'Thành phố Hồ Chí Minh'],
  ['bà rịa - vũng tàu', 'Thành phố Hồ Chí Minh'],
  ['bà rịa-vũng tàu', 'Thành phố Hồ Chí Minh'],
  ['bà rịa vũng tàu', 'Thành phố Hồ Chí Minh'],
  ['an giang', 'An Giang'],
  ['kiên giang', 'An Giang'],
  ['thành phố cần thơ', 'Thành phố Cần Thơ'],
  ['cần thơ', 'Thành phố Cần Thơ'],
  ['hậu giang', 'Thành phố Cần Thơ'],
  ['sóc trăng', 'Thành phố Cần Thơ'],
  ['đồng tháp', 'Đồng Tháp'],
  ['tiền giang', 'Đồng Tháp'],
  ['vĩnh long', 'Vĩnh Long'],
  ['bến tre', 'Vĩnh Long'],
  ['trà vinh', 'Vĩnh Long'],
  ['cà mau', 'Cà Mau'],
  ['bạc liêu', 'Cà Mau'],
]);

export function normalizeSouthernProvince(province = '') {
  const normalized = province.trim().toLocaleLowerCase('vi-VN');
  return provinceAliases.get(normalized)
    || VIETNAM_PROVINCES.find((name) => name.toLocaleLowerCase('vi-VN') === normalized)
    || '';
}
