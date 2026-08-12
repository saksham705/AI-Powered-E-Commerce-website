const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const razorpay = getRazorpayInstance();

  const cart = await Cart.findOne({
    user: req.user.id,
  }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const itemsPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxPrice = itemsPrice * 0.08;
  const shippingPrice = itemsPrice > 100 ? 0 : 10;

  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const amountInPaise = Math.round(totalPrice * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${req.user.id}_${Date.now()}`,
  });

  res.json({
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  res.json({
    success: true,
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  const expected = crypto
    .createHmac(
      'sha256',
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(req.body)
    .digest('hex');

  if (signature !== expected) {
    return res
      .status(400)
      .send('Invalid webhook signature');
  }

  const event = JSON.parse(req.body);

  if (event.event === 'payment.captured') {
    console.log(
      'Payment captured:',
      event.payload.payment.entity.id
    );
  }

  res.json({ received: true });
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
};