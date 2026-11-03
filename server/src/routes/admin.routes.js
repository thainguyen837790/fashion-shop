const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// Mọi route bên dưới đều bắt buộc đăng nhập VÀ có role = 'admin'
router.use(authenticate, requireAdmin);


// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Quản lý sản phẩm
router.get('/products', adminController.getProductsAdmin);
router.get('/categories', adminController.getCategories);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/all', adminController.deleteAllProducts);
router.delete('/products/:id', adminController.deleteProduct);
router.post('/seed-sample', adminController.seedSampleProducts);

// Quản lý đơn hàng (Duyệt đơn, Xem đơn đặt)
router.get('/orders', adminController.getOrdersAdmin);
router.patch('/orders/:id/status', adminController.updateOrderStatusAdmin);

// Quản lý người dùng
router.get('/users', adminController.getUsersAdmin);
router.patch('/users/:id/role', adminController.updateUserRoleAdmin);

// Quản lý bình luận & đánh giá
router.get('/reviews', adminController.getReviewsAdmin);
router.get('/review-product-stats', adminController.getReviewProductStatsAdmin);
router.get('/products/:id/review-stats', adminController.getProductReviewStatsAdmin);
router.patch('/reviews/:id/visibility', adminController.toggleReviewVisibilityAdmin);
router.delete('/reviews/:id', adminController.deleteReviewAdmin);

module.exports = router;
