import { Router } from 'express';

const router = Router();

// @route   GET /api/health
// @desc    Health check
// @access  Public
router.get('/health', (req, res) => {
  // No DB needed, just a health check
  res.json({ status: 'OK' });
});

export default router;
