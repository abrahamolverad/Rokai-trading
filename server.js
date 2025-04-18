const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import configuration
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { initMaintenanceTasks } = require('./utils/maintenance');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const portfolioRoutes = require('./routes/portfolio');
const tradeRoutes = require('./routes/trade');
const predictionRoutes = require('./routes/prediction');
const marketRoutes = require('./routes/market');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

// Import middleware
const { apiLimiter } = require('./middleware/auth');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
app.use('/api/', apiLimiter);

// Connect to MongoDB
connectDB()
    .then(() => {
        logger.info('MongoDB connected successfully');
        
        // Initialize maintenance tasks after DB connection
        initMaintenanceTasks();
        
        // Initialize database with sample data
        const { initializeDatabase } = require('./utils/db-init');
        initializeDatabase();
    })
    .catch(err => {
        logger.error('MongoDB connection error', { error: err.message });
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/health', healthRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port}`);
});

module.exports = app;
