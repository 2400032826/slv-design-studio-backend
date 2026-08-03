const mongoose = require('mongoose');
const { seedDatabase } = require('../utils/seedData');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('❌ MONGO_URI is missing from environment variables');
      return;
    }

    if (mongoURI.includes('<db_password>')) {
      console.warn('\n⚠️ WARNING: MONGO_URI contains the placeholder <db_password>.');
      console.warn('👉 Please replace <db_password> with your actual MongoDB Atlas database password in backend/.env or Render Environment Variables.\n');
      try {
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/slv-design-studio');
        console.log(`✅ Fallback to Local MongoDB Connected: ${conn.connection.host}`);
        await seedDatabase();
        return;
      } catch (localErr) {
        console.error('❌ Local MongoDB fallback failed. Please set real Atlas password in MONGO_URI.');
        return;
      }
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);

    // Trigger auto-seeder & Admin check
    await seedDatabase();

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected.');
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
