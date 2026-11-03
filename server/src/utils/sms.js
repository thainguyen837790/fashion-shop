const axios = require('axios');

const sendSmsOtp = async (phone, otp) => {
  const token = process.env.SPEEDSMS_ACCESS_TOKEN;
  let cleanPhone = phone.replace(/[^0-9]/g, '');

  console.log(`\n📲 Đang gửi OTP [${otp}] tới số điện thoại: ${cleanPhone}...`);

  if (!token || token.includes('DÁN_API_ACCESS_TOKEN')) {
    console.log('⚠️ [CHƯA CẤU HÌNH TOKEN] OTP dự phòng:', otp);
    return true;
  }

  try {
    const response = await axios.post(
      'https://api.speedsms.vn/index.php/sms/send',
      {
        to: [cleanPhone],
        content: `[ThaiTrinh] Ma OTP xac thuc cua ban la: ${otp}. Hieu luc 5 phut.`,
        sms_type: 2, // Đổi sang 2: gửi bằng đầu số ngẫu nhiên (không bắt buộc sender)
        sender: '',  // Để trống sender
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${token}:x`).toString('base64'),
        },
      }
    );

    if (response.data?.status === 'success') {
      console.log(`✅ [SMS THẬT ĐÃ GỬI THÀNH CÔNG] tới số ${cleanPhone}!`);
      return true;
    } else {
      console.error('❌ SpeedSMS phản hồi lỗi:', response.data);
      console.log(`👉 MÃ OTP DỰ PHÒNG ĐỂ NHẬP TRÊN WEB: ${otp}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Lỗi kết nối gửi SMS:', error.response?.data || error.message);
    console.log(`👉 MÃ OTP DỰ PHÒNG ĐỂ NHẬP TRÊN WEB: ${otp}`);
    return false;
  }
};

module.exports = { sendSmsOtp };