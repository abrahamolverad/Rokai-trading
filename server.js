const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Rokai Trading Platform is live');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
