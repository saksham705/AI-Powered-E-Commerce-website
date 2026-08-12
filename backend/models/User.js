const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, unique: true, sparse: true },

    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return !this.clerkId; // only required for non-Clerk (seeded) accounts
      },
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    avatar: { type: String, default: '' },
    phone: { type: String },
    addresses: [
      {
        label: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        isDefault: { type: Boolean, default: false },
      },
    ],

    storeName: { type: String },
    storeDescription: { type: String },
    storeLogo: { type: String },
    isApproved: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);