const express = require('express');
const router = express.Router();
const { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { adminProtect } = require('../middleware/adminAuth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', getBlogs);
router.get('/:slug', getBlog);
router.post('/', adminProtect, uploadSingle, createBlog);
router.put('/:id', adminProtect, uploadSingle, updateBlog);
router.delete('/:id', adminProtect, deleteBlog);

module.exports = router;
