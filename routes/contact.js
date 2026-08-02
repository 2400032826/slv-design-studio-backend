const express = require('express');
const router = express.Router();
const { submitContact, getMessages, updateMessageStatus } = require('../controllers/contactController');
const { adminProtect } = require('../middleware/adminAuth');
const { globalLimiter } = require('../middleware/rateLimiter');

router.post('/', globalLimiter, submitContact);
router.get('/', adminProtect, getMessages);
router.patch('/:id', adminProtect, updateMessageStatus);

module.exports = router;
