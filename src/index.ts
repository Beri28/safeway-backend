import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import busRoutes from './routes/busRoutes';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import { connectDB } from './db';


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bus Ticketing System API',
      version: '1.0.0',
      description: 'API documentation for the Bus Ticketing System',
    },
    servers: [
      {
        url: 'http://localhost:' + PORT,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check

// Use routes
// app.use('/*',(req,res)=>{
//   console.log(req.body)
// })
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// TODO: Import and use routes (auth, users, buses, bookings, etc.)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
