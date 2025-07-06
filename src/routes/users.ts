
import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Protected
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Protected
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update here
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ message: 'Invalid update', error: errorMsg });
  }
});

// @route   GET /api/users
// @desc    List all users (admin only)
// @access  Admin
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/users/:id/role
// @desc    Change user role (admin only)
// @access  Admin
router.patch('/:id/role', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ message: 'Invalid update', error: errorMsg });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin only)
// @access  Admin
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
