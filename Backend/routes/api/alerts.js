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
    // Document Renewal Route
router.patch('/alerts/:alertId/renew', async (req, res) => {
    const { alertId } = req.params;
    const { metadata } = req.body;

    try {
        const alert = await alertController.alertService.getAlertById(alertId);
        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        alert.metadata = { ...alert.metadata, ...metadata, document_valid: true };
        await alertController.alertService.storageManager.saveAlert(alert);
        await alertController.alertService.processAlert(alert);

        res.json({
            success: true,
            message: 'Document renewed and alert auto-closed if applicable',
            alert: alert.toJSON()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


    return router;
};
