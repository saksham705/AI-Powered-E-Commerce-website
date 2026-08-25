const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const asyncHandler = require('express-async-handler');

const Product = require('../models/Product');
const Review = require('../models/Review');

const { askAI } = require('../utils/openaiClient');
const { generateSpeech } = require('../utils/kokoroTTS');
const cloudinary = require('../config/cloudinary');

// Fallback Demo Data
const DEMO_RECS = [
  {
    _id: '65c000000000000000000001',
    name: 'AURA Studio Pro Noise-Cancelling Headphones',
    title: 'AURA Studio Pro Noise-Cancelling Headphones',
    slug: 'aura-studio-pro-noise-cancelling-headphones',
    price: 249.99,
    category: { name: 'Audio & Wearables' },
    ratingsAverage: 4.9,
    ratingsCount: 38,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    ],
    aiGenerated: true,
    description:
      'Adaptive spatial audio, 40-hour battery life, active noise cancellation.',
  },
  {
    _id: '65c000000000000000000002',
    name: 'AURA Cyber Vision AR Smart Glasses',
    title: 'AURA Cyber Vision AR Smart Glasses',
    slug: 'aura-cyber-vision-ar-smart-glasses',
    price: 499.99,
    category: { name: 'AR & Cyberwear' },
    ratingsAverage: 4.8,
    ratingsCount: 22,
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
    ],
    aiGenerated: true,
    description:
      'Ultra-lightweight augmented reality smart glasses with heads-up display.',
  },
];

// Helper: Ensure directory exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper: Safely delete single or multiple local files (retry once agar Windows file-lock ho)
const safeUnlink = (filePaths) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  paths.forEach((filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (retryErr) {
            console.error(`Still failed to delete: ${filePath}`, retryErr.message);
          }
        }, 1000);
      }
    }
  });
};

// Helper: ffprobe se audio file ki actual duration (seconds mein) nikalo
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

/**
 * @desc    Generate AI E-commerce Marketing Content
 * @route   POST /api/ai/content-studio/:productId
 */
const generateContentStudio = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      'category',
      'name'
    );

    if (product) {
      const systemPrompt =
        'You are an expert E-Commerce Copywriter and SEO Specialist. Return JSON only: { "title": "...", "description": "...", "tags": ["..."], "targetAudience": "...", "pricingAdvice": "..." }';
      const userPrompt = `Product Name: ${product.name}, Description: ${product.description}, Price: ₹${product.price}`;

      const result = await askAI(systemPrompt, userPrompt, { json: true });
      return res.json(result);
    }
  } catch (err) {
    console.error('Content Studio error:', err);
  }

  return res.json({
    title: 'AURA Studio Pro Noise-Cancelling Headphones',
    description:
      'Experience next-level audio immersion with active spatial noise cancellation, custom tuned drivers, and long battery life.',
    tags: [
      'audio',
      'spatial-sound',
      'noise-cancelling',
      'headphones',
      'premium-tech',
    ],
    targetAudience: 'Audiophiles, Remote Professionals & Travelers',
    pricingAdvice: 'Consider a limited-time launch discount or bundle offer.',
  });
});

/**
 * @desc    Get AI Product Recommendations
 * @route   GET /api/ai/recommendations
 */
const getRecommendations = asyncHandler(async (req, res) => {
  try {
    const candidates = await Product.find({
      isActive: true,
      isApproved: true,
    })
      .sort('-ratingsAverage -ratingsCount')
      .limit(10);

    if (candidates && candidates.length > 0) {
      return res.json(candidates);
    }
  } catch (err) {
    console.error('Recommendations error:', err);
  }

  return res.json(DEMO_RECS);
});

/**
 * @desc    Summarize Product Reviews via AI
 * @route   GET /api/ai/review-summary/:productId
 */
const getReviewSummary = asyncHandler(async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    }).select('rating comment');

    if (reviews && reviews.length > 0) {
      const systemPrompt =
        'Summarize customer reviews. Return JSON: { "summary": "...", "pros": ["..."], "cons": ["..."], "sentiment": "Positive", "sentimentScore": "92%" }';
      const userPrompt = reviews
        .map((r) => `Rating: ${r.rating}/5 - "${r.comment}"`)
        .join('\n');

      const result = await askAI(systemPrompt, userPrompt, { json: true });
      return res.json(result);
    }
  } catch (err) {
    console.error('Review summary error:', err);
  }

  return res.json({
    summary:
      'Customers generally report a positive experience with this product.',
    pros: [
      'Good overall product quality',
      'Useful features',
      'Positive customer experience',
    ],
    cons: [
      'May be more expensive than basic alternatives',
      'Some features may require initial setup',
    ],
    sentiment: 'Positive',
    sentimentScore: '94%',
  });
});

