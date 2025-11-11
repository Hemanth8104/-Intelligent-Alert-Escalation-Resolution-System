const { RESPONSE_CODES, CONFIG } = require('../config/constants');

class AlertController {
    constructor(alertService) {
        this.alertService = alertService;
    }

    async createAlert(req, res) {
        try {
            const { sourceType, severity, metadata } = req.body;

            if (!sourceType) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    success: false,
                    error: 'sourceType is required'
                });
            }

            const alert = await this.alertService.createAlert({
                sourceType,
                severity,
                metadata
            });

            res.status(RESPONSE_CODES.CREATED).json({
                success: true,
                alert: alert.toJSON(),
                message: 'Alert created successfully'
            });
        } catch (error) {
            console.error('Create alert error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAlerts(req, res) {
        try {
            const { sourceType, severity, status, driverId, vehicleId, limit = CONFIG.DEFAULT_PAGE_LIMIT, offset = 0 } = req.query;
            const filters = {};

            if (sourceType) filters.sourceType = sourceType;
            if (severity) filters.severity = severity;
            if (status) filters.status = status;
            if (driverId) filters.driverId = driverId;
            if (vehicleId) filters.vehicleId = vehicleId;

            const allAlerts = await this.alertService.getAlerts(filters);
            const limitNum = Math.min(parseInt(limit), CONFIG.MAX_PAGE_LIMIT);
            const offsetNum = parseInt(offset);
            const paginatedAlerts = allAlerts.slice(offsetNum, offsetNum + limitNum);
            
            res.json({
                success: true,
                alerts: paginatedAlerts.map(alert => alert.toJSON()),
                pagination: {
                    total: allAlerts.length,
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < allAlerts.length
                }
            });
        } catch (error) {
            console.error('Get alerts error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAlertById(req, res) {
        try {
            const { alertId } = req.params;
            const alert = await this.alertService.getAlertById(alertId);

            if (!alert) {
                return res.status(RESPONSE_CODES.NOT_FOUND).json({
                    success: false,
                    error: 'Alert not found'
                });
            }

            res.json({
                success: true,
                alert: alert.toJSON()
            });
        } catch (error) {
            console.error('Get alert by ID error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async resolveAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { resolution } = req.body;

            const alert = await this.alertService.resolveAlert(alertId, resolution);

            if (!alert) {
                return res.status(RESPONSE_CODES.NOT_FOUND).json({
                    success: false,
                    error: 'Alert not found'
                });
            }

            res.json({
                success: true,
                alert: alert.toJSON(),
                message: 'Alert resolved successfully'
            });
        } catch (error) {
            console.error('Resolve alert error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await this.alertService.getStats();
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async getDashboard(req, res) {
        try {
            const dashboardData = await this.alertService.getDashboardData();
            res.json({
                success: true,
                dashboard: dashboardData
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRules(req, res) {
        try {
            const rules = this.alertService.getRules();
            res.json({
                success: true,
                rules
            });
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateRules(req, res) {
        try {
            const { rules } = req.body;
            
            if (!rules) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    success: false,
                    error: 'Rules object is required'
                });
            }

            this.alertService.updateRules(rules);

            res.json({
                success: true,
                rules: this.alertService.getRules(),
                message: 'Rules updated successfully'
            });
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async processAlerts(req, res) {
        try {
            await this.alertService.processAllAlerts();
            res.json({
                success: true,
                message: 'All alerts processed successfully'
            });
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR).json({
                success: false,
                error: error.message
            });
        }
    }

    async healthCheck(req, res) {
        res.json({ 
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'MoveInSync Enhanced Alert Management System',
            environment: process.env.NODE_ENV || 'development',
            backgroundJobs: 'Active'
        });
    }
}

module.exports = AlertController;