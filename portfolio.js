const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const logger = require('../config/logger');

// Get all portfolios for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const portfolios = await Portfolio.find({ userId: req.user.id });
        res.json(portfolios);
    } catch (error) {
        logger.error('Get portfolios error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Get portfolio by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user.id });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        res.json(portfolio);
    } catch (error) {
        logger.error('Get portfolio error', { error: error.message, userId: req.user.id, portfolioId: req.params.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new portfolio
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, balance } = req.body;
        
        const portfolio = new Portfolio({
            userId: req.user.id,
            name,
            balance: balance || 100000,
            equity: balance || 100000
        });
        
        await portfolio.save();
        
        logger.info('Portfolio created', { userId: req.user.id, portfolioId: portfolio._id });
        
        res.status(201).json(portfolio);
    } catch (error) {
        logger.error('Create portfolio error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Update portfolio
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user.id });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        if (name) portfolio.name = name;
        
        await portfolio.save();
        
        logger.info('Portfolio updated', { userId: req.user.id, portfolioId: portfolio._id });
        
        res.json(portfolio);
    } catch (error) {
        logger.error('Update portfolio error', { error: error.message, userId: req.user.id, portfolioId: req.params.id });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
