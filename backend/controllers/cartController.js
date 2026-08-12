const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @desc    Get cart
// @route   GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name images price discountPrice stock',
  });
  res.json(cart || { user: req.user.id, items: [] });
});

// @desc    Add item to cart
// @route   POST /api/cart   body: { productId, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error('Not enough stock available');
  }

  const cart = await getOrCreateCart(req.user.id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity, price: product.discountPrice || product.price });
  }

  await cart.save();
  res.status(201).json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId   body: { quantity }
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find((item) => item.product.toString() === req.params.productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  res.json(cart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  res.json(cart);
});

// @desc    Clear cart
// @route   DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };