const Alert = require('../models/Alert');

class AlertStorageManager {
    constructor(redisManager) {
        this.redis = redisManager;
        this.memoryStore = new Map(); // Fallback storage
        this.alertsByDriver = new Map();
        this.alertsByVehicle = new Map();
    }

    async saveAlert(alert) {
        const alertData = alert.toJSON();
        
        // Try Redis first
        if (this.redis.isConnected) {
            await this.redis.set(`alert:${alert.alertId}`, alertData);
            
            // Index by driver and vehicle for dashboard queries
            if (alert.metadata.driverId) {
                await this.redis.zadd(`driver:${alert.metadata.driverId}:alerts`, Date.now(), alert.alertId);
            }
            if (alert.metadata.vehicleId) {
                await this.redis.zadd(`vehicle:${alert.metadata.vehicleId}:alerts`, Date.now(), alert.alertId);
            }
        } else {
            // Fallback to memory
            this.memoryStore.set(alert.alertId, alertData);
            this.updateMemoryIndices(alert);
        }
    }

    updateMemoryIndices(alert) {
        if (alert.metadata.driverId) {
            if (!this.alertsByDriver.has(alert.metadata.driverId)) {
                this.alertsByDriver.set(alert.metadata.driverId, []);
            }
            this.alertsByDriver.get(alert.metadata.driverId).push(alert.alertId);
        }
        
        if (alert.metadata.vehicleId) {
            if (!this.alertsByVehicle.has(alert.metadata.vehicleId)) {
                this.alertsByVehicle.set(alert.metadata.vehicleId, []);
            }
            this.alertsByVehicle.get(alert.metadata.vehicleId).push(alert.alertId);
        }
    }

    async getAlert(alertId) {
        if (this.redis.isConnected) {
            const alertData = await this.redis.get(`alert:${alertId}`);
            return alertData ? new Alert(alertData) : null;
        } else {
            const alertData = this.memoryStore.get(alertId);
            return alertData ? new Alert(alertData) : null;
        }
    }

    async getAllAlerts() {
        if (this.redis.isConnected) {
            const keys = await this.redis.keys('alert:*');
            const alerts = [];
            
            for (const key of keys) {
                const alertData = await this.redis.get(key);
                if (alertData) {
                    alerts.push(new Alert(alertData));
                }
            }
            
            return alerts;
        } else {
            return Array.from(this.memoryStore.values()).map(data => new Alert(data));
        }
    }

    async deleteAlert(alertId) {
        if (this.redis.isConnected) {
            await this.redis.del(`alert:${alertId}`);
        } else {
            this.memoryStore.delete(alertId);
        }
    }

    async getAlertsByDriver(driverId, limit = 10) {
        if (this.redis.isConnected) {
            const alertIds = await this.redis.zrevrange(`driver:${driverId}:alerts`, 0, limit - 1);
            const alerts = [];
            
            for (const alertId of alertIds) {
                const alert = await this.getAlert(alertId);
                if (alert) alerts.push(alert);
            }
            
            return alerts;
        } else {
            const alertIds = this.alertsByDriver.get(driverId) || [];
            return alertIds.slice(0, limit).map(id => {
                const data = this.memoryStore.get(id);
                return data ? new Alert(data) : null;
            }).filter(Boolean);
        }
    }
}

module.exports = AlertStorageManager;