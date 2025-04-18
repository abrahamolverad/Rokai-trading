const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../config/logger');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        logger.error('Get profile error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        
        await user.save();
        
        logger.info('User profile updated', { userId: user._id });
        
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        });
    } catch (error) {
        logger.error('Update profile error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user settings
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { darkMode, notifications, riskLevel } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.settings.darkMode = darkMode !== undefined ? darkMode : user.settings.darkMode;
        user.settings.notifications = notifications !== undefined ? notifications : user.settings.notifications;
        user.settings.riskLevel = riskLevel || user.settings.riskLevel;
        
        await user.save();
        
        logger.info('User settings updated', { userId: user._id });
        
        res.json(user.settings);
    } catch (error) {
        logger.error('Update settings error', { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
