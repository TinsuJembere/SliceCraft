import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import pizzaRoutes from './routes/pizza.js';
import subscribeRoutes from './routes/subscribe.js';
import passport from 'passport';
import session from 'express-session';
import './config/passport.js'; // Passport configuration


// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://slicecraft-frontend-1.onrender.com', 'https://slice-craft-f1dd41c51-tinsaes-projects-7b3f74ab.vercel.app/'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_default_secret_for_session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pizzas', pizzaRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/subscribe', subscribeRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


// MongoDB Connection
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is not set');

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB Connected Successfully');
      console.log('Connection state:', mongoose.connection.readyState);
    })
    .catch(err => {
      console.error('MongoDB connection error details:');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      if (err.message.includes('ENOTFOUND')) {
        console.error('DNS lookup failed. Please check your internet connection and MongoDB Atlas cluster name.');
      } else if (err.message.includes('Authentication failed')) {
        console.error('Authentication failed. Please check your username and password.');
      } else if (err.message.includes('timed out')) {
        console.error('Connection timed out. Please check your network connection and MongoDB Atlas IP whitelist.');
      }
      console.error('Full error:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Initial connection attempt
connectWithRetry();

// Add connection event listeners
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Handle application shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Attempt to reconnect
  setTimeout(connectWithRetry, 5000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Attempt to reconnect
  setTimeout(connectWithRetry, 5000);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 
