# MoveInSync Enhanced Alert Management System

A comprehensive, production-ready Intelligent Alert Escalation & Resolution System for MoveInSync's fleet monitoring with advanced features including OOP architecture, Redis integration, background jobs, and real-time dashboard.

##  Enhanced Features

###  Architecture Enhancements
- **Object-Oriented Design**: Clean separation of concerns with proper classes
- **Redis Integration**: High-performance data storage with automatic fallback to in-memory
- **Background Processing**: Automated alert processing every 2 minutes (configurable)
- **Environment Configuration**: Comprehensive .env-based configuration
- **Error Handling**: Production-ready error handling and logging

###  Core Capabilities
- **Centralized Alert Management**: Multi-source alert ingestion with unified format
- **Intelligent Rule Engine**: Dynamic, configurable escalation and auto-close rules
- **Auto-Close Background Jobs**: Periodic scanning for auto-closure conditions
- **Document Renewal Auto-Close**: Compliance alerts automatically close when documents are renewed (via UI or API)
- **Comprehensive Dashboard**: Real-time analytics and fleet performance metrics
- **Advanced Filtering**: Enhanced search with pagination and driver/vehicle tracking

##  System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Fleet Modules  │───▶│  Alert Manager   │───▶│  Enhanced Features  │
│  (Safety,       │    │  - OOP Structure │    │  - Redis Storage    │
│   Compliance,   │    │  - Redis Storage │    │  - Background Jobs  │
│   Feedback)     │    │  - Rule Engine   │    │  - Dashboard API    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │
                                ▼
                       ┌─────────────────────┐
                       │  Background Worker  │
                       │  - Auto-Close Scan  │
                       │  - Alert Expiry     │
                       │  - Rule Evaluation  │
                       └─────────────────────┘
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js >= 14.0.0
- Redis Server (optional but recommended)

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env
# Edit .env file with your settings

# 3. Start the server
npm start

# 4. Run comprehensive tests
npm test
```

### Optional Redis Setup
```bash
# Install Redis (Windows with Chocolatey)
choco install redis-64

# Or use Docker
docker run -d -p 6379:6379 redis:alpine

# The system works without Redis (falls back to in-memory storage)
```

##  Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Alert Configuration
ALERT_EXPIRY_DAYS=30
BACKGROUND_JOB_INTERVAL_MINUTES=2
ESCALATION_COOLDOWN_MINUTES=60

# Dashboard Configuration
TOP_DRIVERS_LIMIT=5
RECENT_ALERTS_LIMIT=10

# Rule Engine Configuration
RULES_FILE_PATH=./rules.json
AUTO_SAVE_RULES=true
```

##  Enhanced API Endpoints

### Core Alert Management
- `POST /api/alerts` - Create new alert
- `GET /api/alerts` - Get alerts with advanced filtering & pagination
- `GET /api/alerts/:id` - Get specific alert with full history
- `PATCH /api/alerts/:id/resolve` - Resolve alert with resolution tracking

### Dashboard & Analytics
- `GET /api/dashboard` - Comprehensive dashboard data
- `GET /api/alerts/stats` - Enhanced alert statistics
- `GET /health` - System health with Redis status

### Rule Management
- `GET /api/rules` - Get current rule configuration
- `PUT /api/rules` - Update rules dynamically
- `POST /api/alerts/process` - Manual background processing trigger

##  Alert Types & Enhanced Rules

### Rule Configuration (rules.json)
```json
{
  "overspeed": {
    "escalate_if_count": 3,
    "window_mins": 60,
    "escalate_to_severity": "CRITICAL",
    "auto_close_if": "speed_normalized"
  },
  "driver_fatigue": {
    "escalate_if_count": 1,
    "window_mins": 30,
    "escalate_to_severity": "CRITICAL",
    "auto_close_if": "driver_rested"
  },
  "compliance": {
    "auto_close_if": "document_valid",
    "escalate_if_days": 7,
    "escalate_to_severity": "HIGH"
  }
}
```

### Enhanced Rule Features
- **Count-based escalation**: Multiple alerts within time windows
- **Age-based escalation**: Alerts escalating after specific days
- **Auto-close conditions**: Automatic closure when conditions are met
- **Cooldown periods**: Prevention of rapid re-escalations
- **Dynamic updates**: Rules can be modified without system restart

