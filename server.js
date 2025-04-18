const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Try to require logger, fallback to console if missing
let logger;
try {
  logger = require('./config/logger');
} catch (err) {
  logger = console;
  console.warn('[WARN] logger.js not found, using console instead');
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hawk-aitrading';
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Middleware
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream || { write: msg => logger.info(msg.trim()) } }));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api/', apiLimiter);

// Serve frontend (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Connect to database
connectDB();

// Optional utilities
try {
  const initializeDatabase = require('./utils/db-init');
  initializeDatabase();
} catch (e) {
  logger.info('Skipping db-init.js');
}

try {
  const initMaintenanceTasks = require('./utils/maintenance');
  initMaintenanceTasks();
} catch (e) {
  logger.info('Skipping maintenance.js');
}

// Register routes if present
const routeFiles = ['auth', 'user', 'portfolio', 'trade', 'prediction', 'market', 'analytics', 'health'];
routeFiles.forEach(route => {
  try {
    app.use(`/api/${route}`, require(`./routes/${route}`));
    logger.info(`✅ Loaded route: /api/${route}`);
  } catch (e) {
    logger.warn(`⚠️ Route /api/${route} not found, skipping.`);
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Rokai Trading Platform is live');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`✅ Server is running on port ${PORT}`);
});

