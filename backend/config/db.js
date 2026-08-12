const dns = require('dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']); // hamesha set karo, condition ki zaroorat nahi

const connectDB = async () => {
  try {
    console.log('connecting....');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    process.exit(1);
  }
};

module.exports = connectDB;