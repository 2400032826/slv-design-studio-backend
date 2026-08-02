const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllRead, createGlobalNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllRead);
router.post('/global', adminProtect, createGlobalNotification);

module.exports = router;
