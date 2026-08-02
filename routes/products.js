const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  toggleProduct, getFeaturedProducts, searchProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadProductImages } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

router.post('/', adminProtect, uploadProductImages, createProduct);
router.put('/:id', adminProtect, uploadProductImages, updateProduct);
router.delete('/:id', adminProtect, deleteProduct);
router.patch('/:id/toggle', adminProtect, toggleProduct);

module.exports = router;
