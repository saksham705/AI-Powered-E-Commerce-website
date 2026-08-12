const { clerkClient, getAuth } = require('@clerk/express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  let user = await User.findOne({ clerkId: userId });

  if (!user) {
    // First request from this Clerk account — link or create the local user
    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    const name =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
      || 'New User';

    user = await User.findOne({ email });

    if (user) {
      user.clerkId = userId;
      await user.save();
    } else {
      user = await User.create({
        clerkId: userId,
        name,
        email,
        role: 'customer',
        isApproved: true,
      });
    }
  }

  // Check if user is banned
  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account has been banned');
  }

  req.user = user;

  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {

    // Check user's role
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }

    // Seller must be approved by admin
    if (
      req.user.role === 'seller' &&
      !req.user.isApproved
    ) {
      res.status(403);
      throw new Error(
        'Your seller account is pending admin approval'
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};