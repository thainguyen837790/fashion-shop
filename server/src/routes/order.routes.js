const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetail);
router.patch('/:id/cancel', orderController.cancelOrder);
router.patch('/:id/status', requireAdmin, orderController.adminUpdateStatus);

module.exports = router; // Bắt buộc là 'module.exports = router;'