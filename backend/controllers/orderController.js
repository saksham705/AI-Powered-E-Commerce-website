const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Create order from cart
// @route   POST /api/orders   body: { shippingAddress, paymentMethod, paymentResult }
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, paymentResult } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product ? product.name : 'a product'}`);
    }
    orderItems.push({
      product: product._id,
      seller: product.seller,
      name: product.name,
      image: product.images?.[0] || '',
      price: item.price,
      quantity: item.quantity,
    });
  }

  const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxPrice = Number((itemsPrice * 0.08).toFixed(2));
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

  const order = await Order.create({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: !!paymentResult,
    paidAt: paymentResult ? Date.now() : undefined,
  });

  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

// @desc    Get my orders
// @route   GET /api/orders/my-orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
  res.json(orders);
});

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user._id.toString() === req.user.id;
  const isSellerInOrder = order.orderItems.some((item) => item.seller.toString() === req.user.id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isSellerInOrder && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

// @desc    Get orders containing seller's products
// @route   GET /api/orders/seller/my-sales
const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'orderItems.seller': req.user.id }).sort('-createdAt');
  res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status   body: { status }
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isSellerInOrder = order.orderItems.some((item) => item.seller.toString() === req.user.id);
  if (req.user.role === 'seller' && !isSellerInOrder) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  order.status = status;
  if (status === 'delivered') order.deliveredAt = Date.now();

  const updated = await order.save();
  res.json(updated);
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
  res.json(orders);
});

module.exports = { createOrder, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus, getAllOrders };