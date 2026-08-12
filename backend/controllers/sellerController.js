const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Seller dashboard stats
// @route   GET /api/seller/dashboard
const getSellerDashboard = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({ seller: req.user.id });

  const orders = await Order.find({ 'orderItems.seller': req.user.id });
  const sellerItems = orders.flatMap((order) =>
    order.orderItems.filter((item) => item.seller.toString() === req.user.id)
  );

  const totalRevenue = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalUnitsSold = sellerItems.reduce((sum, item) => sum + item.quantity, 0);

  const lowStockProducts = await Product.find({ seller: req.user.id, stock: { $lte: 5 } }).select('name stock');

  res.json({
    totalProducts,
    totalOrders: orders.length,
    totalRevenue,
    totalUnitsSold,
    lowStockProducts,
  });
});

module.exports = { getSellerDashboard };