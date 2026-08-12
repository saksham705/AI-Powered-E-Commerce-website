const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');

const getProducts = asyncHandler(async (req, res) => {
  const queryParams = { ...req.query };

  if (
    queryParams.category &&
    !mongoose.Types.ObjectId.isValid(queryParams.category)
  ) {
    const cat = await Category.findOne({ slug: queryParams.category });
    queryParams.category = cat
      ? cat._id.toString()
      : new mongoose.Types.ObjectId().toString();
  }

  const filterQuery = { isActive: true, isApproved: true };

  if (queryParams.keyword) {
    const regex = new RegExp(queryParams.keyword.trim(), 'i');
    filterQuery.$or = [
      { name: regex },
      { description: regex },
      { tags: regex },
      { brand: regex },
    ];
  }

  if (queryParams.category) {
    filterQuery.category = queryParams.category;
  }

  if (queryParams.price) {
    filterQuery.price = {};
    if (queryParams.price.gte)
      filterQuery.price.$gte = Number(queryParams.price.gte);
    if (queryParams.price.lte)
      filterQuery.price.$lte = Number(queryParams.price.lte);
  }

  const baseQuery = Product.find({ isActive: true, isApproved: true })
    .populate('category', 'name slug')
    .populate('seller', 'name storeName');

  const features = new APIFeatures(baseQuery, queryParams)
    .search(['name', 'description', 'tags', 'brand'])
    .filter()
    .sort()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments(filterQuery);

  const page = features.pagination ? features.pagination.page : Number(queryParams.page) || 1;
  const limit = features.pagination ? features.pagination.limit : Number(queryParams.limit) || 20;

  res.json({
    success: true,
    products,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
    isApproved: true,
  })
    .populate('category', 'name slug')
    .populate('seller', 'name storeName');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    seller: req.user.id,
  })
    .populate('category', 'name slug')
    .sort('-createdAt');

  res.json(products);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    seller: req.user.id,
    isActive: true,
    isApproved: true,
  });

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (
    product.seller.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to edit this product');
  }

  Object.assign(product, req.body);

  const updated = await product.save();

  res.json(updated);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (
    product.seller.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product removed',
  });
});

const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Please upload at least one image');
  }

  const files = req.files
    .map((file) => ({
      url: file.path || file.secure_url || file.url,
      public_id: file.filename || file.public_id,
    }))
    .filter((file) => file.url);

  res.json({
    success: true,
    files,
  });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  uploadProductImages,
};