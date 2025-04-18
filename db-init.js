const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const logger = require('../config/logger');

// Sample data for initializing the database
const sampleData = {
  users: [
    {
      username: 'demo_user',
      email: 'demo@rokai-trading.com',
      password: 'Password123!',
      firstName: 'Demo',
      lastName: 'User',
      settings: {
        darkMode: true,
        notifications: true,
        riskLevel: 'medium'
      }
    }
  ],
  portfolios: [
    {
      name: 'Main Portfolio',
      balance: 75000,
      equity: 125750.50,
      positions: [
        {
          symbol: 'AAPL',
          quantity: 50,
          entryPrice: 150.25,
          currentPrice: 175.50,
          value: 8775,
          unrealizedPL: 1262.50,
          unrealizedPLPercent: 16.8
        },
        {
          symbol: 'MSFT',
          quantity: 25,
          entryPrice: 270.50,
          currentPrice: 280.30,
          value: 7007.50,
          unrealizedPL: 245.00,
          unrealizedPLPercent: 3.6
        },
        {
          symbol: 'GOOGL',
          quantity: 15,
          entryPrice: 120.75,
          currentPrice: 115.20,
          value: 1728,
          unrealizedPL: -82.50,
          unrealizedPLPercent: -4.6
        },
        {
          symbol: 'AMZN',
          quantity: 10,
          entryPrice: 165.30,
          currentPrice: 178.25,
          value: 1782.50,
          unrealizedPL: 129.50,
          unrealizedPLPercent: 7.8
        }
      ],
      performance: {
        totalReturn: 25750.50,
        totalReturnPercent: 25.75,
        dailyReturn: 1250.25,
        dailyReturnPercent: 1.25
      }
    }
  ],
  trades: [
    {
      symbol: 'AAPL',
      type: 'market',
      side: 'buy',
      quantity: 10,
      price: 175.50,
      status: 'filled',
      executedPrice: 175.50,
      executedQuantity: 10,
      commission: 0,
      executedAt: new Date()
    },
    {
      symbol: 'MSFT',
      type: 'limit',
      side: 'buy',
      quantity: 5,
      price: 280.00,
      status: 'filled',
      executedPrice: 280.00,
      executedQuantity: 5,
      commission: 0,
      executedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      symbol: 'GOOGL',
      type: 'market',
      side: 'sell',
      quantity: 8,
      price: 115.20,
      status: 'filled',
      executedPrice: 115.20,
      executedQuantity: 8,
      commission: 0,
      realizedPL: -44.40,
      executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      symbol: 'TSLA',
      type: 'stop',
      side: 'sell',
      quantity: 12,
      price: 225.00,
      stopPrice: 225.00,
      status: 'canceled',
      executedAt: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
    }
  ],
  predictions: [
    {
      symbol: 'NVDA',
      signal: 'buy',
      currentPrice: 450.25,
      targetPrice: 495.30,
      potential: 10.0,
      timeframe: '5 days',
      confidence: 85,
      model: 'ensemble',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'active'
    },
    {
      symbol: 'TSLA',
      signal: 'sell',
      currentPrice: 225.50,
      targetPrice: 202.95,
      potential: 10.0,
      timeframe: '3 days',
      confidence: 78,
      model: 'lstm',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'active'
    },
    {
      symbol: 'AAPL',
      signal: 'buy',
      currentPrice: 175.50,
      targetPrice: 189.54,
      potential: 8.0,
      timeframe: '7 days',
      confidence: 82,
      model: 'xgboost',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active'
    },
    {
      symbol: 'META',
      signal: 'hold',
      currentPrice: 485.75,
      targetPrice: 490.60,
      potential: 1.0,
      timeframe: '2 days',
      confidence: 65,
      model: 'random_forest',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: 'active'
    },
    {
      symbol: 'MSFT',
      signal: 'buy',
      currentPrice: 280.30,
      targetPrice: 299.92,
      potential: 7.0,
      timeframe: '10 days',
      confidence: 79,
      model: 'transformer',
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'active'
    }
  ]
};

// Function to initialize database with sample data
const initializeDatabase = async () => {
  try {
    const User = require('../models/User');
    const Portfolio = require('../models/Portfolio');
    const Trade = require('../models/Trade');
    
    // Check if we already have users
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info('Database already initialized, skipping sample data creation');
      return;
    }
    
    logger.info('Initializing database with sample data');
    
    // Create demo user
    const user = new User(sampleData.users[0]);
    await user.save();
    logger.info(`Created demo user: ${user.username}`);
    
    // Create portfolio for the user
    const portfolioData = {
      ...sampleData.portfolios[0],
      userId: user._id
    };
    const portfolio = new Portfolio(portfolioData);
    await portfolio.save();
    logger.info(`Created portfolio: ${portfolio.name}`);
    
    // Create trades for the user
    for (const tradeData of sampleData.trades) {
      const trade = new Trade({
        ...tradeData,
        userId: user._id,
        portfolioId: portfolio._id
      });
      await trade.save();
    }
    logger.info(`Created ${sampleData.trades.length} trades`);
    
    // Create predictions
    for (const predictionData of sampleData.predictions) {
      const prediction = new Prediction(predictionData);
      await prediction.save();
    }
    logger.info(`Created ${sampleData.predictions.length} predictions`);
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Error initializing database with sample data', { error: error.message, stack: error.stack });
  }
};

module.exports = {
  initializeDatabase,
  sampleData
};
