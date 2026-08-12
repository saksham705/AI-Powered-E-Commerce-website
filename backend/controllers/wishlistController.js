const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get logged-in user's wishlist
// @route   GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    populate: { path: 'category', select: 'name slug' },
  });
  res.json(user.wishlist);
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user.id);
  if (user.wishlist.includes(product._id)) {
    res.status(400);
    throw new Error('Product already in wishlist');
  }

  user.wishlist.push(product._id);
  await user.save();

  res.status(201).json({ message: 'Added to wishlist', wishlist: user.wishlist });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();

  res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };