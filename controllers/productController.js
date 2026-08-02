const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');

// @desc Get all products with filtering, sorting, pagination
// @route GET /api/products
exports.getProducts = async (req, res) => {
  const {
    page = 1, limit = 12, sort = '-createdAt', category, search,
    minPrice, maxPrice, color, size, rating, featured, newArrival, bestseller, inStock,
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (newArrival === 'true') query.isNewArrival = true;
  if (bestseller === 'true') query.isBestseller = true;
  if (inStock === 'true') query.isInStock = true;
  if (rating) query.rating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (search) {
    query.$text = { $search: search };
  }
  if (color) {
    query['colors.name'] = { $regex: color, $options: 'i' };
  }
  if (size) {
    query['sizes.label'] = { $regex: size, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .select('-reviews');

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    products,
  });
};

// @desc Get single product
// @route GET /api/products/:id
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }], isActive: true })
    .populate('category', 'name slug')
    .populate({ path: 'reviews', populate: { path: 'user', select: 'name avatar' } })
    .populate('relatedProducts', 'name images price offerPrice rating');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.views += 1;
  await product.save();

  res.status(200).json({ success: true, product });
};

// @desc Create product (Admin)
// @route POST /api/products
exports.createProduct = async (req, res) => {
  const productData = { ...req.body };

  if (req.files) {
    if (req.files.images) {
      productData.images = req.files.images.map((f) => ({
        url: f.path && f.path.startsWith('http') ? f.path : `/uploads/${f.filename}`,
        publicId: f.filename,
        alt: productData.name,
      }));
    }
    if (req.files.video && req.files.video[0]) {
      const v = req.files.video[0];
      productData.video = {
        url: v.path && v.path.startsWith('http') ? v.path : `/uploads/${v.filename}`,
        publicId: v.filename,
      };
    }
  }

  if (typeof productData.colors === 'string') productData.colors = JSON.parse(productData.colors);
  if (typeof productData.sizes === 'string') productData.sizes = JSON.parse(productData.sizes);
  if (typeof productData.tags === 'string') productData.tags = JSON.parse(productData.tags);

  const product = await Product.create(productData);
  res.status(201).json({ success: true, product });
};

// @desc Update product (Admin)
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  const updateData = { ...req.body };

  if (req.files) {
    if (req.files.images) {
      updateData.images = req.files.images.map((f) => ({
        url: f.path && f.path.startsWith('http') ? f.path : `/uploads/${f.filename}`,
        publicId: f.filename,
        alt: updateData.name,
      }));
    }
    if (req.files.video && req.files.video[0]) {
      const v = req.files.video[0];
      updateData.video = {
        url: v.path && v.path.startsWith('http') ? v.path : `/uploads/${v.filename}`,
        publicId: v.filename,
      };
    }
  }

  if (typeof updateData.colors === 'string') updateData.colors = JSON.parse(updateData.colors);
  if (typeof updateData.sizes === 'string') updateData.sizes = JSON.parse(updateData.sizes);
  if (typeof updateData.tags === 'string') updateData.tags = JSON.parse(updateData.tags);

  const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  res.status(200).json({ success: true, product });
};

// @desc Delete product (Admin)
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Delete from Cloudinary if configured and publicId is valid
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      for (const img of (product.images || [])) {
        if (img.publicId && typeof img.publicId === 'string' && !img.publicId.includes('.')) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }
      if (product.video?.publicId && typeof product.video.publicId === 'string' && !product.video.publicId.includes('.')) {
        await cloudinary.uploader.destroy(product.video.publicId, { resource_type: 'video' });
      }
    }
  } catch (err) {
    console.warn('Skipping Cloudinary deletion:', err.message);
  }

  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted' });
};

// @desc Toggle product active status
// @route PATCH /api/products/:id/toggle
exports.toggleProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  product.isActive = !product.isActive;
  await product.save();
  res.status(200).json({ success: true, isActive: product.isActive });
};

// @desc Get featured products for homepage
// @route GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name')
    .sort('-createdAt')
    .limit(8)
    .select('name images price offerPrice mrp rating numReviews isBestseller isNewArrival');
  res.status(200).json({ success: true, products });
};

// @desc Search products
// @route GET /api/products/search
exports.searchProducts = async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

  const products = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(Number(limit))
    .select('name images price offerPrice rating slug');

  res.status(200).json({ success: true, count: products.length, products });
};
