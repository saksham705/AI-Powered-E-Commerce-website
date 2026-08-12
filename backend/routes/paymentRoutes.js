const express = require('express');
const router = express.Router();

const {
  createRazorpayOrder,
  verifyPayment,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);

router.post('/verify-payment', protect, verifyPayment);

module.exports = router;