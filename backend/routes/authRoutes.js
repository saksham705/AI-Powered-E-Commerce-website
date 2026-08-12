
const express = require('express');
const router = express.Router();

const {
  getMe,
  becomeSeller,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Get logged-in user's MongoDB profile
router.get('/me', protect, getMe);

// Become a seller
router.put('/become-seller', protect, becomeSeller);

module.exports = router;

