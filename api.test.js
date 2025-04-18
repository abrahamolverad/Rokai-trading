const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const Prediction = require('../models/Prediction');

// Test user credentials
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken;
let userId;
let portfolioId;

// Connect to test database before tests
beforeAll(async () => {
  // Use a test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_trading_platform_test';
  await mongoose.connect(mongoUri);
  
  // Clear test database
  await User.deleteMany({});
  await Portfolio.deleteMany({});
  await Trade.deleteMany({});
  await Prediction.deleteMany({});
});

// Disconnect after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication API', () => {
  test('Should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(testUser.username);
    
    // Save user ID for later tests
    userId = res.body.user.id;
  });
  
  test('Should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    
    // Save token for authenticated requests
    authToken = res.body.token;
  });
  
  test('Should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(400);
  });
});

describe('User API', () => {
  test('Should get user profile', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).toHaveProperty('email', testUser.email);
  });
  
  test('Should update user settings', async () => {
    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        darkMode: true,
        notifications: false,
        riskLevel: 'aggressive'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('darkMode', true);
    expect(res.body).toHaveProperty('notifications', false);
    expect(res.body).toHaveProperty('riskLevel', 'aggressive');
  });
});

describe('Portfolio API', () => {
  test('Should get user portfolios', async () => {
    const res = await request(app)
      .get('/api/portfolios')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // There should be at least one portfolio (created during registration)
    expect(res.body.length).toBeGreaterThan(0);
    
    // Save portfolio ID for later tests
    portfolioId = res.body[0]._id;
  });
  
  test('Should create a new portfolio', async () => {
    const res = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Portfolio',
        balance: 50000
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Test Portfolio');
    expect(res.body).toHaveProperty('balance', 50000);
    expect(res.body).toHaveProperty('equity', 50000);
  });
  
  test('Should get portfolio by ID', async () => {
    const res = await request(app)
      .get(`/api/portfolios/${portfolioId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', portfolioId);
  });
});

describe('Trade API', () => {
  test('Should create a market buy trade', async () => {
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        portfolioId,
        symbol: 'AAPL',
        type: 'market',
        side: 'buy',
        quantity: 10,
        price: 175.50
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('symbol', 'AAPL');
    expect(res.body).toHaveProperty('type', 'market');
    expect(res.body).toHaveProperty('side', 'buy');
    expect(res.body).toHaveProperty('quantity', 10);
    expect(res.body).toHaveProperty('status', 'filled');
  });
  
  test('Should get user trades', async () => {
    const res = await request(app)
      .get('/api/trades')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  test('Should create a market sell trade', async () => {
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        portfolioId,
        symbol: 'AAPL',
        type: 'market',
        side: 'sell',
        quantity: 5,
        price: 180.25
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('symbol', 'AAPL');
    expect(res.body).toHaveProperty('type', 'market');
    expect(res.body).toHaveProperty('side', 'sell');
    expect(res.body).toHaveProperty('quantity', 5);
    expect(res.body).toHaveProperty('status', 'filled');
    expect(res.body).toHaveProperty('realizedPL');
  });
});

describe('Prediction API', () => {
  // Create a test prediction
  beforeAll(async () => {
    const prediction = new Prediction({
      symbol: 'AAPL',
      signal: 'buy',
      currentPrice: 175.50,
      targetPrice: 195.50,
      potential: 11.4,
      timeframe: '5 days',
      confidence: 85,
      model: 'ensemble',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    });
    
    await prediction.save();
  });
  
  test('Should get predictions', async () => {
    const res = await request(app)
      .get('/api/predictions')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('symbol', 'AAPL');
    expect(res.body[0]).toHaveProperty('signal', 'buy');
  });
  
  test('Should filter predictions by symbol', async () => {
    const res = await request(app)
      .get('/api/predictions?symbol=AAPL')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('symbol', 'AAPL');
  });
});

describe('Market Data API', () => {
  test('Should get market quotes', async () => {
    const res = await request(app)
      .get('/api/market/quotes?symbols=AAPL,MSFT,GOOGL')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0]).toHaveProperty('symbol');
    expect(res.body[0]).toHaveProperty('price');
    expect(res.body[0]).toHaveProperty('change');
  });
  
  test('Should get market history', async () => {
    const res = await request(app)
      .get('/api/market/history?symbol=AAPL&interval=1d&range=1mo')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('date');
    expect(res.body[0]).toHaveProperty('open');
    expect(res.body[0]).toHaveProperty('high');
    expect(res.body[0]).toHaveProperty('low');
    expect(res.body[0]).toHaveProperty('close');
  });
});

describe('Analytics API', () => {
  test('Should get performance analytics', async () => {
    const res = await request(app)
      .get(`/api/analytics/performance?portfolioId=${portfolioId}&period=month`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('date');
    expect(res.body[0]).toHaveProperty('value');
  });
  
  test('Should get trade analytics', async () => {
    const res = await request(app)
      .get(`/api/analytics/trades?portfolioId=${portfolioId}&period=month`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalTrades');
    expect(res.body).toHaveProperty('winningTrades');
    expect(res.body).toHaveProperty('losingTrades');
    expect(res.body).toHaveProperty('winRate');
    expect(res.body).toHaveProperty('profitFactor');
  });
});
