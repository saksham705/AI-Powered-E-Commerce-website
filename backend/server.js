const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { clerkMiddleware } = require('@clerk/express');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const { razorpayWebhook } = require('./controllers/paymentController');

dotenv.config();

connectDB();

const app = express();
app.set('query parser', 'extended');

app.use(cors());

app.use(clerkMiddleware());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Razorpay webhook
// Keep this BEFORE express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'AI E-Commerce API is running...',
    status: 'success',
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

module.exports = app;