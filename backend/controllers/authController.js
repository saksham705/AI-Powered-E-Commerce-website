
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User no longer exists');
  }

  res.json({
    _id: user._id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    addresses: user.addresses,
    storeName: user.storeName,
    storeDescription: user.storeDescription,
    storeLogo: user.storeLogo,
    isApproved: user.isApproved,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
  });
});

// @desc    Become a seller
// @route   PUT /api/auth/become-seller
// @access  Private
const becomeSeller = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account has been banned');
  }

  if (user.role === 'seller') {
    res.status(400);
    throw new Error('You are already a seller');
  }

  const { storeName, storeDescription } = req.body;

  if (!storeName) {
    res.status(400);
    throw new Error('Store name is required');
  }

  user.role = 'seller';
  user.storeName = storeName;
  user.storeDescription = storeDescription || '';
  user.isApproved = false;

  await user.save();

  res.json({
    message: 'Seller application submitted successfully',
    user: {
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      role: user.role,
      storeName: user.storeName,
      storeDescription: user.storeDescription,
      isApproved: user.isApproved,
    },
  });
});

module.exports = {
  getMe,
  becomeSeller,
};

