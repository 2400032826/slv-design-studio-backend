const express = require('express');
const router = express.Router();
const { getServices, getService, createService, updateService, deleteService } = require('../controllers/serviceController');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', getServices);
router.get('/:slug', getService);
router.post('/', adminProtect, uploadSingle, createService);
router.put('/:id', adminProtect, uploadSingle, updateService);
router.delete('/:id', adminProtect, deleteService);

module.exports = router;
