const fs = require('fs');
const path = require('path');
const { ALERT_STATES, SEVERITY_LEVELS } = require('../config/constants');

class RuleEngine {
    constructor() {
        this.rules = this.loadRules();
        this.ruleEvaluationCache = new Map();
    }

    loadRules() {
        try {
            const rulesPath = path.join(__dirname, '..', process.env.RULES_FILE_PATH || 'rules.json');
            if (fs.existsSync(rulesPath)) {
                const rulesData = fs.readFileSync(rulesPath, 'utf8');
                return JSON.parse(rulesData);
            }
        } catch (error) {
            console.error('Error loading rules:', error);
        }
        
        return this.getDefaultRules();
    }

    getDefaultRules() {
        return {
            overspeed: {
                escalate_if_count: 3,
                window_mins: 60,
                escalate_to_severity: 'CRITICAL',
                auto_close_if: 'speed_normalized'
            },
            feedback_negative: {
                escalate_if_count: 2,
                window_mins: 1440,
                escalate_to_severity: 'HIGH',
                auto_close_if: 'feedback_resolved'
            },
            compliance: {
                auto_close_if: 'document_valid',
                escalate_if_days: 7,
                escalate_to_severity: 'HIGH'
            },
            document_expiry: {
                escalate_if_days: 3,
                escalate_to_severity: 'CRITICAL',
                auto_close_if: 'document_renewed'
            },
            vehicle_maintenance: {
                escalate_if_days: 5,
                escalate_to_severity: 'HIGH',
                auto_close_if: 'maintenance_completed'
            },
            driver_fatigue: {
                escalate_if_count: 1,
                window_mins: 30,
                escalate_to_severity: 'CRITICAL',
                auto_close_if: 'driver_rested'
            }
        };
    }

    saveRules() {
        if (process.env.AUTO_SAVE_RULES !== 'true') return;
        
        try {
            const rulesPath = path.join(__dirname, '..', process.env.RULES_FILE_PATH || 'rules.json');
            fs.writeFileSync(rulesPath, JSON.stringify(this.rules, null, 2));
            console.log(' Rules saved successfully');
        } catch (error) {
            console.error(' Error saving rules:', error);
        }
    }

    async evaluateAlert(alert, allAlerts) {
        const rule = this.rules[alert.sourceType];
        if (!rule) return null;

        // Check escalation rules
        const escalationAction = await this.checkEscalationRules(alert, rule, allAlerts);
        if (escalationAction) return escalationAction;

        // Check auto-close rules
        const autoCloseAction = this.checkAutoCloseRules(alert, rule);
        if (autoCloseAction) return autoCloseAction;

        return null;
    }

    async checkEscalationRules(alert, rule, allAlerts) {
        if (!alert.canEscalate()) return null;

        // Count-based escalation within time window
        if (rule.escalate_if_count && rule.window_mins) {
            const windowStart = new Date(Date.now() - (rule.window_mins * 60 * 1000));
            const recentAlerts = allAlerts.filter(a => 
                a.sourceType === alert.sourceType &&
                a.isActive() &&
                new Date(a.timestamp) >= windowStart &&
                (a.metadata.driverId === alert.metadata.driverId || 
                 a.metadata.vehicleId === alert.metadata.vehicleId)
            );

            if (recentAlerts.length >= rule.escalate_if_count) {
                return {
                    type: 'escalate',
                    newStatus: ALERT_STATES.ESCALATED,
                    newSeverity: rule.escalate_to_severity,
                    reason: `${recentAlerts.length} ${alert.sourceType} alerts in ${rule.window_mins} minutes`
                };
            }
        }

        // Age-based escalation
        if (rule.escalate_if_days && alert.status === ALERT_STATES.OPEN) {
            const alertAge = alert.getAge();
            if (alertAge >= rule.escalate_if_days) {
                return {
                    type: 'escalate',
                    newStatus: ALERT_STATES.ESCALATED,
                    newSeverity: rule.escalate_to_severity,
                    reason: `Alert aged ${Math.floor(alertAge)} days`
                };
            }
        }

        return null;
    }

    checkAutoCloseRules(alert, rule) {
    if (!rule.auto_close_if || !alert.metadata) return null;

    const condition = rule.auto_close_if;

    // extended condition handling for compliance/document renewal
    const conditionValue =
        alert.metadata[condition] === true ||
        alert.metadata[condition] === 'true' ||
        (condition === 'document_valid' && alert.metadata.document_valid === true) ||
        (condition === 'document_renewed' && alert.metadata.document_renewed === true) ||
        (condition === 'maintenance_completed' && alert.metadata.maintenance_completed === true);

    if (conditionValue) {
        return {
            type: 'auto_close',
            newStatus: ALERT_STATES.AUTO_CLOSED,
            reason: `Auto-closed because ${condition} condition met`
        };
    }

    return null;
}


    updateRules(newRules) {
        this.rules = { ...this.rules, ...newRules };
        this.ruleEvaluationCache.clear();
        this.saveRules();
    }

    getRules() {
        return this.rules;
    }
}

module.exports = RuleEngine;
