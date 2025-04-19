const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// API Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const portfolioRoutes = require('./routes/portfolio');
const tradeRoutes = require('./routes/trade');
const predictionRoutes = require('./routes/prediction');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/prediction', predictionRoutes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle 404 - Send index.html for any other routes (for SPA routing)
app.get('*', (req, res) => {
  // Only send index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', mongoose.connection.host);
    
    // Initialize database with sample data if needed
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { initializeDatabase } = require('./utils/db-init');
        initializeDatabase();
      } catch (error) {
        console.error('Error initializing database:', error.message);
      }
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;
