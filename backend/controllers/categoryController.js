const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const DEMO_CATEGORIES = [
  { _id: 'cat1', name: 'Audio & Wearables', slug: 'audio-wearables', description: 'Smart headphones, earbuds, and audio gear' },
  { _id: 'cat2', name: 'AR & Cyberwear', slug: 'ar-cyberwear', description: 'Augmented reality glasses and futuristic wearables' },
  { _id: 'cat3', name: 'Smart Home & IoT', slug: 'smart-home-iot', description: 'AI voice assistants, lighting, and automation' },
  { _id: 'cat4', name: 'Gaming & Computing', slug: 'gaming-computing', description: 'Mechanical keyboards, wireless mice, and accessories' },
  { _id: 'cat5', name: 'Mobile & Devices', slug: 'mobile-devices', description: '5G Smartphones and mobile gadgets' },
];

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).populate('parent', 'name slug');
    if (categories && categories.length > 0) {
      return res.json(categories);
    }
  } catch (err) {}

  res.json(DEMO_CATEGORIES);
});

// @desc    Get single category by slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (category) {
      return res.json(category);
    }
  } catch (err) {}

  const demoMatch = DEMO_CATEGORIES.find((c) => c.slug === req.params.slug || c._id === req.params.slug);
  if (demoMatch) return res.json(demoMatch);

  res.status(404);
  throw new Error('Category not found');
});

// @desc    Create category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent } = req.body;
  const category = await Category.create({ name, description, image, parent: parent || null });
  res.status(201).json(category);
});

// @desc    Update category
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  Object.assign(category, req.body);
  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await category.deleteOne();
  res.json({ message: 'Category removed' });
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };