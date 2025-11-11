const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import modules
const RedisManager = require('./config/database');
const AlertService = require('./services/AlertService');
const AlertController = require('./controllers/AlertController');
const alertRoutes = require('./routes/api/alerts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// Initialize services
const redisManager = new RedisManager();
const alertService = new AlertService(redisManager);
const alertController = new AlertController(alertService);

// API Routes
app.use('/api', alertRoutes(alertController));

// Health check endpoint
app.get('/health', (req, res) => alertController.healthCheck(req, res));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(` MoveInSync Enhanced Alert Management System`);
    console.log(` Server running on port ${PORT}`);
    console.log(` Frontend: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` API Base: http://localhost:${PORT}/api`);
    console.log(` Background jobs: Every ${process.env.BACKGROUND_JOB_INTERVAL_MINUTES || 2} minutes`);
});

module.exports = app;