/**
 * @desc    Get Sales Analytics Insights
 * @route   GET /api/ai/sales-insights
 */
const getSalesInsights = asyncHandler(async (req, res) => {
  try {
    const Order = require('../models/Order');

    const sellerId = req.user.id;

    const products = await Product.find({ seller: sellerId });

    const orders = await Order.find({ 'orderItems.seller': sellerId });

    const productStats = {};
    products.forEach((p) => {
      productStats[p._id.toString()] = { name: p.name, unitsSold: 0, revenue: 0 };
    });

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.seller.toString() === sellerId) {
          const key = item.product.toString();
          if (productStats[key]) {
            productStats[key].unitsSold += item.quantity;
            productStats[key].revenue += item.quantity * item.price;
          }
        }
      });
    });

    const sortedProducts = Object.values(productStats).sort((a, b) => b.unitsSold - a.unitsSold);
    const topPerformers = sortedProducts.slice(0, 3).map((p) => p.name);
    const lowStockCount = products.filter((p) => p.stock <= 5).length;
    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalUnits = sortedProducts.reduce((sum, p) => sum + p.unitsSold, 0);

    if (products.length === 0) {
      return res.json({
        summary: 'You have no products listed yet. Add products to start seeing sales insights.',
        topPerformers: [],
        recommendations: ['Add your first product to get started.'],
        trend: 'No data yet',
      });
    }

    try {
      const systemPrompt = `You are an e-commerce sales analyst. Based on the seller's real data given, return JSON only: { "summary": "...", "recommendations": ["...", "...", "..."] }`;
      const userPrompt = `Seller has ${products.length} products. Total units sold: ${totalUnits}. Total revenue: ₹${totalRevenue.toFixed(2)}. Top performing products: ${topPerformers.join(', ') || 'none yet'}. Products with low stock (≤5 units): ${lowStockCount}.`;

      const aiResult = await askAI(systemPrompt, userPrompt, { json: true });

      return res.json({
        summary: aiResult.summary,
        topPerformers,
        recommendations: aiResult.recommendations,
        trend: totalUnits > 0 ? 'Active sales' : 'No sales yet',
        totalRevenue,
        totalUnits,
        lowStockCount,
      });
    } catch (groqErr) {
      return res.json({
        summary: `You've sold ${totalUnits} units across ${products.length} products, generating ₹${totalRevenue.toFixed(2)} in revenue.`,
        topPerformers,
        recommendations: [
          lowStockCount > 0 ? `${lowStockCount} product(s) are running low on stock — consider restocking.` : 'Stock levels look healthy.',
          'Use AI Content Studio to improve product descriptions for better conversion.',
          totalUnits === 0 ? 'Generate a promo video to attract your first customers.' : 'Keep engaging customers with fresh promotional content.',
        ],
        trend: totalUnits > 0 ? 'Active sales' : 'No sales yet',
        totalRevenue,
        totalUnits,
        lowStockCount,
      });
    }
  } catch (err) {
    console.error('Sales insights error:', err);
    res.status(500).json({ message: 'Could not generate sales insights' });
  }
});

/**
 * @desc    Generate Video Script
 * @route   POST /api/ai/generate-script
 */
const generateVideoScript = asyncHandler(async (req, res) => {
  res.json({
    voiceoverScript:
      'Introducing the AURA Studio Pro Noise-Cancelling Headphones. Engineered with adaptive spatial audio and advanced acoustic tuning, experience clear sound wherever you go. Upgrade your sound today at AURA AI.',
    scenes: [
      {
        scene: 1,
        visual:
          'Product hero shot rotating in a dark studio with cinematic lighting',
        duration: '5s',
      },
      {
        scene: 2,
        visual: 'Close-up of product features and premium build quality',
        duration: '5s',
      },
      {
        scene: 3,
        visual: 'Call-to-action banner with product offer',
        duration: '5s',
      },
    ],
  });
});

/**
 * @desc    Synthesize Speech Audio via Kokoro TTS & Upload to Cloudinary
 * @route   POST /api/ai/generate-voice
 */
const generateVideoVoice = asyncHandler(async (req, res) => {
  const text =
    req.body?.text ||
    'Introducing our premium product. Experience quality, performance and modern design. Upgrade your experience today.';

  const tempDir = path.join(__dirname, '../temp');
  ensureDirExists(tempDir);

  const audioPath = path.join(tempDir, `voice-${Date.now()}.wav`);

  try {
    await generateSpeech(text, audioPath);

    const uploadResult = await cloudinary.uploader.upload(audioPath, {
      resource_type: 'video',
      folder: 'ecommerce/promotional-audio',
    });

    return res.json({
      success: true,
      audioUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'Voice synthesized successfully',
    });
  } catch (error) {
    console.error('Voice generation failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Voice generation failed',
    });
  } finally {
    safeUnlink(audioPath);
  }
});

