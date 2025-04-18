const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const logger = require('../config/logger');

// Get predictions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { symbol, signal, confidence, limit } = req.query;
        const query = { expiresAt: { $gt: new Date() } };
        
        if (symbol) query.symbol = symbol;
        if (signal) query.signal = signal;
        if (confidence) query.confidence = { $gte: parseInt(confidence) };
        
        const predictions = await Prediction.find(query)
            .sort({ confidence: -1, createdAt: -1 })
            .limit(parseInt(limit) || 20);
        
        res.json(predictions);
    } catch (error) {
        logger.error('Get predictions error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// For demo purposes, we'll add an endpoint to generate predictions
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        // Sample symbols
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'];
        const models = ['lstm', 'xgboost', 'random_forest', 'ensemble', 'transformer'];
        const signals = ['buy', 'sell', 'hold'];
        
        // Clear existing predictions
        await Prediction.deleteMany({});
        
        // Generate new predictions
        const predictions = [];
        
        for (const symbol of symbols) {
            const basePrice = {
                'AAPL': 175.50,
                'MSFT': 280.30,
                'GOOGL': 115.20,
                'AMZN': 178.25,
                'META': 485.75,
                'TSLA': 225.50,
                'NVDA': 450.25
            }[symbol];
            
            const signal = signals[Math.floor(Math.random() * signals.length)];
            const model = models[Math.floor(Math.random() * models.length)];
            const confidence = Math.floor(Math.random() * 30) + 70; // 70-99
            
            let targetPrice;
            let potential;
            
            if (signal === 'buy') {
                // For buy signals, target price is higher
                targetPrice = basePrice * (1 + (Math.random() * 0.1 + 0.05)); // 5-15% higher
                potential = ((targetPrice - basePrice) / basePrice) * 100;
            } else if (signal === 'sell') {
                // For sell signals, target price is lower
                targetPrice = basePrice * (1 - (Math.random() * 0.1 + 0.05)); // 5-15% lower
                potential = ((basePrice - targetPrice) / basePrice) * 100;
            } else {
                // For hold signals, target price is close to current
                targetPrice = basePrice * (1 + (Math.random() * 0.04 - 0.02)); // ±2%
                potential = 0;
            }
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days
            
            const prediction = new Prediction({
                symbol,
                signal,
                currentPrice: basePrice,
                targetPrice: parseFloat(targetPrice.toFixed(2)),
                potential: parseFloat(potential.toFixed(2)),
                timeframe: `${Math.floor(Math.random() * 5) + 1} days`,
                confidence,
                model,
                expiresAt
            });
            
            await prediction.save();
            predictions.push(prediction);
        }
        
        logger.info('Predictions generated', { count: predictions.length });
        
        res.status(201).json({
            message: `Generated ${predictions.length} predictions`,
            predictions
        });
    } catch (error) {
        logger.error('Generate predictions error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
