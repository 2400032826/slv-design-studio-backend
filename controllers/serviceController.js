const Service = require('../models/Service');
const slugify = require('slugify');

exports.getServices = async (req, res) => {
  const { category, featured } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  const services = await Service.find(query).sort({ sortOrder: 1, createdAt: -1 });
  res.status(200).json({ success: true, services });
};

exports.getService = async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, isActive: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.status(200).json({ success: true, service });
};

exports.createService = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = req.file.path;
  data.slug = slugify(data.name, { lower: true, strict: true });
  if (typeof data.priceRange === 'string') data.priceRange = JSON.parse(data.priceRange);
  if (typeof data.features === 'string') data.features = JSON.parse(data.features);
  const service = await Service.create(data);
  res.status(201).json({ success: true, service });
};

exports.updateService = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = req.file.path;
  if (typeof data.priceRange === 'string') data.priceRange = JSON.parse(data.priceRange);
  const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.status(200).json({ success: true, service });
};

exports.deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Service deleted' });
};
