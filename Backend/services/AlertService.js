const Alert = require('../models/Alert');
const RuleEngine = require('./RuleEngine');
const AlertStorageManager = require('./AlertStorageManager');
const { ALERT_STATES, SEVERITY_LEVELS } = require('../config/constants');
const cron = require('node-cron');

class AlertService {
    constructor(redisManager) {
        this.storageManager = new AlertStorageManager(redisManager);
        this.ruleEngine = new RuleEngine();
        this.processingQueue = new Set();
        
        this.initBackgroundJobs();
    }

    initBackgroundJobs() {
        const intervalMinutes = process.env.BACKGROUND_JOB_INTERVAL_MINUTES || 2;
        const cronExpression = `*/${intervalMinutes} * * * *`;
        
        cron.schedule(cronExpression, async () => {
            console.log(' Running background alert processing...');
            await this.processAllAlerts();
            await this.expireOldAlerts();
        });

        console.log(` Background job scheduled every ${intervalMinutes} minutes`);
    }

    async createAlert(alertData) {
        const alert = new Alert(alertData);
        await this.storageManager.saveAlert(alert);
        
        // Process immediately after creation
        await this.processAlert(alert);
        
        return alert;
    }

   async processAlert(alert) {
    if (this.processingQueue.has(alert.alertId)) return; // Prevent duplicate processing
    
    this.processingQueue.add(alert.alertId);
    
    try {
        const allAlerts = await this.storageManager.getAllAlerts();
        const action = await this.ruleEngine.evaluateAlert(alert, allAlerts);
        
        if (action) {
            await this.executeAction(alert, action);
            await this.storageManager.saveAlert(alert);

            //  Log auto-close here
            if (alert.status === ALERT_STATES.AUTO_CLOSED) {
                console.log(` Auto-closed alert ${alert.alertId} stored successfully`);
            }
        }
    } catch (error) {
        console.error(`Error processing alert ${alert.alertId}:`, error);
    } finally {
        this.processingQueue.delete(alert.alertId);
    }
}


    async executeAction(alert, action) {
        switch (action.type) {
            case 'escalate':
                alert.escalate(action.newSeverity, action.reason);
                break;
            case 'auto_close':
                alert.autoClose(action.reason);
                break;
        }
    }

    async processAllAlerts() {
        try {
            const alerts = await this.storageManager.getAllAlerts();
            const activeAlerts = alerts.filter(alert => alert.isActive());
            
            console.log(`Processing ${activeAlerts.length} active alerts...`);
            
            for (const alert of activeAlerts) {
                await this.processAlert(alert);
            }
            
            console.log(' Background processing completed');
        } catch (error) {
            console.error(' Error in background processing:', error);
        }
    }

    async expireOldAlerts() {
        try {
            const expiryDays = process.env.ALERT_EXPIRY_DAYS || 30;
            const expiryTime = new Date(Date.now() - (expiryDays * 24 * 60 * 60 * 1000));
            
            const alerts = await this.storageManager.getAllAlerts();
            let expiredCount = 0;
            
            for (const alert of alerts) {
                if (alert.isActive() && new Date(alert.timestamp) < expiryTime) {
                    alert.expire();
                    await this.storageManager.saveAlert(alert);
                    expiredCount++;
                }
            }
            
            if (expiredCount > 0) {
                console.log(` Expired ${expiredCount} old alerts`);
            }
        } catch (error) {
            console.error(' Error expiring old alerts:', error);
        }
    }

