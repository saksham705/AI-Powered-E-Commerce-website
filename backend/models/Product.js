const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    shortDescription: {
      type: String,
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    brand: {
      type: String,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    attributes: {
      type: Map,
      of: String,
    },

    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingsCount: {
      type: Number,
      default: 0,
    },

    isApproved: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    aiContent: {
      seoTitle: String,
      seoDescription: String,
      instagramCaption: String,
      facebookPost: String,
      whatsappPromo: String,
      emailCopy: String,
      adCopy: String,
      hashtags: [String],
      generatedAt: Date,
    },

    promoVideo: {
      url: String,
      publicId: {
        type: String,
        default: null,
      },
      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug =
      slugify(this.name, {
        lower: true,
        strict: true,
      }) +
      '-' +
      Date.now().toString().slice(-5);
  }
});

productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  brand: 'text',
});

module.exports = mongoose.model('Product', productSchema);