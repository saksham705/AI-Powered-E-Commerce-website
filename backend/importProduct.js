const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const axios = require('axios');

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

const titleCase = (text) =>
  text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const fetchWithRetry = async (url, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching products... Attempt ${attempt}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed:`,
        error.code || error.message
      );

      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected.\n');

    let seller = await User.findOne({
      email: 'seller@test.com',
    });

    if (!seller) {
      seller = await User.create({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: 'password123',
        role: 'seller',
        isApproved: true,
        storeName: 'My Test Store',
      });

      console.log('Created demo seller:', seller.email);
    } else {
      console.log('Using existing seller:', seller.email);
    }

    console.log('\nFetching products from DummyJSON...');

    const data = await fetchWithRetry(
      'https://dummyjson.com/products?limit=500'
    );

    const items = data.products || [];

    console.log(`Received ${items.length} DummyJSON products.\n`);

    const USD_TO_INR = 83;

    let categoriesCreated = 0;
    let productsCreated = 0;
    let productsSkipped = 0;

    const categoryCache = {};

    for (const p of items) {
      const categorySlug = p.category;
      const categoryName = titleCase(categorySlug);

      let category = categoryCache[categorySlug];

      if (!category) {
        category = await Category.findOne({
          slug: categorySlug,
        });

        if (!category) {
          category = await Category.create({
            name: categoryName,
            slug: categorySlug,
            description: `${categoryName} products`,
            isActive: true,
          });

          categoriesCreated++;

          console.log(`Created category: ${categoryName}`);
        }

        categoryCache[categorySlug] = category;
      }

      const existingProduct = await Product.findOne({
        sku: `DUMMYJSON-${p.id}`,
      });

      if (existingProduct) {
        productsSkipped++;
        console.log(`Skipped existing product: ${p.title}`);
        continue;
      }

      const productSlug = `${createSlug(p.title)}-${p.id}`;

      const price = Math.round(p.price * USD_TO_INR);

      const discountPrice = p.discountPercentage
        ? Math.round(
            price * (1 - p.discountPercentage / 100)
          )
        : undefined;

      await Product.create({
        name: p.title,
        slug: productSlug,
        description:
          p.description ||
          `High quality ${categoryName} product.`,
        shortDescription: p.description
          ? p.description.slice(0, 100)
          : '',
        price,
        discountPrice,
        category: category._id,
        seller: seller._id,
        images: p.images?.length
          ? p.images
          : [p.thumbnail],
        brand: p.brand || 'Generic',
        stock:
          typeof p.stock === 'number'
            ? p.stock
            : 20,
        sku: `DUMMYJSON-${p.id}`,
        tags: p.tags?.length
          ? p.tags
          : [categorySlug],
        ratingsAverage: p.rating || 4.5,
        ratingsCount:
          Math.floor(Math.random() * 50) + 5,
        isApproved: true,
        isActive: true,
      });

      productsCreated++;

      console.log(`Added: ${p.title}`);
    }

    console.log('\n================================');
    console.log('IMPORT COMPLETED');
    console.log('================================');
    console.log(
      `Categories created : ${categoriesCreated}`
    );
    console.log(
      `Products created   : ${productsCreated}`
    );
    console.log(
      `Products skipped   : ${productsSkipped}`
    );
    console.log('================================\n');

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error('\nIMPORT FAILED:');
    console.error(error.message);

    await mongoose.disconnect();

    process.exit(1);
  }
};

run();