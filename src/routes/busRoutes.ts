
import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Routes Schema
const routesSchema = new mongoose.Schema({
  agency: String,
  from: String,
  busType:{type:String,enum:['VIP','Standard']},
  busNumber:String,
  to: String,
  departureTime: String,
  date: Date,
  seatsTotal: Number,
  seatsBooked: Number,
  seatNumbersBooked: [Number],
  price: Number,
  features:[String]
});
export const BusRoutes = mongoose.models.Bus || mongoose.model('Route', routesSchema);

// @route   GET /api/buses
// @desc    Get all buses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const buses = await BusRoutes.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/buses/:id
// @desc    Get bus by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bus = await BusRoutes.findById(req.params.id);
    if (!bus) {
      res.status(404).json({ message: 'Bus not found' });
      return;
    }
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   POST /api/buses
// @desc    Create a new bus (admin only)
// @access  Admin
// router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(req.body)
    const bus = await BusRoutes.create(req.body);
    console.log(bus)
    res.status(201).json(bus);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ message: 'Invalid bus data', error: errorMsg });
  }
});

// @route   PUT /api/buses/:id
// @desc    Update bus details (admin only)
// @access  Admin
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const bus = await BusRoutes.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ message: 'Invalid update', error: errorMsg });
  }
});

// @route   DELETE /api/buses/:id
// @desc    Delete a bus (admin only)
// @access  Admin
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const bus = await BusRoutes.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Bus deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/buses/search
// @desc    Search buses by route and date
// @access  Public
router.post('/search/route', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { from, to, date } = req.body;
  console.log(from, to, date)
  const query: Record<string, any> = {};
  if (from) query['from'] = from;
  if (to) query['to'] = to;
  if (date) {
    // Find buses departing on the same day
    const start = new Date(date as string);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    // query['departure'] = { $gte: start, $lt: end };
  }
  try {
    const buses = await BusRoutes.find(query);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
