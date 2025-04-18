const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { validateRequest } = require('../middleware/auth');
const logger = require('../config/logger');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName
        });
        
        await user.save();
        
        // Create default portfolio
        const portfolio = new Portfolio({
            userId: user._id,
            name: 'Main Account'
        });
        
        await portfolio.save();
        
        // Generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION || '1d' });
        
        logger.info('New user registered', { username: user.username, userId: user._id });
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Validate password
        const validPassword = await user.comparePassword(password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION || '1d' });
        
        logger.info('User logged in', { username: user.username, userId: user._id });
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        logger.error('Login error', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
