const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getOrder, getAllOrders,
  updateOrderStatus, deleteOrder, cancelOrder, getOrderStats,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/my', protect, getMyOrders);
router.get('/stats', adminProtect, getOrderStats);
router.get('/', adminProtect, getAllOrders);
router.post('/', protect, placeOrder);
router.get('/:id', protect, getOrder);
router.put('/:id/status', adminProtect, updateOrderStatus);
router.delete('/:id', adminProtect, deleteOrder);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;
