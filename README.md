# Alert Management System 

##  Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Key Features](#key-features)
4. [Technical Implementation](#technical-implementation)
5. [User Interface Design](#user-interface-design)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Security & Performance](#security--performance)
9. [Demo Instructions](#demo-instructions)
10. [Code Structure](#code-structure)

---

##  Project Overview

### Problem Statement
Modern ride-sharing platforms require sophisticated alert management systems to handle real-time incidents, driver notifications, and system monitoring. This project implements a comprehensive Alert Management System designed specifically for ride-sharing operations.

### Solution Delivered
A full-stack web application featuring:
- **Real-time Alert Processing** - Automated alert creation, escalation, and resolution
- **Advanced Dashboard** - Professional dark-mode interface with analytics
- **Rule-based Engine** - Configurable business rules for alert handling
- **Modern UI/UX** - Glassmorphic design with smooth animations
- **Comprehensive API** - RESTful endpoints for all operations

### Technology Stack
- **Frontend**: HTML5, CSS3 (Modern Dark Theme), Vanilla JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Architecture**: MVC Pattern, Service Layer Architecture
- **Security**: Helmet.js, CORS, Input Validation
- **Monitoring**: Winston Logging, Health Checks

---

##  System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API   │───▶│   Data Layer    │
│   Dashboard     │    │   Express.js    │    │   In-Memory     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chart.js      │    │   Rule Engine   │    │   Logging       │
│   Animations    │    │   Monitoring    │    │   Winston       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Structure
```javascript
// Backend Architecture
Backend/
├── controllers/     # Request handling logic
├── services/       # Business logic layer
├── models/         # Data models
├── routes/         # API route definitions
├── config/         # Configuration files
└── utils/          # Utility functions

// Frontend Architecture
Frontend/
├── index.html      # Main dashboard interface
├── styles.css      # Modern dark theme styling
└── script.js       # Interactive functionality
```

---

##  Key Features

### 1. Real-Time Alert Dashboard

**Description**: Professional dashboard displaying live alert data with modern glassmorphic design.

**Code Implementation**:
```javascript
// Frontend: Real-time dashboard initialization
class AlertManagementSystem {
    constructor() {
        this.alerts = [];
        this.filteredAlerts = [];
        this.chart = null;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.loadData();
        this.initChart();
        this.setupAutoRefresh();
        this.showLoading(false);
    }
}
```

**Visual Features**:
- Dark theme with gradient accents
- Real-time counters with animations
- Glassmorphic cards with backdrop blur
- Responsive grid layout



### 2. Advanced Alert Processing Engine

**Description**: Sophisticated backend system for creating, processing, and managing alerts with business rule integration.

**Code Implementation**:
```javascript
// Backend: Alert processing service
class AlertService {
    async processAlerts(alertData) {
        try {
            // Apply business rules
            const processedAlerts = await this.ruleEngine.applyRules(alertData);
            
            // Store alerts
            const savedAlerts = await this.alertStorage.saveAlerts(processedAlerts);
            
            // Check for auto-escalation
            await this.checkAutoEscalation(savedAlerts);
            
            return savedAlerts;
        } catch (error) {
            this.errorHandler.handleError(error, 'processAlerts');
            throw error;
        }
    }
}
```

**Business Logic Features**:
- Automatic severity classification
- Rule-based escalation triggers
- Duplicate alert detection
- Auto-closure mechanisms

---

### 3. Interactive Analytics Chart

**Description**: Dynamic Chart.js visualization showing alert trends over time with real data analysis.

**Code Implementation**:
```javascript
// Frontend: Chart initialization with real data
calculateChartData() {
    const labels = [];
    const critical = [], high = [], medium = [], low = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Count alerts by severity for each date
        const alertsForDate = this.alerts.filter(alert => {
            const alertDate = new Date(alert.timestamp).toISOString().split('T')[0];
            return alertDate === dateStr;
        });

        critical.push(alertsForDate.filter(a => a.severity === 'critical').length);
        high.push(alertsForDate.filter(a => a.severity === 'high').length);
        medium.push(alertsForDate.filter(a => a.severity === 'medium').length);
        low.push(alertsForDate.filter(a => a.severity === 'low').length);
    }

    return { labels, critical, high, medium, low };
}
```

**Analytics Features**:
- 7-day trend analysis
- Severity-based filtering
- Real-time data updates
- Interactive hover tooltips

---

### 4. Comprehensive Rule Engine

**Description**: Configurable business rules system for automated alert handling and decision making.

**Code Implementation**:
```javascript
// Backend: Rule engine implementation
class RuleEngine {
    constructor() {
        this.rules = require('../rules.json');
    }

    async applyRules(alerts) {
        return alerts.map(alert => {
            // Apply severity rules
            alert.severity = this.determineSeverity(alert);
            
            // Apply escalation rules
            if (this.shouldAutoEscalate(alert)) {
                alert.escalationCount = (alert.escalationCount || 0) + 1;
            }
            
            // Apply auto-closure rules
            if (this.shouldAutoClose(alert)) {
                alert.status = 'auto_closed';
                alert.autoClosedAt = new Date().toISOString();
            }
            
            return alert;
        });
    }
}
```

**Business Rules Configuration**:
```json
// rules.json
{
    "escalationRules": {
        "maxResponseTime": 1800000,
        "maxEscalations": 3
    },
    "autoClosureRules": {
        "lowSeverityTimeout": 3600000,
        "duplicateWindow": 300000
    },
    "severityMappings": {
        "PANIC_BUTTON": "critical",
        "ACCIDENT": "high",
        "SPEEDING": "medium",
        "ROUTE_DEVIATION": "low"
    }
}
```

---

### 5. Modern User Interface Design

**Description**: Professional dark-mode interface with glassmorphism effects and smooth animations.

**Code Implementation**:
```css
/* Modern Dark Theme Styling */
:root {
    --bg-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-secondary: rgba(30, 41, 59, 0.8);
    --bg-card: rgba(51, 65, 85, 0.6);
    --accent-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --border-color: rgba(148, 163, 184, 0.2);
}

.dashboard-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    transition: all 0.3s ease;
}

.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

**Design Features**:
- Glassmorphic card design
- Smooth hover animations
- Professional color palette
- Responsive grid system
- Modern typography (Inter + JetBrains Mono)


---

### 6. Real-Time System Monitoring

**Description**: Live system health monitoring with performance metrics and status indicators.

**Code Implementation**:
```javascript
// Backend: Health check endpoint
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        checks: {
            memory: {
                status: 'healthy',
                result: process.memoryUsage()
            },
            system: {
                status: 'healthy',
                uptime: process.uptime()
            }
        }
    };
    
    res.status(200).json(healthCheck);
});

// Frontend: System status updates
updateSystemStatus(data) {
    document.getElementById('systemStatus').textContent = data.status;
    document.getElementById('systemUptime').textContent = this.formatUptime(data.uptime);
    document.getElementById('memoryUsage').textContent = this.getMemoryUsage(data);
}
```

**Monitoring Features**:
- System uptime tracking
- Memory usage monitoring
- Active sessions count
- Cache hit rate statistics
- Real-time status updates


---

### 7. Advanced Alert Management

**Description**: Comprehensive alert lifecycle management with detailed tracking and history.

**Code Implementation**:
```javascript
// Frontend: Alert detail modal
async showAlertDetails(alertId) {
    const alert = this.alerts.find(a => a.alertId === alertId);
    
    // Populate detailed information
    const detailContent = document.getElementById('alertDetailContent');
    detailContent.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Alert ID</div>
            <div class="detail-value">${alert.alertId}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Severity</div>
            <div class="detail-value">
                <span class="severity-badge severity-${alert.severity}">
                    ${alert.severity.toUpperCase()}
                </span>
            </div>
        </div>
        <!-- Additional alert details -->
    `;
    
    this.showAlertHistory(alert);
}

// Backend: Alert escalation
async escalateAlert(alertId, reason) {
    const alert = await this.alertStorage.getAlert(alertId);
    
    alert.escalationCount = (alert.escalationCount || 0) + 1;
    alert.lastEscalated = new Date().toISOString();
    alert.escalationReason = reason;
    
    await this.alertStorage.updateAlert(alertId, alert);
    
    return alert;
}
```

**Management Features**:
- Detailed alert information display
- Alert history timeline
- Manual escalation capability
- Bulk resolution options
- Status tracking and updates


---

### 8. Smart Filtering and Search

**Description**: Advanced filtering system with real-time search and multiple filter criteria.

**Code Implementation**:
```javascript
// Frontend: Advanced filtering logic
applyFilters() {
    const severityFilter = document.getElementById('severityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    this.filteredAlerts = this.alerts.filter(alert => {
        const matchesSeverity = !severityFilter || alert.severity === severityFilter;
        const matchesStatus = !statusFilter || alert.status === statusFilter;
        const matchesSearch = !searchInput || 
            alert.driverName.toLowerCase().includes(searchInput) ||
            alert.vehicleId.toLowerCase().includes(searchInput) ||
            alert.description.toLowerCase().includes(searchInput);

        return matchesSeverity && matchesStatus && matchesSearch;
    });

    this.updateAlertsList();
}
```

**Filter Features**:
- Multi-criteria filtering
- Real-time search results
- Saved filter presets
- Advanced search operators
- Filter result statistics


---

##  Technical Implementation

### Backend API Architecture

**Express.js Server Setup**:
```javascript
// Backend: Server initialization
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
```

### Service Layer Pattern

**AlertService Implementation**:
```javascript
class AlertService {
    constructor() {
        this.alertStorage = new AlertStorageManager();
        this.ruleEngine = new RuleEngine();
        this.errorHandler = new ErrorHandler();
        this.cache = new CachingService();
    }

    async createAlert(alertData) {
        // Validate input
        const validation = this.validateAlertData(alertData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Generate unique ID
        const alertId = this.generateAlertId();
        
        // Create alert object
        const alert = new Alert({
            alertId,
            ...alertData,
            timestamp: new Date().toISOString(),
            status: 'open'
        });

        // Apply business rules
        const processedAlert = await this.ruleEngine.processAlert(alert);
        
        // Store alert
        const savedAlert = await this.alertStorage.saveAlert(processedAlert);
        
        return savedAlert;
    }
}
```

### Data Models

**Alert Model Structure**:
```javascript
class Alert {
    constructor(data) {
        this.alertId = data.alertId;
        this.sourceType = data.sourceType;
        this.severity = data.severity;
        this.status = data.status;
        this.driverName = data.driverName;
        this.vehicleId = data.vehicleId;
        this.description = data.description;
        this.timestamp = data.timestamp;
        this.escalationCount = data.escalationCount || 0;
        this.lastEscalated = data.lastEscalated;
        this.resolvedAt = data.resolvedAt;
        this.autoClosedAt = data.autoClosedAt;
    }

    toJSON() {
        return {
            alertId: this.alertId,
            sourceType: this.sourceType,
            severity: this.severity,
            status: this.status,
            driverName: this.driverName,
            vehicleId: this.vehicleId,
            description: this.description,
            timestamp: this.timestamp,
            escalationCount: this.escalationCount,
            lastEscalated: this.lastEscalated,
            resolvedAt: this.resolvedAt,
            autoClosedAt: this.autoClosedAt
        };
    }
}
```

---

##  User Interface Design

### Design System

**Color Palette**:
```css
:root {
    /* Background Colors */
    --bg-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-secondary: rgba(30, 41, 59, 0.8);
    --bg-card: rgba(51, 65, 85, 0.6);
    
    /* Accent Colors */
    --accent-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    --accent-secondary: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    
    /* Severity Colors */
    --severity-critical: #dc2626;
    --severity-high: #ea580c;
    --severity-medium: #d97706;
    --severity-low: #65a30d;
    
    /* Text Colors */
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
}
```

**Typography System**:
```css
/* Font Families */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-variation-settings: 'wght' 400;
}

.monospace {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Typography Scale */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
```

### Component Library

**Dashboard Cards**:
```css
.dashboard-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.dashboard-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent-primary);
    border-radius: 1rem 1rem 0 0;
}
```

**Interactive Elements**:
```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    text-decoration: none;
}

.btn-primary {
    background: var(--accent-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}
```

---

##  API Documentation

### Alert Management Endpoints

**Create Alert**:
```http
POST /api/alerts
Content-Type: application/json

{
    "sourceType": "SPEEDING",
    "severity": "medium",
    "driverName": "John Doe",
    "vehicleId": "VH001",
    "description": "Speed limit exceeded by 20km/h"
}
```

**Get Alerts**:
```http
GET /api/alerts
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- severity: string (critical|high|medium|low)
- status: string (open|escalated|resolved|auto_closed)
```

**Alert Statistics**:
```http
GET /api/alerts/stats
Response:
{
    "totalAlerts": 45,
    "criticalAlerts": 3,
    "highAlerts": 8,
    "mediumAlerts": 15,
    "lowAlerts": 19,
    "escalatedAlerts": 5
}
```

**Escalate Alert**:
```http
POST /api/alerts/:alertId/escalate
Content-Type: application/json

{
    "reason": "Manual escalation due to severity"
}
```

**Resolve Alert**:
```http
PATCH /api/alerts/:alertId/resolve
Content-Type: application/json

{
    "resolution": "Issue resolved successfully"
}
```

### System Monitoring Endpoints

**Health Check**:
```http
GET /health
Response:
{
    "status": "healthy",
    "uptime": 3600,
    "timestamp": "2025-11-11T10:30:00.000Z",
    "checks": {
        "memory": {
            "status": "healthy",
            "result": {
                "rss": 45678592,
                "heapTotal": 28311552,
                "heapUsed": 16789504
            }
        }
    }
}
```

---

##  Database Schema

### Alert Data Structure

```javascript
// Alert Entity Structure
const alertSchema = {
    alertId: {
        type: String,
        unique: true,
        required: true,
        format: "ALT-YYYYMMDD-XXXXXX"
    },
    sourceType: {
        type: String,
        enum: ["PANIC_BUTTON", "ACCIDENT", "SPEEDING", "ROUTE_DEVIATION", "VEHICLE_BREAKDOWN"],
        required: true
    },
    severity: {
        type: String,
        enum: ["critical", "high", "medium", "low"],
        required: true
    },
    status: {
        type: String,
        enum: ["open", "escalated", "resolved", "auto_closed"],
        default: "open"
    },
    driverName: {
        type: String,
        required: true,
        maxLength: 100
    },
    vehicleId: {
        type: String,
        required: true,
        pattern: "^[A-Z]{2}[0-9]{3,4}$"
    },
    description: {
        type: String,
        maxLength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    escalationCount: {
        type: Number,
        default: 0
    },
    lastEscalated: Date,
    resolvedAt: Date,
    autoClosedAt: Date
};
```

### Storage Implementation

```javascript
// In-Memory Storage with Persistence Simulation
class AlertStorageManager {
    constructor() {
        this.alerts = new Map();
        this.driverStats = new Map();
        this.systemStats = {
            totalProcessed: 0,
            autoClosedCount: 0,
            escalatedCount: 0
        };
    }

    async saveAlert(alert) {
        this.alerts.set(alert.alertId, alert);
        this.updateDriverStats(alert);
        this.systemStats.totalProcessed++;
        return alert;
    }

    async getAlerts(filters = {}) {
        let results = Array.from(this.alerts.values());

        // Apply filters
        if (filters.severity) {
            results = results.filter(alert => alert.severity === filters.severity);
        }
        if (filters.status) {
            results = results.filter(alert => alert.status === filters.status);
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return results;
    }
}
```

---

##  Security & Performance

### Security Implementation

**Content Security Policy**:
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

**Input Validation**:
```javascript
validateAlertData(data) {
    const errors = [];
    
    if (!data.sourceType || !VALID_SOURCE_TYPES.includes(data.sourceType)) {
        errors.push('Invalid source type');
    }
    
    if (!data.driverName || data.driverName.trim().length === 0) {
        errors.push('Driver name is required');
    }
    
    if (!data.vehicleId || !/^[A-Z]{2}[0-9]{3,4}$/.test(data.vehicleId)) {
        errors.push('Invalid vehicle ID format');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
```

### Performance Optimization

**Caching Strategy**:
```javascript
class CachingService {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutes
    }

    set(key, value, customTTL = null) {
        const expiry = Date.now() + (customTTL || this.ttl);
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
}
```

**Error Handling**:
```javascript
class ErrorHandler {
    handleError(error, context) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            severity: this.determineSeverity(error)
        };
        
        // Log error
        logger.error('Application Error', errorInfo);
        
        // Send to monitoring service if available
        if (this.monitoringService) {
            this.monitoringService.reportError(errorInfo);
        }
    }
}
```


##  Demo Instructions

### Prerequisites
1. **Node.js** (v14+ recommended)
2. **Modern web browser** (Chrome, Firefox, Safari, Edge)
3. **Git** for cloning the repository

### Setup & Installation

```bash
# Clone the repository
git clone <https://github.com/Hemanth8104/-Intelligent-Alert-Escalation-Resolution-System.git>
cd MoveInSync

# Install backend dependencies
cd Backend
npm install

# Start the backend server
npm start
# Server will run on http://localhost:5000

# Open frontend (in a new terminal)
cd ../Frontend
# Serve the frontend (using any HTTP server)
# For example, using Python:
python -m http.server 3000
# Or using Node.js http-server:
npx http-server -p 3000

# Access the application
# Open browser and navigate to http://localhost:3000
```







---


## 📁 Code Structure

### Project Organization

```
MoveInSync/
├── Backend/                    # Server-side application
│   ├── controllers/           # Request handlers
│   │   └── AlertController.js # Alert CRUD operations
│   ├── services/             # Business logic layer
│   │   ├── AlertService.js   # Core alert processing
│   │   ├── RuleEngine.js     # Business rules engine
│   │   └── AlertStorageManager.js # Data persistence
│   ├── models/               # Data models
│   │   └── Alert.js          # Alert entity definition
│   ├── routes/               # API route definitions
│   │   └── api/alerts.js     # Alert endpoints
│   ├── config/               # Configuration files
│   │   ├── constants.js      # Application constants
│   │   └── database.js       # Database configuration
│   ├── utils/                # Utility functions
│   │   └── authMiddleware.js # Authentication middleware
│   ├── logs/                 # Application logs
│   ├── rules.json           # Business rules configuration
│   ├── package.json         # Dependencies and scripts
│   └── index.js             # Application entry point
│
└── Frontend/                  # Client-side application
   ├── index.html            # Main HTML structure
   ├── styles.css            # Modern dark theme styling
   └── script.js             # Interactive functionality


```

### Key Files 

#### Backend Entry Point (`Backend/index.js`)
- Express server configuration
- Middleware setup (security, CORS, parsing)
- Route mounting
- Health check endpoint
- Server startup logic

#### Alert Controller (`Backend/controllers/AlertController.js`)
- HTTP request handling
- Input validation
- Response formatting
- Error handling
- Service layer integration

#### Alert Service (`Backend/services/AlertService.js`)
- Business logic implementation
- Alert processing workflows
- Rule engine integration
- Data persistence coordination

#### Frontend Dashboard (`Frontend/script.js`)
- Dashboard initialization
- Real-time data loading
- Chart visualization
- User interaction handling
- Modal management
- Filter and search functionality

---
