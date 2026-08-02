const express = require('express');
const router = express.Router();
const { getDashboard, getCustomers, getCustomer, toggleBlockCustomer } = require('../controllers/adminController');
const { getAllReviews, toggleApproval } = require('../controllers/reviewController');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/dashboard', adminProtect, getDashboard);

// Customer management routes (support both /customers and /users)
router.get('/customers', adminProtect, getCustomers);
router.get('/users', adminProtect, getCustomers);
router.get('/customers/:id', adminProtect, getCustomer);
router.get('/users/:id', adminProtect, getCustomer);
router.patch('/customers/:id/block', adminProtect, toggleBlockCustomer);
router.put('/customers/:id/block', adminProtect, toggleBlockCustomer);
router.put('/users/:id/block', adminProtect, toggleBlockCustomer);

// Review management routes under /admin
router.get('/reviews', adminProtect, getAllReviews);
router.put('/reviews/:id/approve', adminProtect, toggleApproval);
router.patch('/reviews/:id/approve', adminProtect, toggleApproval);

module.exports = router;
