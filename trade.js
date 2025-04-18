const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const logger = require('../config/logger');

// Get trades
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { portfolioId, status, limit } = req.query;
        const query = { userId: req.user.id };
        
        if (portfolioId) query.portfolioId = portfolioId;
        if (status) query.status = status;
        
        const trades = await Trade.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) || 50);
        
        res.json(trades);
    } catch (error) {
        logger.error('Get trades error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Create trade
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { portfolioId, symbol, type, side, quantity, price, stopPrice, limitPrice } = req.body;
        
        // Validate portfolio
        const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: req.user.id });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        // Create trade
        const trade = new Trade({
            userId: req.user.id,
            portfolioId,
            symbol,
            type,
            side,
            quantity,
            price,
            stopPrice,
            limitPrice
        });
        
        await trade.save();
        
        logger.info('Trade created', { 
            userId: req.user.id, 
            portfolioId, 
            symbol, 
            type, 
            side, 
            quantity 
        });
        
        // For demo purposes, we'll simulate trade execution
        if (type === 'market') {
            trade.status = 'filled';
            trade.executedPrice = price;
            trade.executedQuantity = quantity;
            trade.executedAt = new Date();
            
            // Update portfolio
            if (side === 'buy') {
                const position = portfolio.positions.find(p => p.symbol === symbol);
                if (position) {
                    position.quantity += quantity;
                    position.entryPrice = (position.entryPrice * (position.quantity - quantity) + price * quantity) / position.quantity;
                    position.currentPrice = price;
                    position.value = position.quantity * price;
                    position.unrealizedPL = position.value - (position.entryPrice * position.quantity);
                    position.unrealizedPLPercent = (position.unrealizedPL / (position.entryPrice * position.quantity)) * 100;
                } else {
                    portfolio.positions.push({
                        symbol,
                        quantity,
                        entryPrice: price,
                        currentPrice: price,
                        value: quantity * price,
                        unrealizedPL: 0,
                        unrealizedPLPercent: 0
                    });
                }
                
                portfolio.balance -= quantity * price;
            } else {
                const position = portfolio.positions.find(p => p.symbol === symbol);
                if (position) {
                    const realizedPL = (price - position.entryPrice) * quantity;
                    trade.realizedPL = realizedPL;
                    
                    position.quantity -= quantity;
                    if (position.quantity <= 0) {
                        portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
                    } else {
                        position.value = position.quantity * price;
                        position.currentPrice = price;
                        position.unrealizedPL = position.value - (position.entryPrice * position.quantity);
                        position.unrealizedPLPercent = (position.unrealizedPL / (position.entryPrice * position.quantity)) * 100;
                    }
                    
                    portfolio.balance += quantity * price;
                } else {
                    return res.status(400).json({ message: 'No position to sell' });
                }
            }
            
            portfolio.equity = portfolio.balance + portfolio.positions.reduce((sum, pos) => sum + pos.value, 0);
            
            await portfolio.save();
            await trade.save();
            
            logger.info('Trade executed', { 
                userId: req.user.id, 
                tradeId: trade._id, 
                status: 'filled' 
            });
        }
        
        res.status(201).json(trade);
    } catch (error) {
        logger.error('Create trade error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel trade
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const trade = await Trade.findOne({ _id: req.params.id, userId: req.user.id });
        if (!trade) {
            return res.status(404).json({ message: 'Trade not found' });
        }
        
        if (trade.status !== 'open') {
            return res.status(400).json({ message: 'Trade cannot be canceled' });
        }
        
        trade.status = 'canceled';
        await trade.save();
        
        logger.info('Trade canceled', { userId: req.user.id, tradeId: trade._id });
        
        res.json(trade);
    } catch (error) {
        logger.error('Cancel trade error', { error: error.message, userId: req.user.id, tradeId: req.params.id });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
