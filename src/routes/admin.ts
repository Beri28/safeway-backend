import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const User = mongoose.models.User;
const Bus = mongoose.models.Bus;
const Booking = mongoose.models.Booking;

// @route   GET /api/admin/stats
// @desc    Get system statistics (users, buses, bookings)
// @access  Admin
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const [userCount, busCount, bookingCount] = await Promise.all([
      User.countDocuments(),
      Bus.countDocuments(),
      Booking.countDocuments(),
    ]);
    return res.json({ userCount, busCount, bookingCount });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics/bookings-per-day
// @desc    Get bookings per day for the last 30 days
// @access  Admin
router.get('/analytics/bookings-per-day', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const data = await Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      } },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/export/users
// @desc    Export all users as CSV
// @access  Admin
router.get('/export/users', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    const csv = [
      'id,name,email,role',
      ...users.map(u => `${u._id},${u.name},${u.email},${u.role}`)
    ].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/export/bookings
// @desc    Export all bookings as CSV
// @access  Admin
router.get('/export/bookings', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookings = await Booking.find().populate('userId busId');
    const csv = [
      'id,userId,userName,busId,seat,status,createdAt',
      ...bookings.map(b => `${b._id},${b.userId?._id || ''},${b.userId?.name || ''},${b.busId?._id || ''},${b.seat},${b.status},${b.createdAt.toISOString()}`)
    ].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('bookings.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
