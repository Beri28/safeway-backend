import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

// Auth middleware: verifies JWT and attaches user to req
export function authenticate(req: Request, res: Response, next: NextFunction):any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log(decoded)
    // @ts-ignore
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// Admin check middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  next();
  // // @ts-ignore
  // if (req.user && req.user.role === 'admin') {
  //   return next();
  // }
  // res.status(403).json({ message: 'Admin access required' });
}

// Optional: Attach user object from DB (for profile routes, etc.)
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  if (req.user && req.user.id) {
    const User = mongoose.models.User;
    // @ts-ignore
    req.dbUser = await User.findById(req.user.id).select('-password');
  }
  next();
}
