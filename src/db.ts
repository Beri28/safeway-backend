import mongoose from 'mongoose';

export function connectDB() {
  const uri = process.env.DATABASE_URL || '';
  if (!uri) throw new Error('DATABASE_URL not set');
  mongoose.connect(uri, { dbName: 'busticketing' })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}
