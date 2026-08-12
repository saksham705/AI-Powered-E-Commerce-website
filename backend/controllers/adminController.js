const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalSellers, totalCustomers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
  ]);

  res.json({
    totalUsers,
    totalSellers,
    totalCustomers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueAgg[0]?.total || 0,
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json(users);
});

// @desc    Approve a pending seller
// @route   PUT /api/admin/users/:id/approve
const approveSeller = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'seller') {
    res.status(404);
    throw new Error('Seller not found');
  }
  user.isApproved = true;
  await user.save();
  res.json({ message: 'Seller approved', user });
});

// @desc    Ban / unban a user
// @route   PUT /api/admin/users/:id/ban
const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
});

// @desc    Toggle a product's approval/visibility (moderation)
// @route   PUT /api/admin/products/:id/toggle-approval
const toggleProductApproval = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  product.isApproved = !product.isApproved;
  await product.save();
  res.json({ message: `Product ${product.isApproved ? 'approved' : 'unapproved'}`, product });
});

module.exports = { getDashboardStats, getAllUsers, approveSeller, toggleBanUser, toggleProductApproval };