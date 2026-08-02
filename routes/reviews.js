const express = require('express');
const router = express.Router();
const { addReview, getProductReviews, deleteReview, getAllReviews, toggleApproval, replyToReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', adminProtect, getAllReviews);
router.get('/:productId', getProductReviews);
router.post('/', protect, addReview);
router.delete('/:id', adminProtect, deleteReview);
router.patch('/:id/approve', adminProtect, toggleApproval);
router.put('/:id/approve', adminProtect, toggleApproval);
router.post('/:id/reply', adminProtect, replyToReview);

module.exports = router;
