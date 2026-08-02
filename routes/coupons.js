const express = require('express');
const router = express.Router();
const {
  getPublicCoupons, validateCoupon, createCoupon, getCoupons,
  updateCoupon, toggleCoupon, deleteCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/public', getPublicCoupons);
router.post('/validate', protect, validateCoupon);
router.get('/', adminProtect, getCoupons);
router.post('/', adminProtect, createCoupon);
router.put('/:id', adminProtect, updateCoupon);
router.patch('/:id/toggle', adminProtect, toggleCoupon);
router.delete('/:id', adminProtect, deleteCoupon);

module.exports = router;
