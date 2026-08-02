require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
};

const Admin = require('../models/Admin');
const Category = require('../models/Category');

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'prabhavathi539@gmail.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'hari2018';

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (existingAdmin) {
    existingAdmin.password = adminPassword;
    await existingAdmin.save();
    console.log('✅ Admin account updated in DB:', adminEmail);
    return;
  }

  await Admin.create({
    name: 'Super Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'superadmin',
  });
  console.log('✅ New Admin created in DB:', adminEmail);
};

const seedCategories = async () => {
  const categories = [
    { name: 'Blouses', slug: 'blouses', emoji: '👗' },
    { name: 'Kurtis', slug: 'kurtis', emoji: '👘' },
    { name: 'Lehengas', slug: 'lehengas', emoji: '💃' },
    { name: "Men's Wear", slug: 'mens-wear', emoji: '👔' },
    { name: 'Sarees', slug: 'sarees', emoji: '🌸' },
    { name: 'Embroidery Work', slug: 'embroidery', emoji: '🧵' },
    { name: 'Printed Wear', slug: 'printed-wear', emoji: '🖨️' },
    { name: 'Accessories', slug: 'accessories', emoji: '💎' },
    { name: 'Bridal Collection', slug: 'bridal', emoji: '👰' },
    { name: 'Kids Wear', slug: 'kids', emoji: '🎀' },
  ];

  for (const cat of categories) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (!exists) {
      await Category.create(cat);
      console.log(`✅ Category created: ${cat.name}`);
    }
  }
};

const main = async () => {
  await connectDB();
  await seedAdmin();
  await seedCategories();
  console.log('\n🎉 Seeding complete!');
  console.log(`\nAdmin credentials:`);
  console.log(`  Email: ${process.env.ADMIN_EMAIL}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD}`);
  console.log(`\nLogin at: http://localhost:5173/admin/login`);
  process.exit(0);
};

main().catch(console.error);
