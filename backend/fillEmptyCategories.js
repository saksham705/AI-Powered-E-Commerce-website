const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const createSlug = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PRODUCTS_PER_CATEGORY = 6;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.create({
        name: 'AURA Official Store',
        email: 'seller@aura.ai',
        password: 'password123',
        role: 'seller',
        isApproved: true,
        storeName: 'AURA Flagship Store',
      });
      console.log('Created demo seller:', seller.email);
    }

    const categories = await Category.find();
    let filledCount = 0;
    let productsCreated = 0;

    for (const cat of categories) {
      const productCount = await Product.countDocuments({ category: cat._id });

      if (productCount > 0) continue; // sirf empty categories fill karo

      console.log(`Filling empty category: ${cat.name}`);

      const docs = [];
      for (let i = 1; i <= PRODUCTS_PER_CATEGORY; i++) {
        const seed = `${cat.slug || createSlug(cat.name)}-${i}`;
        const price = Math.floor(Math.random() * 8000) + 500; // ₹500 - ₹8500
        const hasDiscount = Math.random() > 0.5;

        docs.push({
          name: `${cat.name} Item ${i}`,
          slug: `${createSlug(cat.name)}-item-${i}-${Date.now()}-${i}`,
          description: `A quality product from our ${cat.name} collection. Carefully selected for style, durability, and value.`,
          shortDescription: `Quality ${cat.name} product.`,
          price,
          discountPrice: hasDiscount ? Math.round(price * 0.85) : undefined,
          category: cat._id,
          seller: seller._id,
          images: [`https://picsum.photos/seed/${seed}/500/500`],
          brand: 'AURA',
          stock: Math.floor(Math.random() * 40) + 10,
          sku: `AURA-${seed}-${Date.now()}`,
          tags: [createSlug(cat.name)],
          ratingsAverage: (Math.random() * 1.5 + 3.5).toFixed(1),
          ratingsCount: Math.floor(Math.random() * 40) + 5,
          isApproved: true,
          isActive: true,
        });
      }

      await Product.insertMany(docs);
      filledCount++;
      productsCreated += docs.length;
    }

    console.log('--------------------------------');
    console.log(`Categories filled: ${filledCount}`);
    console.log(`Products created: ${productsCreated}`);
    console.log('--------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
};

run();