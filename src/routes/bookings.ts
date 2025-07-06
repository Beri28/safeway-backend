import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Booking Schema
const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  seat: { type: Number, required: true },
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
  createdAt: { type: Date, default: Date.now },
});
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// Bus Schema (for seat update)
// const busSchema = new mongoose.Schema({
//   agency: String,
//   from: String,
//   to: String,
//   departure: Date,
//   arrival: Date,
//   seatsTotal: Number,
//   seatsBooked: Number,
//   seatNumbersBooked: [Number],
//   price: Number,
// });
// const Bus = mongoose.models.Bus || mongoose.model('Bus', busSchema);

// @route   POST /api/bookings
// @desc    Book a seat
// @access  Protected (for demo, no auth middleware)
import { Request, Response, NextFunction } from 'express';
import { BusRoutes } from './busRoutes';

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { busId, seat,userId } = req.body;
  console.log(req.body)
  // @ts-ignore
  // const userId = req.user.id;
  try {
    for(let i=0;i<seat.length;i++){
      const existing = await Booking.findOne({ busId, seat:seat[i] });
      if (existing) return res.status(400).json({ message: `Seat ${seat[i]} already booked.Choose different seat` });
    }
    let bookings:any[]=[]
    for(let i=0;i<seat.length;i++){
      let booking = await Booking.create({ userId, busId, seat:seat[i], status: 'booked' });
      booking = await Booking.find({ userId,busId,seat:[seat[i]] }).populate(['busId','userId']);
      // console.log("Booking:",booking)
      // Update bus seat count
      await BusRoutes.findByIdAndUpdate(busId, { $inc: { seatsBooked: 1 },$push: { seatNumbersBooked: seat[i] } });
      // await Bus.findByIdAndUpdate(busId, { $push: { seatNumbersBooked: s } });
      bookings.push(booking)
    }
    console.log(bookings[0])
    res.status(201).json(bookings[0]);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/user/:userId
// @desc    Get bookings for a user
// @access  Protected (for demo, no auth middleware)
router.get('/user/:userId', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // Only allow user to see their own bookings, or admin
  // @ts-ignore
  if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).populate(['busId','userId']);
    // const bookings2=[...bookings.map((b)=>{return {...b,user:b.userId,bus:b.busId}})]
    res.json(bookings);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Protected
router.patch('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // @ts-ignore
    if (req.user.role !== 'admin' && req.user.id !== booking.userId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    booking.status = 'cancelled';
    await booking.save();
    // Optionally decrement bus seat count if needed
    await BusRoutes.findByIdAndUpdate(booking.busId, { $inc: { seatsBooked: -1 } });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (admin only)
// @access  Admin
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookings = await Booking.find().populate('busId userId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Protected
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const booking = await Booking.findById(req.params.id).populate(['busId' ,'userId']);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // @ts-ignore
    if (req.user.role !== 'admin' && req.user.id !== booking.userId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/receipt/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    console.log(req.params)
    const booking = await Booking.findById(req.params.id).populate(['busId', 'userId']);
    console.log(booking)
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
