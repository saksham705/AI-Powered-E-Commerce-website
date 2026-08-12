const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const Product = require('./models/Product');

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    // Woh products dhoondo jinka images array khali hai ya exist hi nahi karta
    const noImageProducts = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: [''] },
      ],
    });

    console.log(`Found ${noImageProducts.length} products without images:`);
    noImageProducts.forEach((p) => console.log(`  - ${p.name}`));

    const result = await Product.deleteMany({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: [''] },
      ],
    });

    console.log(`\n✅ Deleted ${result.deletedCount} products without images.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
};

run();