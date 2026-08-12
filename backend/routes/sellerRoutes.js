const express = require('express');
const router = express.Router();
const { getSellerDashboard } = require('../controllers/sellerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('seller', 'admin'), getSellerDashboard);

module.exports = router;