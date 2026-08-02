const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', async (req, res) => {
  const { type, active, homepage } = req.query;
  const query = {};
  if (type) query.type = type;
  if (active === 'true') query.isActive = true;
  if (homepage === 'true') query.isHomepageSlider = true;
  const offers = await Offer.find(query).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, offers });
});

router.post('/', adminProtect, uploadSingle, async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.bannerImage = req.file.path;
  const offer = await Offer.create(data);
  res.status(201).json({ success: true, offer });
});

router.put('/:id', adminProtect, uploadSingle, async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.bannerImage = req.file.path;
  const offer = await Offer.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json({ success: true, offer });
});

router.delete('/:id', adminProtect, async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Offer deleted' });
});

module.exports = router;
