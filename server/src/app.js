const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const addressRoutes = require('./routes/address.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction) {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ALLOWED_ORIGINS', 'AI_SERVICE_URL', 'INTERNAL_API_KEY'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    throw new Error(`Thiếu biến môi trường production: ${missingEnv.join(', ')}`);
  }
}

app.use(cors({
  origin(origin, callback) {
    const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    const origins = allowedOrigins.length ? allowedOrigins : localOrigins;
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin không được phép truy cập API'));
  },
}));
app.use(express.json());

// Khai báo các Route
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tài nguyên không tồn tại' } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
