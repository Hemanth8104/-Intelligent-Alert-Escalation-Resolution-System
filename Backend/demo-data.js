const http = require('http');

// Demo Driver Database with realistic Indian names
const DEMO_DRIVERS = [
    { id: 'DRV001', name: 'Rajesh Kumar', experience: 8, rating: 4.2 },
    { id: 'DRV002', name: 'Priya Sharma', experience: 5, rating: 4.8 },
    { id: 'DRV003', name: 'Amit Patel', experience: 12, rating: 3.9 },
    { id: 'DRV004', name: 'Suresh Singh', experience: 6, rating: 3.2 },
    { id: 'DRV005', name: 'Meera Reddy', experience: 4, rating: 4.5 },
    { id: 'DRV006', name: 'Vikram Gupta', experience: 10, rating: 3.7 },
    { id: 'DRV007', name: 'Lakshmi Nair', experience: 7, rating: 4.6 },
    { id: 'DRV008', name: 'Arjun Mehta', experience: 3, rating: 3.8 },
    { id: 'DRV009', name: 'Kavya Iyer', experience: 9, rating: 4.1 },
    { id: 'DRV010', name: 'Rohit Joshi', experience: 11, rating: 3.5 }
];

// Demo Vehicle Database
const DEMO_VEHICLES = [
    'MH12AB1234', 'KA05CD5678', 'DL08EF9012', 'TN09GH3456', 'GJ01IJ7890',
    'UP16KL2345', 'RJ14MN6789', 'MP09PQ0123', 'WB19RS4567', 'AP28TU8901'
];

// Demo Locations
const DEMO_LOCATIONS = [
    'Mumbai-Pune Highway', 'Bangalore Electronic City', 'Delhi NCR Expressway',
    'Chennai OMR Road', 'Hyderabad HITEC City', 'Ahmedabad SG Highway',
    'Kolkata EM Bypass', 'Pune Hinjewadi', 'Gurgaon Cyber City', 'Noida Sector 62'
];

// API Configuration
const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Utility functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomDriver() {
    return getRandomElement(DEMO_DRIVERS);
}

function getRandomVehicle() {
    return getRandomElement(DEMO_VEHICLES);
}

function getRandomLocation() {
    return getRandomElement(DEMO_LOCATIONS);
}

function getRandomSpeed(baseSpeed = 60) {
    return baseSpeed + Math.floor(Math.random() * 40); // 60-100 km/h
}

function getRandomRating() {
    return Math.floor(Math.random() * 3) + 1; // 1-3 rating (poor)
}

function getRandomDate(hoursAgo = 24) {
    const now = new Date();
    const randomHours = Math.floor(Math.random() * hoursAgo);
    return new Date(now.getTime() - (randomHours * 60 * 60 * 1000));
}

// Demo Data Generators

async function createOverspeedScenario() {
    console.log(' Creating Overspeed Escalation Scenario...');
    const driver = getRandomDriver();
    const vehicle = getRandomVehicle();
    const location = getRandomLocation();
    
    // Create 4 overspeed alerts for same driver within 1 hour to trigger escalation
    for (let i = 0; i < 4; i++) {
        const alertData = {
            sourceType: 'overspeed',
            severity: 'MEDIUM',
            metadata: {
                driverId: driver.id,
                driverName: driver.name,
                vehicleId: vehicle,
                speed: getRandomSpeed(80),
                speedLimit: 60,
                location: location,
                violationCount: i + 1,
                timestamp: new Date(Date.now() - (i * 10 * 60 * 1000)).toISOString() // 10 min intervals
            }
        };
        
        try {
            const response = await makeRequest('POST', '/api/alerts', alertData);
            console.log(`   Overspeed Alert ${i + 1}: ${driver.name} (${driver.id}) - ${alertData.metadata.speed} km/h`);
            
            if (i === 2) {
                console.log(`    Expected: 3rd alert should trigger CRITICAL escalation`);
            }
        } catch (error) {
            console.error(`Failed to create overspeed alert ${i + 1}:`, error.message);
        }
    }
}

