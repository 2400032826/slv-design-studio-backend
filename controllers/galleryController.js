const Gallery = require('../models/Gallery');

// @desc Get gallery (public)
// @route GET /api/gallery
exports.getGallery = async (req, res) => {
  const { category, type, featured, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;
  if (type) query.type = type;
  if (featured === 'true') query.isFeatured = true;

  const total = await Gallery.countDocuments(query);
  const items = await Gallery.find(query)
    .sort({ sortOrder: 1, createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.status(200).json({ success: true, total, items });
};

// @desc Get homepage slider images
// @route GET /api/gallery/slider
exports.getSlider = async (req, res) => {
  const items = await Gallery.find({ isHomepageSlider: true, isActive: true })
    .sort('sortOrder')
    .limit(10);
  res.status(200).json({ success: true, items });
};

// @desc Admin: Upload gallery items
// @route POST /api/gallery
exports.uploadGalleryItems = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const items = req.files.map((file) => ({
    url: file.path && file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`,
    publicId: file.filename,
    type: file.mimetype.startsWith('video') ? 'video' : 'image',
    category: req.body.category || 'other',
    title: req.body.title || '',
    isHomepageSlider: req.body.isHomepageSlider === 'true',
    isFeatured: req.body.isFeatured === 'true',
  }));

  const created = await Gallery.insertMany(items);
  res.status(201).json({ success: true, items: created });
};

// @desc Admin: Update gallery item
// @route PUT /api/gallery/:id
exports.updateGalleryItem = async (req, res) => {
  const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  res.status(200).json({ success: true, item });
};

// @desc Admin: Delete gallery item
// @route DELETE /api/gallery/:id
exports.deleteGalleryItem = async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  await item.deleteOne();
  res.status(200).json({ success: true, message: 'Item deleted' });
};
