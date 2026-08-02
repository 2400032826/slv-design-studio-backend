const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort('sortOrder').populate('children');
  res.json({ success: true, categories: cats });
});

router.post('/', adminProtect, uploadSingle, async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = req.file.path;
  const cat = await Category.create(data);
  res.status(201).json({ success: true, category: cat });
});

router.put('/:id', adminProtect, uploadSingle, async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = req.file.path;
  const cat = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json({ success: true, category: cat });
});

router.delete('/:id', adminProtect, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = router;
