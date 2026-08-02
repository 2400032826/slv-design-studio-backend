const express = require('express');
const router = express.Router();
const { getGallery, getSlider, uploadGalleryItems, updateGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadGallery } = require('../middleware/upload');

router.get('/', getGallery);
router.get('/slider', getSlider);
router.post('/', adminProtect, uploadGallery, uploadGalleryItems);
router.put('/:id', adminProtect, updateGalleryItem);
router.delete('/:id', adminProtect, deleteGalleryItem);

module.exports = router;
