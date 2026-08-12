const express = require('express');
const router = express.Router();
const {
  generateContentStudio,
  generateVideoScript,
  generateVideoVoice,
  generatePromoVideo,
  getRecommendations,
  getReviewSummary,
  getSalesInsights,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/content-studio/:productId', protect, authorize('seller', 'admin'), generateContentStudio);
router.post('/video-studio/:productId', protect, authorize('seller', 'admin'), generateVideoScript);
router.post('/video-voice', protect, authorize('seller', 'admin'), generateVideoVoice);
router.post('/generate-video/:productId', protect, authorize('seller', 'admin'), generatePromoVideo); // ← yeh line honi chahiye
router.get('/recommendations', protect, getRecommendations);
router.get('/review-summary/:productId', getReviewSummary);
router.get('/sales-insights', protect, authorize('seller', 'admin'), getSalesInsights);

module.exports = router;