const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  uploadProductImages,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/seller/my-products', protect, authorize('seller', 'admin'), getMyProducts);
router.post('/upload-images', protect, authorize('seller', 'admin'), upload.array('images', 5), uploadProductImages);
router.get('/:slug', getProductBySlug);
router.post('/', protect, authorize('seller', 'admin'), createProduct);
router.put('/:id', protect, authorize('seller', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;