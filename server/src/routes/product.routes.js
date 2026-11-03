const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/reviews', reviewController.getReviews);
router.post('/:id/reviews', authenticate, reviewController.createReview);

module.exports = router;
