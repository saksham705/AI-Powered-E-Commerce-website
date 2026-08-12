
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const dns = require('dns');

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, {
        timeout: 15000,
      });

      return data;
    } catch (err) {
      console.log(`Attempt ${i + 1} failed: ${err.code || err.message}`);

      if (i === retries - 1) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const categoryStructure = {
  Men: ['T-Shirts', 'Shirts', 'Jeans', 'Shoes', 'Watches'],
  Women: ['Dresses', 'Tops', 'Jeans', 'Shoes', 'Bags', 'Jewellery'],
  Electronics: ['Mobiles', 'Laptops', 'Headphones', 'Cameras', 'Smart Watches'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Lighting', 'Bedding'],
  Beauty: ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Grooming'],
  Sports: ['Gym', 'Running', 'Cricket', 'Football', 'Outdoor'],
  Automotive: ['Car Accessories', 'Bike Accessories', 'Car Care', 'Car Electronics'],
  Kids: ['Kids Clothing', 'Toys', 'School Supplies', 'Baby Products'],
  Books: ['Fiction', 'Non-Fiction', 'Education', 'Technology', 'Competitive Exams'],
  'AI & Smart Tech': ['AI Gadgets', 'Smart Home', 'Wearables', 'Productivity Tech'],
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected...');

    let seller = await User.findOne({
      role: 'seller',
      isApproved: true,
    });

    if (!seller) {
      seller = await User.create({
        name: 'AURA Official Store',
        email: 'seller@aura.ai',
        password: 'password123',
        role: 'seller',
        isApproved: true,
        storeName: 'AURA Flagship Store',
      });

      console.log('Created seller:', seller.email);
    }

    const categoryMap = {};

    for (const [parentName, subcategories] of Object.entries(categoryStructure)) {
      let parent = await Category.findOne({
  $or: [
    { name: parentName },
    { slug: createSlug(parentName) },
  ],
  parent: null,
});

if (!parent) {
  parent = await Category.create({
    name: parentName,
    slug: createSlug(parentName),
    description: `${parentName} products`,
    parent: null,
    isActive: true,
  });

  console.log(`Created main category: ${parentName}`);
} 
      categoryMap[parentName] = {};

      for (const subcategoryName of subcategories) {
        const fullName = `${parentName} - ${subcategoryName}`;

        let subcategory = await Category.findOne({
          name: fullName,
          parent: parent._id,
        });

        if (!subcategory) {
          subcategory = await Category.create({
            name: fullName,
            description: `${subcategoryName} products under ${parentName}`,
            parent: parent._id,
            isActive: true,
          });

          console.log(`Created subcategory: ${fullName}`);
        }

        categoryMap[parentName][subcategoryName] = subcategory._id;
      }
    }

    console.log('Categories and subcategories ready.');

    console.log('Fetching products from DummyJSON...');

    const data = await fetchWithRetry(
      'https://dummyjson.com/products?limit=500'
    );

    const items = data.products || [];

    console.log(`Received ${items.length} products`);

    const USD_TO_INR = 83;

    const availableSubcategories = [];

    for (const [parentName, children] of Object.entries(categoryStructure)) {
      for (const childName of children) {
        availableSubcategories.push({
          parentName,
          childName,
          categoryId: categoryMap[parentName][childName],
        });
      }
    }

    const docs = items.map((p, index) => {
      const target =
        availableSubcategories[index % availableSubcategories.length];

      const slug = createSlug(p.title);

      return {
        name: p.title,
        slug: `${slug}-${Date.now()}-${index}`,
        description:
          p.description || `High quality ${target.childName} product.`,
        shortDescription: p.description
          ? p.description.slice(0, 100)
          : '',
        price: Math.round(p.price * USD_TO_INR),
        discountPrice: p.discountPercentage
          ? Math.round(
              p.price *
                USD_TO_INR *
                (1 - p.discountPercentage / 100)
            )
          : undefined,
        category: target.categoryId,
        seller: seller._id,
        images:
          p.images && p.images.length > 0
            ? p.images
            : [p.thumbnail],
        brand: p.brand || 'Generic',
        stock: p.stock || 20,
        sku: `AURA-${p.id}-${Date.now()}-${index}`,
        tags: p.tags || [target.childName.toLowerCase()],
        ratingsAverage: p.rating || 4.5,
        ratingsCount: Math.floor(Math.random() * 50) + 5,
        isApproved: true,
        isActive: true,
      };
    });

    let added = 0;
    let skipped = 0;

    for (const productData of docs) {
      const exists = await Product.findOne({
        name: productData.name,
        seller: seller._id,
      });

      if (exists) {
        skipped++;
        continue;
      }

      await Product.create(productData);
      added++;
    }

    console.log('--------------------------------');
    console.log(`New products added: ${added}`);
    console.log(`Existing products skipped: ${skipped}`);
    console.log(`API products processed: ${docs.length}`);
    console.log('--------------------------------');

    await mongoose.connection.close();

    console.log('Import completed successfully.');

    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message);

    try {
      await mongoose.connection.close();
    } catch (closeError) {}

    process.exit(1);
  }
};

run();

