const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  approveSeller,
  toggleBanUser,
  toggleProductApproval,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/approve', approveSeller);
router.put('/users/:id/ban', toggleBanUser);
router.put('/products/:id/toggle-approval', toggleProductApproval);

module.exports = router;