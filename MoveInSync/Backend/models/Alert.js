const { v4: uuidv4 } = require('uuid');
const { ALERT_STATES, SEVERITY_LEVELS, EVENT_TYPES } = require('../config/constants');

class Alert {
    constructor(data) {
        this.alertId = data.alertId || uuidv4();
        this.sourceType = data.sourceType;
        this.severity = data.severity || SEVERITY_LEVELS.MEDIUM;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.status = data.status || ALERT_STATES.OPEN;
        this.metadata = data.metadata || {};
        this.history = data.history || [];
        this.resolution = data.resolution || null;
        this.resolvedAt = data.resolvedAt || null;
        this.expiredAt = data.expiredAt || null;
        this.lastEscalatedAt = data.lastEscalatedAt || null;
        this.escalationCount = data.escalationCount || 0;
        
        // Add creation event if new alert
        if (!data.alertId) {
            this.addHistoryEvent(EVENT_TYPES.CREATED, 'Alert created');
        }
    }

    addHistoryEvent(action, details, previousStatus = null, previousSeverity = null) {
        this.history.push({
            action,
            timestamp: new Date().toISOString(),
            details,
            previousStatus,
            previousSeverity
        });
    }

    escalate(newSeverity, reason) {
        const oldStatus = this.status;
        const oldSeverity = this.severity;
        
        this.status = ALERT_STATES.ESCALATED;
        this.severity = newSeverity;
        this.lastEscalatedAt = new Date().toISOString();
        this.escalationCount += 1;
        
        this.addHistoryEvent(
            EVENT_TYPES.ESCALATED, 
            reason, 
            oldStatus, 
            oldSeverity
        );
        
        console.log(`🚨 Alert ${this.alertId} escalated: ${reason}`);
    }

    autoClose(reason) {
        const oldStatus = this.status;
        
        this.status = ALERT_STATES.AUTO_CLOSED;
        
        this.addHistoryEvent(
            EVENT_TYPES.AUTO_CLOSED, 
            reason, 
            oldStatus
        );
        
        console.log(`🤖 Alert ${this.alertId} auto-closed: ${reason}`);
    }

    resolve(resolution) {
        const oldStatus = this.status;
        
        this.status = ALERT_STATES.RESOLVED;
        this.resolution = resolution;
        this.resolvedAt = new Date().toISOString();
        
        this.addHistoryEvent(
            EVENT_TYPES.RESOLVED, 
            resolution || 'Manually resolved', 
            oldStatus
        );
        
        console.log(`✅ Alert ${this.alertId} resolved: ${resolution}`);
    }

    expire() {
        const oldStatus = this.status;
        
        this.status = ALERT_STATES.EXPIRED;
        this.expiredAt = new Date().toISOString();
        
        this.addHistoryEvent(
            EVENT_TYPES.EXPIRED, 
            `Alert expired after ${process.env.ALERT_EXPIRY_DAYS || 30} days`, 
            oldStatus
        );
        
        console.log(`⏰ Alert ${this.alertId} expired`);
    }

    isActive() {
        return ![ALERT_STATES.RESOLVED, ALERT_STATES.AUTO_CLOSED, ALERT_STATES.EXPIRED].includes(this.status);
    }

    canEscalate() {
        if (!this.lastEscalatedAt) return true;
        
        const cooldownMs = (process.env.ESCALATION_COOLDOWN_MINUTES || 60) * 60 * 1000;
        const timeSinceLastEscalation = Date.now() - new Date(this.lastEscalatedAt).getTime();
        
        return timeSinceLastEscalation > cooldownMs;
    }

    getAge() {
        return (Date.now() - new Date(this.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    }

    toJSON() {
        return {
            alertId: this.alertId,
            sourceType: this.sourceType,
            severity: this.severity,
            timestamp: this.timestamp,
            status: this.status,
            metadata: this.metadata,
            history: this.history,
            resolution: this.resolution,
            resolvedAt: this.resolvedAt,
            expiredAt: this.expiredAt,
            lastEscalatedAt: this.lastEscalatedAt,
            escalationCount: this.escalationCount,
            age: Math.floor(this.getAge())
        };
    }
}

module.exports = Alert;