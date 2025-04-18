const cron = require('node-cron');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const Prediction = require('../models/Prediction');
const fs = require('fs');
const path = require('path');

// Initialize maintenance tasks
const initMaintenanceTasks = () => {
  logger.info('Initializing automated maintenance tasks');
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('Created logs directory');
  }
  
  // Schedule database cleanup - Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running scheduled database cleanup task');
      
      // Clean up expired predictions
      const expiredPredictions = await Prediction.updateMany(
        { expiresAt: { $lt: new Date() }, status: 'active' },
        { $set: { status: 'expired' } }
      );
      
      logger.info(`Marked ${expiredPredictions.modifiedCount} expired predictions`);
      
      // Archive old trades (older than 90 days) - In a production system, this would move data to an archive collection
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // For demo purposes, we're just logging the count
      const oldTrades = await Trade.countDocuments({ createdAt: { $lt: ninetyDaysAgo } });
      logger.info(`Found ${oldTrades} trades older than 90 days that would be archived`);
      
      logger.info('Database cleanup task completed successfully');
    } catch (error) {
      logger.error('Error during database cleanup task', { error: error.message, stack: error.stack });
    }
  });
  
  // Schedule portfolio performance update - Run every day at 4:00 AM
  cron.schedule('0 4 * * *', async () => {
    try {
      logger.info('Running scheduled portfolio performance update task');
      
      const portfolios = await Portfolio.find({});
      logger.info(`Updating performance metrics for ${portfolios.length} portfolios`);
      
      let updatedCount = 0;
      
      for (const portfolio of portfolios) {
        // Calculate daily return (in a real system, this would compare to previous day's value)
        // For demo purposes, we're generating a random daily return
        const dailyReturnPercent = (Math.random() * 2 - 0.5); // Between -0.5% and 1.5%
        const dailyReturn = portfolio.equity * (dailyReturnPercent / 100);
        
        portfolio.performance.dailyReturn = dailyReturn;
        portfolio.performance.dailyReturnPercent = dailyReturnPercent;
        
        // Update total return based on initial equity (100,000 by default)
        const initialEquity = 100000;
        portfolio.performance.totalReturn = portfolio.equity - initialEquity;
        portfolio.performance.totalReturnPercent = (portfolio.performance.totalReturn / initialEquity) * 100;
        
        await portfolio.save();
        updatedCount++;
      }
      
      logger.info(`Successfully updated performance metrics for ${updatedCount} portfolios`);
    } catch (error) {
      logger.error('Error during portfolio performance update task', { error: error.message, stack: error.stack });
    }
  });
  
  // Schedule log rotation - Run every week on Sunday at 1:00 AM
  cron.schedule('0 1 * * 0', () => {
    try {
      logger.info('Running scheduled log rotation task');
      
      // In a production environment, this would use a more sophisticated log rotation strategy
      // For demo purposes, we're just checking log file sizes
      
      const logFiles = ['combined.log', 'error.log', 'exceptions.log', 'rejections.log'];
      
      logFiles.forEach(file => {
        const logPath = path.join(logsDir, file);
        
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath);
          const fileSizeMB = stats.size / (1024 * 1024);
          
          logger.info(`Log file ${file} size: ${fileSizeMB.toFixed(2)} MB`);
          
          // If file is larger than 100MB, archive it
          if (fileSizeMB > 100) {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const archivePath = path.join(logsDir, `${file}.${timestamp}`);
            
            fs.copyFileSync(logPath, archivePath);
            fs.truncateSync(logPath, 0);
            
            logger.info(`Archived log file ${file} to ${archivePath}`);
          }
        }
      });
      
      logger.info('Log rotation task completed successfully');
    } catch (error) {
      console.error('Error during log rotation task', error);
      // We can't use logger here as it might be the source of the error
    }
  });
  
  // Schedule system health check - Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running scheduled system health check');
      
      // Check database connection
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / (1024 * 1024));
      const heapTotalMB = Math.round(memoryUsage.heapTotal / (1024 * 1024));
      const memoryUsagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);
      
      // Log health metrics
      logger.info('System health check results', {
        database: dbStatus,
        memoryUsage: `${heapUsedMB}MB / ${heapTotalMB}MB (${memoryUsagePercent}%)`,
        uptime: process.uptime()
      });
      
      // Check if memory usage is high
      if (memoryUsagePercent > 85) {
        logger.warn('High memory usage detected', { memoryUsagePercent });
      }
      
      // Check if database is disconnected
      if (dbStatus !== 'connected') {
        logger.error('Database connection lost');
      }
      
    } catch (error) {
      logger.error('Error during system health check', { error: error.message, stack: error.stack });
    }
  });
  
  logger.info('All maintenance tasks initialized successfully');
};

module.exports = {
  initMaintenanceTasks
};