    async getAlerts(filters = {}) {
        const alerts = await this.storageManager.getAllAlerts();
        let filteredAlerts = alerts;

        if (filters.sourceType) {
            filteredAlerts = filteredAlerts.filter(alert => alert.sourceType === filters.sourceType);
        }
        if (filters.severity) {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
        }
        if (filters.status) {
            filteredAlerts = filteredAlerts.filter(alert => alert.status === filters.status);
        }
        if (filters.driverId) {
            filteredAlerts = filteredAlerts.filter(alert => alert.metadata.driverId === filters.driverId);
        }

        return filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async getAlertById(alertId) {
        return await this.storageManager.getAlert(alertId);
    }

    async resolveAlert(alertId, resolution) {
        const alert = await this.storageManager.getAlert(alertId);
        if (!alert) return null;

        alert.resolve(resolution);
        await this.storageManager.saveAlert(alert);
        
        return alert;
    }

    async getStats() {
        const alerts = await this.storageManager.getAllAlerts();
        
        const stats = {
            total: alerts.length,
            byStatus: {},
            bySeverity: {},
            bySourceType: {},
            activeCount: alerts.filter(alert => alert.isActive()).length,
            avgAge: 0
        };

        // Calculate statistics
        Object.values(ALERT_STATES).forEach(status => {
            stats.byStatus[status] = alerts.filter(alert => alert.status === status).length;
        });

        Object.values(SEVERITY_LEVELS).forEach(severity => {
            stats.bySeverity[severity] = alerts.filter(alert => alert.severity === severity).length;
        });

        const sourceTypes = [...new Set(alerts.map(alert => alert.sourceType))];
        sourceTypes.forEach(sourceType => {
            stats.bySourceType[sourceType] = alerts.filter(alert => alert.sourceType === sourceType).length;
        });

        // Calculate average age
        if (alerts.length > 0) {
            const totalAge = alerts.reduce((sum, alert) => sum + alert.getAge(), 0);
            stats.avgAge = Math.round(totalAge / alerts.length * 100) / 100;
        }

        return stats;
    }

    async getDashboardData() {
        const alerts = await this.storageManager.getAllAlerts();
        const topDriversLimit = process.env.TOP_DRIVERS_LIMIT || 5;
        const recentAlertsLimit = process.env.RECENT_ALERTS_LIMIT || 10;

        // Driver alert counts
        const driverAlertCounts = {};
        const vehicleAlertCounts = {};
        
        alerts.filter(alert => alert.isActive()).forEach(alert => {
            if (alert.metadata.driverId) {
                driverAlertCounts[alert.metadata.driverId] = (driverAlertCounts[alert.metadata.driverId] || 0) + 1;
            }
            if (alert.metadata.vehicleId) {
                vehicleAlertCounts[alert.metadata.vehicleId] = (vehicleAlertCounts[alert.metadata.vehicleId] || 0) + 1;
            }
        });

        // Top drivers with most alerts
        const topDrivers = Object.entries(driverAlertCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, topDriversLimit)
            .map(([driverId, count]) => ({ driverId, alertCount: count }));

        // Recent auto-closed alerts
        const recentAutoClosed = alerts
            .filter(alert => alert.status === ALERT_STATES.AUTO_CLOSED)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, recentAlertsLimit)
            .map(alert => alert.toJSON());

        // Severity distribution for active alerts
        const activeAlerts = alerts.filter(alert => alert.isActive());
        const severityDistribution = {
            [SEVERITY_LEVELS.CRITICAL]: activeAlerts.filter(alert => alert.severity === SEVERITY_LEVELS.CRITICAL).length,
            [SEVERITY_LEVELS.HIGH]: activeAlerts.filter(alert => alert.severity === SEVERITY_LEVELS.HIGH).length,
            [SEVERITY_LEVELS.MEDIUM]: activeAlerts.filter(alert => alert.severity === SEVERITY_LEVELS.MEDIUM).length,
            [SEVERITY_LEVELS.LOW]: activeAlerts.filter(alert => alert.severity === SEVERITY_LEVELS.LOW).length
        };

        // Alert trends (last 7 days)
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const alertTrends = last7Days.map(date => {
            const dayAlerts = alerts.filter(alert => 
                alert.timestamp.startsWith(date)
            );
            return {
                date,
                count: dayAlerts.length,
                escalated: dayAlerts.filter(alert => alert.status === ALERT_STATES.ESCALATED).length,
                autoClosed: dayAlerts.filter(alert => alert.status === ALERT_STATES.AUTO_CLOSED).length
            };
        });

        return {
            severityDistribution,
            topDrivers,
            recentAutoClosed,
            alertTrends,
            summary: {
                totalActive: activeAlerts.length,
                totalToday: alerts.filter(alert => 
                    alert.timestamp.startsWith(new Date().toISOString().split('T')[0])
                ).length,
                escalationRate: activeAlerts.length > 0 ? 
                    Math.round((activeAlerts.filter(alert => alert.status === ALERT_STATES.ESCALATED).length / activeAlerts.length) * 100) : 0
            }
        };
    }

    getRules() {
        return this.ruleEngine.getRules();
    }

    updateRules(rules) {
        return this.ruleEngine.updateRules(rules);
    }
}

module.exports = AlertService;
