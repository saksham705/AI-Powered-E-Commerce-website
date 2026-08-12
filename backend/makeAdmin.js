const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');

dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1']); 

const email = process.argv[2];

if (!email) {
  console.error('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    user.role = 'admin';
    user.isApproved = true;
    await user.save();

    console.log(`✅ ${user.name} (${user.email}) is now an admin.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
};

run();