async function createDriverFatigueScenario() {
    console.log('\n Creating Driver Fatigue Scenario...');
    const driver = getRandomDriver();
    const vehicle = getRandomVehicle();
    
    const alertData = {
        sourceType: 'driver_fatigue',
        severity: 'LOW',
        metadata: {
            driverId: driver.id,
            driverName: driver.name,
            vehicleId: vehicle,
            consecutiveDrivingHours: 9,
            lastBreak: '6 hours ago',
            location: getRandomLocation(),
            shiftStartTime: new Date(Date.now() - (9 * 60 * 60 * 1000)).toISOString()
        }
    };
    
    try {
        const response = await makeRequest('POST', '/api/alerts', alertData);
        console.log(`   Fatigue Alert: ${driver.name} - 9 hours continuous driving`);
        console.log(`    Expected: Should immediately escalate to CRITICAL`);
    } catch (error) {
        console.error('Failed to create fatigue alert:', error.message);
    }
}

async function createComplianceScenarios() {
    console.log('\n Creating Compliance Scenarios...');
    
    // Scenario 1: Auto-close compliance alert
    const driver1 = getRandomDriver();
    const autoCloseAlert = {
        sourceType: 'compliance',
        severity: 'MEDIUM',
        metadata: {
            driverId: driver1.id,
            driverName: driver1.name,
            documentType: 'driving_license',
            expiryDate: '2026-03-15',
            document_valid: true, // This should trigger auto-close
            renewalDate: new Date().toISOString()
        }
    };
    
    try {
        const response = await makeRequest('POST', '/api/alerts', autoCloseAlert);
        console.log(`   Compliance Auto-Close: ${driver1.name} - License renewed (should auto-close)`);
    } catch (error) {
        console.error('Failed to create auto-close compliance alert:', error.message);
    }
    
    // Scenario 2: Open compliance alert
    const driver2 = getRandomDriver();
    const openAlert = {
        sourceType: 'compliance',
        severity: 'HIGH',
        metadata: {
            driverId: driver2.id,
            driverName: driver2.name,
            documentType: 'vehicle_registration',
            expiryDate: '2025-11-20',
            document_valid: false,
            daysToExpiry: 10
        }
    };
    
    try {
        const response = await makeRequest('POST', '/api/alerts', openAlert);
        console.log(`   Compliance Open: ${driver2.name} - Registration expiring in 10 days`);
    } catch (error) {
        console.error('Failed to create open compliance alert:', error.message);
    }
}

