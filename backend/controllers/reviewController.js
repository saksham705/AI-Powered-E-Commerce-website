const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const updateProductRatings = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats[0]?.avgRating || 0,
    ratingsCount: stats[0]?.count || 0,
  });
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort('-createdAt');
  res.json(reviews);
});

// @desc    Create review (only if purchased)
// @route   POST /api/reviews/product/:productId   body: { rating, comment }
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  const hasPurchased = await Order.exists({
    user: req.user.id,
    isPaid: true,
    'orderItems.product': productId,
  });

  if (!hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased');
  }

  const alreadyReviewed = await Review.findOne({ product: productId, user: req.user.id });
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({ product: productId, user: req.user.id, rating, comment });
  await updateProductRatings(productId);

  res.status(201).json(review);
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('You can only edit your own review');
  }

  review.rating = req.body.rating ?? review.rating;
  review.comment = req.body.comment ?? review.comment;
  await review.save();

  await updateProductRatings(review.product);
  res.json(review);
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const productId = review.product;
  await review.deleteOne();
  await updateProductRatings(productId);

  res.json({ message: 'Review removed' });
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview };