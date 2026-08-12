const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/seller/my-sales', authorize('seller', 'admin'), getSellerOrders);
router.get('/', authorize('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('seller', 'admin'), updateOrderStatus);

module.exports = router;