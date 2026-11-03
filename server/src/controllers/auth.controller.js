const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../db/prisma');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'fashion-shop-secret');
  if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');
  return jwt.sign(
    {
      id: user.id,
      userId: user.id, // Lưu cả 2 key để tương thích mọi middleware
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    secret,
    { expiresIn: '7d' }
  );
};

const issueOAuthSession = async ({ email, full_name }) => {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const password_hash = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 10);
    user = await prisma.user.create({ data: { email, full_name, password_hash } });
  }
  return {
    token: signToken(user),
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
  };
};

const loginWithGoogle = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: { message: 'Đăng nhập Google chưa được cấu hình trên máy chủ.' } });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: { message: 'Thiếu Google credential.' } });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) {
      return res.status(401).json({ error: { message: 'Google chưa xác minh địa chỉ email này.' } });
    }
    const session = await issueOAuthSession({ email: profile.email.toLowerCase(), full_name: profile.name || profile.email.split('@')[0] });
    return res.json(session);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    return res.status(401).json({ error: { message: 'Không thể xác thực tài khoản Google. Vui lòng thử lại.' } });
  }
};

const loginWithFacebook = async (req, res) => {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const { accessToken } = req.body;
    if (!appId || !appSecret) {
      return res.status(503).json({ error: { message: 'Đăng nhập Facebook chưa được cấu hình trên máy chủ.' } });
    }
    if (!accessToken) return res.status(400).json({ error: { message: 'Thiếu Facebook access token.' } });

    const appToken = `${appId}|${appSecret}`;
    const { data: debug } = await axios.get('https://graph.facebook.com/debug_token', {
      params: { input_token: accessToken, access_token: appToken },
      timeout: 10000,
    });
    if (!debug.data?.is_valid || String(debug.data.app_id) !== String(appId)) {
      return res.status(401).json({ error: { message: 'Phiên đăng nhập Facebook không hợp lệ.' } });
    }
    const { data: profile } = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,email', access_token: accessToken }, timeout: 10000,
    });
    if (String(profile.id) !== String(debug.data.user_id) || !profile.email) {
      return res.status(401).json({ error: { message: 'Facebook không cung cấp email cho tài khoản này. Hãy dùng email hoặc Google.' } });
    }
    const session = await issueOAuthSession({ email: profile.email.toLowerCase(), full_name: profile.name || profile.email.split('@')[0] });
    return res.json(session);
  } catch (err) {
    console.error('Facebook OAuth error:', err.response?.data || err.message);
    return res.status(401).json({ error: { message: 'Không thể xác thực tài khoản Facebook. Vui lòng thử lại.' } });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, full_name, phone = '' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: { message: 'Thiếu email, password hoặc full_name' } });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { message: 'Email đã tồn tại' } });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name,
        phone,
      },
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Thiếu email hoặc password' } });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: { message: 'Email hoặc mật khẩu không đúng' } });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Email hoặc mật khẩu không đúng' } });
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, full_name: true, phone: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'Không tìm thấy người dùng' } });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};

// Lấy thông tin user hiện tại
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        gender: true,
        birthday: true,
        height: true,
        weight: true,
        thai_cash: true,
        role: true,
      },
    });
    if (!user) return res.status(404).json({ error: { message: 'Không tìm thấy người dùng' } });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// Cập nhật thông tin tài khoản
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { full_name, phone, gender, birthday, height, weight } = req.body;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name,
        phone,
        gender,
        birthday,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        gender: true,
        birthday: true,
        height: true,
        weight: true,
        thai_cash: true,
        role: true,
      },
    });

    res.status(200).json({ message: 'Cập nhật thành công', user: updated });
  } catch (err) {
    res.status(500).json({ error: { message: 'Không thể cập nhật hồ sơ' } });
  }
};

// Đổi mật khẩu tài khoản
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { current_password, new_password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: { message: 'Người dùng không tồn tại' } });

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: { message: 'Mật khẩu hiện tại không đúng' } });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' } });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Lỗi cập nhật mật khẩu' } });
  }
};

// Xóa tài khoản (Nâng cao)
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await prisma.cart.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: 'Đã xóa tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Không thể xóa tài khoản.' } });
  }
};

// Xuất đầy đủ tất cả các hàm trong 1 object duy nhất
module.exports = {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  getCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
