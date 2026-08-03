const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Gallery = require('../models/Gallery');
const Coupon = require('../models/Coupon');
const Service = require('../models/Service');

exports.seedDatabase = async () => {
  try {
    console.log('🌱 Checking MongoDB Atlas initial seed state...');

    // 1. Auto-create Admin Account
    const adminEmail = (process.env.ADMIN_EMAIL || 'prabhavathi539@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'hari2018';

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = await Admin.create({
        name: 'SLV Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        isActive: true,
      });
      console.log(`✅ Default Admin created: ${adminEmail}`);
    }

    // 2. Categories
    const categoryCount = await Category.countDocuments();
    let defaultCategory = null;

    if (categoryCount === 0) {
      const categoriesData = [
        { name: 'Bridal Embroidery', description: 'Handcrafted premium bridal blouse & saree embroidery' },
        { name: 'Custom Stitching', description: 'Designer tailored blouses, dresses & ethnic wear' },
        { name: 'Digital Fabric Printing', description: 'High definition custom textile and dupatta printing' },
        { name: 'Silk Sarees', description: 'Traditional South Indian silk sarees with rich zari work' },
      ];
      const createdCats = await Category.insertMany(categoriesData);
      defaultCategory = createdCats[0];
      console.log(`✅ Seeded ${createdCats.length} Categories`);
    } else {
      defaultCategory = await Category.findOne();
    }

    // 3. Products
    const productCount = await Product.countDocuments();
    if (productCount === 0 && defaultCategory) {
      const productsData = [
        {
          name: 'Royal Zardosi Bridal Blouse',
          description: 'Intricate gold zardosi and peacock motif hand embroidery on heavy silk fabric.',
          price: 4999,
          mrp: 6999,
          offerPrice: 4999,
          category: defaultCategory._id,
          stock: 25,
          isFeatured: true,
          isActive: true,
          images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800' }],
        },
        {
          name: 'Custom Velvet Maggam Work Blouse',
          description: 'Deep maroon velvet blouse featuring pearl and cutdana maggam embroidery.',
          price: 3499,
          mrp: 4999,
          offerPrice: 3499,
          category: defaultCategory._id,
          stock: 30,
          isFeatured: true,
          isActive: true,
          images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800' }],
        },
        {
          name: 'Floral Digital Print Dupatta',
          description: 'Pure organza dupatta with vivid floral digital printing and scalloped border.',
          price: 1499,
          mrp: 2499,
          offerPrice: 1499,
          category: defaultCategory._id,
          stock: 40,
          isFeatured: true,
          isActive: true,
          images: [{ url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800' }],
        },
      ];
      await Product.insertMany(productsData);
      console.log(`✅ Seeded ${productsData.length} Products`);
    }

    // 4. Gallery Items
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      const galleryData = [
        {
          title: 'Bridal Maggam Design',
          description: 'Heavy peacock motif embroidery with stone work',
          url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800',
          type: 'image',
          category: 'embroidery',
          isFeatured: true,
          isActive: true,
        },
        {
          title: 'Custom Fabric Printing Showcase',
          description: 'High resolution digital silk dupatta printing',
          url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800',
          type: 'image',
          category: 'printing',
          isFeatured: true,
          isActive: true,
        },
        {
          title: 'Designer Blouse Stitching',
          description: 'Perfect fit deep-neck tailored blouse with tassel tie-backs',
          url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800',
          type: 'image',
          category: 'stitching',
          isFeatured: true,
          isActive: true,
        },
      ];
      await Gallery.insertMany(galleryData);
      console.log(`✅ Seeded ${galleryData.length} Gallery items`);
    }

    // 5. Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const couponsData = [
        {
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          minOrderAmount: 500,
          description: 'Get 10% OFF on your first booking order!',
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'SLV200',
          type: 'fixed',
          value: 200,
          minOrderAmount: 1000,
          description: 'Flat ₹200 OFF on boutique bookings above ₹1000',
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      ];
      await Coupon.insertMany(couponsData);
      console.log(`✅ Seeded ${couponsData.length} Coupons`);
    }

    // 6. Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const servicesData = [
        {
          name: 'Computerized Embroidery',
          slug: 'computerized-embroidery',
          description: 'Precision digital machine embroidery for blouses, dupattas, and sarees.',
          category: 'embroidery',
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800',
          priceRange: { min: 500, max: 15000 },
          deliveryTime: '3-5 business days',
          isActive: true,
        },
        {
          name: 'Custom Fabric Printing',
          slug: 'custom-fabric-printing',
          description: 'High-definition digital printing on silk, organza, cotton, and velvet.',
          category: 'printing',
          image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800',
          priceRange: { min: 300, max: 5000 },
          deliveryTime: '2-4 business days',
          isActive: true,
        },
        {
          name: 'Boutique Tailoring & Stitching',
          slug: 'boutique-tailoring-stitching',
          description: 'Custom fit bridal blouse stitching, lehenga tailoring, and alterations.',
          category: 'stitching',
          image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800',
          priceRange: { min: 400, max: 3000 },
          deliveryTime: '2-3 business days',
          isActive: true,
        },
      ];
      await Service.insertMany(servicesData);
      console.log(`✅ Seeded ${servicesData.length} Services`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};
