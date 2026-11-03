const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', reviewController.getReviews);
router.post('/', authenticate, reviewController.createReview);

module.exports = router;
