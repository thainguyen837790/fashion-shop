const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async ({ email, password, full_name, phone }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email đã được sử dụng');
    error.status = 400;
    error.code = 'EMAIL_EXISTS';
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);

  // Tạo tài khoản đồng thời khởi tạo giỏ hàng rỗng
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name,
      phone,
      role: 'customer',
      cart: { create: {} }
    },
    select: { id: true, email: true, full_name: true, phone: true, role: true, created_at: true }
  });

  return user;
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.is_active) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  };
};

module.exports = { register, login };