const express = require('express');
const router = express.Router();

module.exports = (alertController) => {
    // Alert Management Routes
    router.post('/alerts', (req, res) => alertController.createAlert(req, res));
    router.get('/alerts', (req, res) => alertController.getAlerts(req, res));
    router.get('/alerts/stats', (req, res) => alertController.getStats(req, res));
    router.get('/alerts/:alertId', (req, res) => alertController.getAlertById(req, res));
    router.patch('/alerts/:alertId/resolve', (req, res) => alertController.resolveAlert(req, res));
    router.post('/alerts/process', (req, res) => alertController.processAlerts(req, res));

    // Dashboard Routes
    router.get('/dashboard', (req, res) => alertController.getDashboard(req, res));

    // Rules Management Routes
    router.get('/rules', (req, res) => alertController.getRules(req, res));
    router.put('/rules', (req, res) => alertController.updateRules(req, res));

    return router;
};