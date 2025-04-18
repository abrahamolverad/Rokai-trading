const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system metrics
    const systemInfo = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpuLoad: os.loadavg(),
      cpuCount: os.cpus().length
    };
    
    // Calculate memory usage percentage
    const memoryUsagePercent = 100 - Math.round(systemInfo.freeMemory / systemInfo.totalMemory * 100);
    
    // Determine status based on metrics
    const status = dbStatus === 'connected' && memoryUsagePercent < 90 ? 'healthy' : 'unhealthy';
    
    res.json({
      status,
      timestamp: new Date(),
      database: {
        status: dbStatus
      },
      system: {
        uptime: systemInfo.uptime,
        memoryUsagePercent,
        cpuLoad: systemInfo.cpuLoad[0] // 1 minute load average
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Detailed health check for internal monitoring
router.get('/detailed', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system metrics
    const systemInfo = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpuLoad: os.loadavg(),
      cpuCount: os.cpus().length,
      hostname: os.hostname(),
      platform: os.platform(),
      osType: os.type(),
      osRelease: os.release()
    };
    
    // Calculate memory usage percentage
    const memoryUsagePercent = 100 - Math.round(systemInfo.freeMemory / systemInfo.totalMemory * 100);
    
    // Get Node.js metrics
    const nodeMetrics = {
      version: process.version,
      heapTotal: Math.round(systemInfo.memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(systemInfo.memoryUsage.external / 1024 / 1024),
      pid: process.pid
    };
    
    // Determine status based on metrics
    const status = dbStatus === 'connected' && memoryUsagePercent < 90 ? 'healthy' : 'unhealthy';
    
    res.json({
      status,
      timestamp: new Date(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      system: {
        uptime: systemInfo.uptime,
        memoryUsagePercent,
        freeMemory: Math.round(systemInfo.freeMemory / 1024 / 1024) + ' MB',
        totalMemory: Math.round(systemInfo.totalMemory / 1024 / 1024) + ' MB',
        cpuLoad: systemInfo.cpuLoad,
        cpuCount: systemInfo.cpuCount,
        hostname: systemInfo.hostname,
        platform: systemInfo.platform,
        osType: systemInfo.osType,
        osRelease: systemInfo.osRelease
      },
      node: nodeMetrics,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