async function createNegativeFeedbackScenario() {
    console.log('\n Creating Negative Feedback Escalation Scenario...');
    const driver = getRandomDriver();
    
    // Create 3 negative feedback alerts for same driver within 24 hours
    for (let i = 0; i < 3; i++) {
        const feedbacks = [
            'Rude behavior with passenger',
            'Unsafe driving - sudden braking',
            'Vehicle not clean and poorly maintained'
        ];
        
        const alertData = {
            sourceType: 'feedback_negative',
            severity: 'LOW',
            metadata: {
                driverId: driver.id,
                driverName: driver.name,
                vehicleId: getRandomVehicle(),
                rating: getRandomRating(),
                feedback: feedbacks[i],
                customerId: `CUST${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                tripId: `TRIP2025${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                timestamp: new Date(Date.now() - (i * 4 * 60 * 60 * 1000)).toISOString() // 4 hour intervals
            }
        };
        
        try {
            const response = await makeRequest('POST', '/api/alerts', alertData);
            console.log(`   Feedback ${i + 1}: ${driver.name} - Rating ${alertData.metadata.rating}/5`);
            
            if (i === 1) {
                console.log(`    Expected: 2nd feedback should trigger HIGH escalation`);
            }
        } catch (error) {
            console.error(`Failed to create feedback alert ${i + 1}:`, error.message);
        }
    }
}

async function createMaintenanceScenarios() {
    console.log('\n🔧 Creating Vehicle Maintenance Scenarios...');
    
    // Scenario 1: Auto-close maintenance alert
    const vehicle1 = getRandomVehicle();
    const completedMaintenance = {
        sourceType: 'vehicle_maintenance',
        severity: 'MEDIUM',
        metadata: {
            vehicleId: vehicle1,
            driverId: getRandomDriver().id,
            maintenanceType: 'oil_change',
            scheduledDate: '2025-11-08',
            maintenance_completed: true, // Should trigger auto-close
            completedDate: new Date().toISOString(),
            mechanicId: 'MECH001'
        }
    };
    
    try {
        const response = await makeRequest('POST', '/api/alerts', completedMaintenance);
        console.log(`   Maintenance Complete: ${vehicle1} - Oil change completed (should auto-close)`);
    } catch (error) {
        console.error('Failed to create completed maintenance alert:', error.message);
    }
    
    // Scenario 2: Overdue maintenance
    const vehicle2 = getRandomVehicle();
    const overdueMaintenance = {
        sourceType: 'vehicle_maintenance',
        severity: 'HIGH',
        metadata: {
            vehicleId: vehicle2,
            driverId: getRandomDriver().id,
            maintenanceType: 'brake_inspection',
            scheduledDate: '2025-11-05',
            maintenance_completed: false,
            daysOverdue: 5,
            lastServiceDate: '2025-09-15'
        }
    };
    
    try {
        const response = await makeRequest('POST', '/api/alerts', overdueMaintenance);
        console.log(`   Maintenance Overdue: ${vehicle2} - Brake inspection 5 days overdue`);
    } catch (error) {
        console.error('Failed to create overdue maintenance alert:', error.message);
    }
}

async function createDocumentExpiryScenarios() {
    console.log('\n Creating Document Expiry Scenarios...');
    
    // Various document expiry alerts
    const documentTypes = [
        { type: 'driving_license', days: 15 },
        { type: 'vehicle_insurance', days: 7 },
        { type: 'pollution_certificate', days: 3 },
        { type: 'fitness_certificate', days: 30 }
    ];
    
    for (const doc of documentTypes) {
        const driver = getRandomDriver();
        const alertData = {
            sourceType: 'document_expiry',
            severity: doc.days <= 7 ? 'CRITICAL' : doc.days <= 15 ? 'HIGH' : 'MEDIUM',
            metadata: {
                driverId: driver.id,
                driverName: driver.name,
                vehicleId: getRandomVehicle(),
                documentType: doc.type,
                expiryDate: new Date(Date.now() + (doc.days * 24 * 60 * 60 * 1000)).toISOString(),
                daysToExpiry: doc.days,
                documentNumber: `DOC${Math.floor(Math.random() * 100000)}`
            }
        };
        
        try {
            const response = await makeRequest('POST', '/api/alerts', alertData);
            console.log(`   Document Expiry: ${driver.name} - ${doc.type} expires in ${doc.days} days`);
        } catch (error) {
            console.error(`Failed to create document expiry alert for ${doc.type}:`, error.message);
        }
    }
}

async function createHistoricalAlerts() {
    console.log('\n Creating Historical Alerts for Trend Analysis...');
    
    const alertTypes = ['overspeed', 'compliance', 'feedback_negative', 'vehicle_maintenance'];
    
    // Create alerts for the past 7 days
    for (let day = 1; day <= 7; day++) {
        const alertCount = Math.floor(Math.random() * 5) + 2; // 2-6 alerts per day
        
        for (let i = 0; i < alertCount; i++) {
            const driver = getRandomDriver();
            const sourceType = getRandomElement(alertTypes);
            const alertDate = new Date(Date.now() - (day * 24 * 60 * 60 * 1000));
            
            const alertData = {
                sourceType: sourceType,
                severity: getRandomElement(['LOW', 'MEDIUM', 'HIGH']),
                metadata: {
                    driverId: driver.id,
                    driverName: driver.name,
                    vehicleId: getRandomVehicle(),
                    location: getRandomLocation(),
                    historicalDate: alertDate.toISOString(),
                    generatedFor: 'trend_analysis'
                }
            };
            
            try {
                await makeRequest('POST', '/api/alerts', alertData);
            } catch (error) {
                console.error(`Failed to create historical alert:`, error.message);
            }
        }
        
        console.log(`   Day -${day}: Created ${alertCount} alerts`);
    }
}

async function createResolvedAlerts() {
    console.log('\n Creating Some Resolved Alerts...');
    
    // Create alerts and then resolve them
    for (let i = 0; i < 3; i++) {
        const driver = getRandomDriver();
        const alertData = {
            sourceType: 'overspeed',
            severity: 'MEDIUM',
            metadata: {
                driverId: driver.id,
                driverName: driver.name,
                vehicleId: getRandomVehicle(),
                speed: getRandomSpeed(70),
                speedLimit: 60,
                location: getRandomLocation()
            }
        };
        
        try {
            const createResponse = await makeRequest('POST', '/api/alerts', alertData);
            const alertId = createResponse.data.alert.alertId;
            
            // Resolve the alert
            const resolution = `Driver ${driver.name} counseled about speed limits. Defensive driving course scheduled.`;
            await makeRequest('PATCH', `/api/alerts/${alertId}/resolve`, { resolution });
            
            console.log(`   Resolved: ${driver.name} - Speed violation resolved`);
        } catch (error) {
            console.error(`Failed to create/resolve alert:`, error.message);
        }
    }
}

// Main demo data creation function
async function createDemoData() {
    console.log(' Creating Comprehensive Demo Data for MoveInSync Alert Management System\n');
    console.log(' Demo Drivers Database:');
    DEMO_DRIVERS.forEach(driver => {
        console.log(`   ${driver.id}: ${driver.name} (${driver.experience} years, ${driver.rating}⭐)`);
    });
    console.log();

    try {
        // Check if server is running
        const healthCheck = await makeRequest('GET', '/health');
        console.log(' Server is running, proceeding with demo data creation...\n');

        // Create various scenarios
        await createOverspeedScenario();
        await createDriverFatigueScenario();
        await createComplianceScenarios();
        await createNegativeFeedbackScenario();
        await createMaintenanceScenarios();
        await createDocumentExpiryScenarios();
        await createHistoricalAlerts();
        await createResolvedAlerts();

        // Trigger background processing
        console.log('\n Triggering Background Processing...');
        await makeRequest('POST', '/api/alerts/process');

        console.log('\n Demo Data Creation Complete!');
        console.log('\n Summary of Created Scenarios:');
        console.log('    Overspeed Escalation: 4 alerts → should escalate to CRITICAL');
        console.log('    Driver Fatigue: 1 alert → immediate CRITICAL escalation');
        console.log('    Compliance: 2 alerts → 1 auto-close, 1 open');
        console.log('    Negative Feedback: 3 alerts → should escalate to HIGH');
        console.log('    Maintenance: 2 alerts → 1 auto-close, 1 overdue');
        console.log('    Document Expiry: 4 alerts → various severities');
        console.log('    Historical Data: 7 days of trend data');
        console.log('    Resolved Alerts: 3 manually resolved examples');

        console.log('\n View the dashboard at: http://localhost:3000');
        console.log('\n Demo Features to Explore:');
        console.log('   • Real-time severity distribution');
        console.log('   • Top drivers with most alerts');
        console.log('   • Auto-closed alerts transparency');
        console.log('   • 7-day alert trends chart');
        console.log('   • Click on any alert for detailed view');
        console.log('   • Filter alerts by status, severity, type, driver');
        console.log('   • Create new alerts using the + button');
        console.log('   • Watch background jobs process alerts every 2 minutes');

    } catch (error) {
        console.error(' Error creating demo data:', error.message);
        console.log('\n Make sure the server is running:');
        console.log('   cd Backend && npm start');
    }
}

// Export for use in other files
module.exports = {
    createDemoData,
    DEMO_DRIVERS,
    DEMO_VEHICLES,
    DEMO_LOCATIONS
};

// Run if called directly
if (require.main === module) {
    createDemoData();
}
