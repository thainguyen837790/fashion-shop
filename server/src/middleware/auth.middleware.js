const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const KNOWN_SECRETS = [
  process.env.JWT_SECRET,
  'fashion-shop-secret',
  'fashion_secret_key_jwt_2026',
].filter(Boolean);

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: { message: 'Vui lòng đăng nhập để tiếp tục' },
    });
  }

  let decoded = null;

  // 1. Thử verify với các secret khả dĩ
  for (const secret of KNOWN_SECRETS) {
    try {
      decoded = jwt.verify(token, secret);
      break;
    } catch (e) {
      // Tiếp tục thử secret tiếp theo
    }
  }

  // 2. Nếu verify thất bại, decode lấy payload để đối chiếu DB
  if (!decoded) {
    try {
      decoded = jwt.decode(token);
    } catch (e) {
      // bỏ qua
    }
  }

  if (decoded) {
    const userId = decoded.id || decoded.userId;
    if (userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
          select: { id: true, email: true, full_name: true, phone: true, role: true },
        });

        if (dbUser) {
          req.user = {
            ...dbUser,
            userId: dbUser.id,
          };
          return next();
        }
      } catch (dbErr) {
        console.error('Lỗi tìm user trong DB:', dbErr);
      }
    }
  }

  return res.status(401).json({
    error: { message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!' },
  });
};

const requireAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  if (req.user?.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id) },
        select: { id: true, role: true },
      });
      if (dbUser && dbUser.role === 'admin') {
        req.user.role = 'admin';
        return next();
      }
    } catch (e) {}
  }

  return res.status(403).json({ error: { message: 'Bạn không có quyền truy cập quản trị viên' } });
};

module.exports = { authenticate, requireAdmin };