/**
 * @desc    Generate Promo Video from Product Images + TTS (audio-synced duration)
 * @route   POST /api/ai/generate-promo-video/:productId
 */
const generatePromoVideo = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (!Array.isArray(product.images) || product.images.length === 0) {
    res.status(400);
    throw new Error('Product needs at least one image to generate a video');
  }

  const selectedImages = product.images.filter(Boolean).slice(0, 5);
  if (selectedImages.length === 0) {
    res.status(400);
    throw new Error('Product needs at least one valid image to generate a video');
  }

  const tempDir = path.join(__dirname, '../temp');
  ensureDirExists(tempDir);

  const timestamp = Date.now();
  const createdFiles = [];

  const audioPath = path.join(tempDir, `promo-voice-${timestamp}.wav`);
  const concatFile = path.join(tempDir, `promo-concat-${timestamp}.txt`);
  const silentVideoPath = path.join(tempDir, `promo-silent-${timestamp}.mp4`);
  const outputPath = path.join(tempDir, `promo-final-${timestamp}.mp4`);

  createdFiles.push(audioPath, concatFile, silentVideoPath, outputPath);

  try {
    // 1. Voiceover pehle banao
    const voiceoverScript = `Introducing ${product.name}. ${product.description}. Get yours today and experience premium quality with AURA AI.`;
    await generateSpeech(voiceoverScript, audioPath);

    // 2. Audio ki asli duration naapo — yehi video ki total length banegi
    const audioDuration = await getAudioDuration(audioPath);

    // Har image ka duration = audio duration / total images (min 2s per image)
    const perImageDuration = Math.max(2, audioDuration / selectedImages.length);

    const segmentFiles = [];

    // 3. Har image download karke uska video-segment banao (duration ab audio-synced hai)
    for (let i = 0; i < selectedImages.length; i++) {
      const imagePath = path.join(tempDir, `promo-image-${timestamp}-${i}.jpg`);
      const segmentPath = path.join(tempDir, `promo-segment-${timestamp}-${i}.mp4`);

      createdFiles.push(imagePath, segmentPath);

      const imageResponse = await axios.get(selectedImages[i], {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      fs.writeFileSync(imagePath, imageResponse.data);

      await new Promise((resolve, reject) => {
        ffmpeg(imagePath)
          .inputOptions(['-loop 1'])
          .outputOptions([
            `-t ${perImageDuration.toFixed(2)}`,
            '-r 30',
            '-pix_fmt yuv420p',
            '-vf scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2',
            '-movflags +faststart',
          ])
          .videoCodec('libx264')
          .noAudio()
          .on('error', reject)
          .on('end', resolve)
          .save(segmentPath);
      });

      segmentFiles.push(segmentPath);
    }

    // 4. Concat file likho
    const concatContent = segmentFiles
      .map((file) => `file '${file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
      .join('\n');
    fs.writeFileSync(concatFile, concatContent);

    // 5. Saare segments merge karo
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy', '-movflags +faststart'])
        .on('error', reject)
        .on('end', resolve)
        .save(silentVideoPath);
    });

    // 6. Silent video + voiceover merge karo
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(silentVideoPath)
        .input(audioPath)
        .outputOptions([
          '-map 0:v:0',
          '-map 1:a:0',
          '-c:v copy',
          '-c:a aac',
          '-b:a 128k',
          '-shortest',
          '-movflags +faststart',
        ])
        .on('error', reject)
        .on('end', resolve)
        .save(outputPath);
    });

    // 7. Cloudinary pe final video upload karo
    const uploadResult = await cloudinary.uploader.upload(outputPath, {
      resource_type: 'video',
      folder: 'ecommerce/promotional-videos',
      public_id: `product-${product._id}-${timestamp}`,
    });
    product.promoVideo = {
  url: uploadResult.secure_url,
  generatedAt: new Date(),
};

await product.save();

    return res.json({
      success: true,
      videoUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      productId: product._id,
      productName: product.name,
      imageCount: selectedImages.length,
      audioDuration: `${audioDuration.toFixed(1)}s`,
      videoDuration: `${(perImageDuration * selectedImages.length).toFixed(1)}s`,
      voiceover: true,
      message: 'Promotional video generated successfully',
    });
  } catch (error) {
    console.error('Video generation failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Video generation failed',
    });
  } finally {
    safeUnlink(createdFiles);
  }
});

module.exports = {
  generateContentStudio,
  generateVideoScript,
  generateVideoVoice,
  generatePromoVideo,
  getRecommendations,
  getReviewSummary,
  getSalesInsights,
};