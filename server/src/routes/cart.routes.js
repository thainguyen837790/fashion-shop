const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Mọi thao tác giỏ hàng đều yêu cầu đăng nhập
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItemToCart);
router.put('/items/:id', cartController.updateItemQuantity);
router.put('/items/:id/variant', cartController.changeItemVariant);
router.delete('/items/:id', cartController.deleteCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