##  Background Jobs

### Auto-Close Background Worker
- **Frequency**: Every 2 minutes (configurable)
- **Idempotent**: Safe to run multiple times
- **Conditions**: Scans all active alerts for auto-close triggers
- **Logging**: Detailed logging of all actions taken

### Document Expiry Management
- **Automatic expiry**: Alerts older than configured days
- **Status tracking**: Proper state transitions
- **History preservation**: Complete audit trail maintained
- **Document Expiry Auto-Close**: Automatically closes compliance alerts once renewal is detected

##  Dashboard Features

### Real-Time Analytics
- **Severity Distribution**: Active alerts by severity (Critical, High, Medium, Low)
- **Top Drivers**: Drivers with most active alerts
- **Recent Auto-Closed**: Transparency into automated actions
- **Alert Trends**: 7-day trend analysis with escalation patterns

### Performance Metrics
- **Total Active Alerts**: Currently unresolved alerts
- **Today's Activity**: Alerts created today
- **Escalation Rate**: Percentage of alerts that get escalated
- **Average Alert Age**: System performance indicator

##  Enhanced Alert Lifecycle

```
CREATE → PROCESS → [ESCALATE/AUTO_CLOSE] → RESOLVE/EXPIRE
   ↓         ↓              ↓                    ↓
OPEN → OPEN/ESCALATED → ESCALATED/AUTO_CLOSED → RESOLVED/EXPIRED
```

### State Transitions
- **OPEN**: Newly created, awaiting processing
- **ESCALATED**: Escalated due to rule conditions
- **AUTO_CLOSED**: Automatically closed by background jobs
- **RESOLVED**: Manually resolved by operations team
- **EXPIRED**: Auto-expired after configured time

##  OOP Architecture

### Core Classes

#### `Alert` Class
- Encapsulates alert data and behavior
- Methods: `escalate()`, `autoClose()`, `resolve()`, `expire()`
- History tracking and validation

#### `RuleEngine` Class
- Rule evaluation and management
- Cache optimization for performance
- Dynamic rule updates

#### `AlertStorageManager` Class
- Handles Redis and in-memory storage
- Indexing for performance
- Automatic fallback mechanisms

#### `AlertManager` Class
- Main orchestration class
- Background job management
- Business logic coordination

### Design Patterns Used
- **Factory Pattern**: Alert creation
- **Strategy Pattern**: Storage mechanisms (Redis/Memory)
- **Observer Pattern**: Background job scheduling
- **Repository Pattern**: Data access abstraction

##  Performance Features

### Redis Integration
- **Primary Storage**: High-performance alert storage
- **Indexing**: Driver and vehicle-based indices
- **Automatic Fallback**: Seamless fallback to in-memory storage
- **Connection Management**: Robust connection handling with retries

### Optimization Features
- **Pagination**: Efficient data loading
- **Caching**: Rule evaluation caching
- **Batch Processing**: Efficient background operations
- **Memory Management**: Automatic cleanup of expired data

##  Business Use Cases

### Fleet Safety Management
```javascript
// Overspeed alert with automatic escalation
{
  "sourceType": "overspeed",
  "metadata": {
    "driverId": "DRV001",
    "vehicleId": "MH12AB1234",
    "speed": 85,
    "speedLimit": 60,
    "location": "Highway NH-8"
  }
}
```

### Compliance Monitoring
```javascript
// Document compliance with auto-close
{
  "sourceType": "compliance",
  "metadata": {
    "driverId": "DRV003",
    "documentType": "license",
    "document_valid": true  // Auto-closes alert
  }
}
```

### Driver Performance Tracking
```javascript
// Negative feedback escalation
{
  "sourceType": "feedback_negative",
  "metadata": {
    "driverId": "DRV004",
    "rating": 2,
    "feedback": "Unsafe driving behavior"
  }
}
```

##  Testing & Quality Assurance

### Comprehensive Test Suite
- **Health Check Testing**: System status verification
- **Rule Engine Testing**: Dynamic rule evaluation
- **Background Job Testing**: Automated processing verification
- **Dashboard Testing**: Analytics and metrics validation
- **Auto-Close Testing**: Condition-based closure verification

### Test Scenarios
- Multi-alert escalation patterns
- Driver fatigue immediate escalation
- Auto-close condition verification
- Background job idempotency
- Redis failover testing

##  Production Deployment

### Environment Setup
1. **Production Environment**: Set `NODE_ENV=production`
2. **Redis Configuration**: Configure production Redis instance
3. **Process Management**: Use PM2 or similar for process management
4. **Monitoring**: Implement health check monitoring
5. **Logging**: Configure appropriate log levels

### Scaling Considerations
- **Horizontal Scaling**: Multiple instances with shared Redis
- **Load Balancing**: API endpoint load distribution
- **Database Scaling**: Redis clustering for large deployments
- **Background Jobs**: Distributed job processing

##  Security & Compliance

### Security Features
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **Environment Isolation**: Configuration through environment variables
- **Rate Limiting**: Built-in request throttling (configurable)

### Compliance Features
- **Audit Trail**: Complete history tracking
- **Data Retention**: Configurable alert expiration
- **Access Control**: Role-based API access (extensible)

##  Development Scripts

```bash
# Development with auto-reload
npm run dev

# Run tests with watch mode
npm run test:watch

# Quick health check
npm run health

# View dashboard data
npm run dashboard

# Check system statistics
npm run stats
```

##  API Examples

### Creating Alerts with Rich Metadata
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "overspeed",
    "severity": "MEDIUM",
    "metadata": {
      "driverId": "DRV001",
      "vehicleId": "MH12AB1234",
      "speed": 85,
      "speedLimit": 60,
      "location": "Highway NH-8",
      "timestamp": "2025-11-10T10:30:00Z"
    }
  }'
```

### Advanced Filtering
```bash
# Get alerts by driver with pagination
curl "http://localhost:3000/api/alerts?driverId=DRV001&limit=10&offset=0"

# Get escalated alerts only
curl "http://localhost:3000/api/alerts?status=ESCALATED"

# Get critical severity alerts
curl "http://localhost:3000/api/alerts?severity=CRITICAL"
```

### Dashboard Analytics
```bash
# Get comprehensive dashboard data
curl http://localhost:3000/api/dashboard
```

##  Background Job Details

### Processing Logic
1. **Idempotent Operations**: Safe to run multiple times
2. **Escalation Prevention**: Cooldown periods to prevent loops
3. **Condition Evaluation**: Dynamic rule-based processing
4. **History Tracking**: Complete audit trail of all actions

### Monitoring Background Jobs
- Check server logs for processing status
- Use `/health` endpoint to verify job status
- Monitor alert statistics for processing effectiveness

##  Rule Engine Deep Dive

### DSL-Like Syntax
```json
{
  "alert_type": {
    "escalate_if_count": 3,           // Number of alerts to trigger escalation
    "window_mins": 60,                // Time window in minutes
    "escalate_if_days": 7,            // Age-based escalation in days
    "escalate_to_severity": "CRITICAL", // Target severity level
    "auto_close_if": "condition_met"   // Auto-close condition key
  }
}
```

### Rule Evaluation Process
1. **Load Rules**: Dynamic loading from configuration
2. **Cache Management**: Performance optimization
3. **Condition Checking**: Multiple rule types evaluation
4. **Action Execution**: Escalation or auto-close actions
5. **History Recording**: Complete audit trail

##  Future Enhancements

### Planned Features
- **WebSocket Integration**: Real-time notifications
- **Machine Learning**: Predictive alert escalation
- **Advanced Dashboard**: Interactive charts and graphs
- **Mobile API**: Mobile application support
- **Multi-Tenant Support**: Organization-based isolation

### Extensibility Points
- **Custom Rule Types**: Plugin-based rule extensions
- **External Integrations**: Third-party system connectors
- **Custom Storage**: Alternative storage backends
- **Notification Systems**: SMS, Email, Slack integrations

---

*Version 2.0.0 - Enhanced with OOP, Redis, Background Jobs, and Dashboard*
