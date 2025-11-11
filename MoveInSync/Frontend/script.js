// API Configuration
const API_BASE = '/api';

// Global variables
let alertTrendsChart = null;
let currentFilters = {};
let allAlerts = [];
let dashboardData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboard();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboard, 30000);
});

// Initialize application
async function initializeApp() {
    showLoading(true);
    try {
        await checkSystemHealth();
        await loadDashboard();
        showToast('Dashboard loaded successfully', 'success');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load dashboard', 'error');
    } finally {
        showLoading(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('createAlertForm').addEventListener('submit', handleCreateAlert);
    
    // Modal close handlers
    window.onclick = function(event) {
        const createModal = document.getElementById('createAlertModal');
        const detailModal = document.getElementById('alertDetailModal');
        
        if (event.target === createModal) {
            closeCreateAlertModal();
        }
        if (event.target === detailModal) {
            closeAlertDetailModal();
        }
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            openCreateAlertModal();
        }
        if (event.key === 'Escape') {
            closeCreateAlertModal();
            closeAlertDetailModal();
        }
        if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
            event.preventDefault();
            refreshDashboard();
        }
    });
}

// API Functions
async function makeApiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

async function checkSystemHealth() {
    try {
        const health = await makeApiCall('/health', { method: 'GET' });
        updateConnectionStatus(true);
        return health;
    } catch (error) {
        updateConnectionStatus(false);
        throw error;
    }
}

async function createAlert(alertData) {
    return await makeApiCall('/alerts', {
        method: 'POST',
        body: JSON.stringify(alertData)
    });
}

async function getAlerts(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
    });
    
    const endpoint = `/alerts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await makeApiCall(endpoint);
}

async function getAlertById(alertId) {
    return await makeApiCall(`/alerts/${alertId}`);
}

async function resolveAlert(alertId, resolution) {
    return await makeApiCall(`/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution })
    });
}

async function getDashboardData() {
    return await makeApiCall('/dashboard');
}

async function getStats() {
    return await makeApiCall('/alerts/stats');
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showLoading(true);
        
        // Load all data in parallel
        const [dashboard, stats, alerts] = await Promise.all([
            getDashboardData(),
            getStats(),
            getAlerts(currentFilters)
        ]);
        
        dashboardData = dashboard.dashboard;
        allAlerts = alerts.alerts;
        
        // Update UI components
        updateDashboardStats(dashboardData);
        updateAlertsList(allAlerts);
        updateTopDriversList(dashboardData.topDrivers);
        updateAutoClosedList(dashboardData.recentAutoClosed);
        updateAlertTrendsChart(dashboardData.alertTrends);
        
        // Update counts
        document.getElementById('alertCount').textContent = alerts.pagination.total;
        
        console.log('Dashboard loaded:', {
            totalAlerts: alerts.pagination.total,
            activeAlerts: dashboardData.summary.totalActive,
            topDrivers: dashboardData.topDrivers.length
        });
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

function updateDashboardStats(data) {
    // Update severity distribution
    document.getElementById('criticalCount').textContent = data.severityDistribution.CRITICAL || 0;
    document.getElementById('highCount').textContent = data.severityDistribution.HIGH || 0;
    document.getElementById('mediumCount').textContent = data.severityDistribution.MEDIUM || 0;
    document.getElementById('lowCount').textContent = data.severityDistribution.LOW || 0;
    
    // Update summary stats
    document.getElementById('totalActive').textContent = data.summary.totalActive || 0;
    document.getElementById('escalationRate').textContent = `${data.summary.escalationRate || 0}%`;
}

function updateAlertsList(alerts) {
    const alertsList = document.getElementById('alertsList');
    
    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 3em; color: #cbd5e0; margin-bottom: 15px;"></i>
                <p style="color: #718096;">No alerts found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item" onclick="showAlertDetail('${alert.alertId}')">
            <div class="alert-header">
                <div>
                    <div class="alert-id">ID: ${alert.alertId.substring(0, 8)}...</div>
                    <strong style="color: #2d3748;">${alert.sourceType.replace('_', ' ').toUpperCase()}</strong>
                </div>
                <div style="display: flex; gap: 8px;">
                    <span class="severity-badge severity-${alert.severity.toLowerCase()}">${alert.severity}</span>
                    <span class="status-badge status-${alert.status.toLowerCase()}">${alert.status.replace('_', ' ')}</span>
                </div>
            </div>
            <div class="alert-content">
                ${getAlertDescription(alert)}
            </div>
            <div class="alert-meta">
                ${alert.metadata.driverId ? `<span><i class="fas fa-user"></i> ${alert.metadata.driverId}</span>` : ''}
                ${alert.metadata.vehicleId ? `<span><i class="fas fa-car"></i> ${alert.metadata.vehicleId}</span>` : ''}
                <span><i class="fas fa-clock"></i> ${formatTimestamp(alert.timestamp)}</span>
                <span><i class="fas fa-calendar"></i> Age: ${alert.age} days</span>
            </div>
        </div>
    `).join('');
}

function updateTopDriversList(topDrivers) {
    const driversList = document.getElementById('topDriversList');
    
    if (!topDrivers || topDrivers.length === 0) {
        driversList.innerHTML = `
            <div class="empty-state">
                <p style="color: #718096;">No driver data available</p>
            </div>
        `;
        return;
    }
    
    driversList.innerHTML = topDrivers.map((driver, index) => `
        <div class="driver-item">
            <div class="driver-info">
                <div class="driver-avatar">${driver.driverId.substring(0, 2).toUpperCase()}</div>
                <div>
                    <strong>${driver.driverId}</strong>
                    <div style="font-size: 0.8em; color: #718096;">Rank #${index + 1}</div>
                </div>
            </div>
            <div class="alert-count">${driver.alertCount}</div>
        </div>
    `).join('');
}

function updateAutoClosedList(recentAutoClosed) {
    const autoClosedList = document.getElementById('autoClosedList');
    
    if (!recentAutoClosed || recentAutoClosed.length === 0) {
        autoClosedList.innerHTML = `
            <div class="empty-state">
                <p style="color: #718096;">No recent auto-closed alerts</p>
            </div>
        `;
        return;
    }
    
    autoClosedList.innerHTML = recentAutoClosed.map(alert => `
        <div class="auto-closed-item" onclick="showAlertDetail('${alert.alertId}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <strong style="color: #2f855a;">${alert.sourceType.replace('_', ' ').toUpperCase()}</strong>
                <span style="font-size: 0.8em; color: #718096;">${formatTimestamp(alert.timestamp)}</span>
            </div>
            <p style="font-size: 0.9em; color: #4a5568;">${getAlertDescription(alert)}</p>
            <div style="margin-top: 8px; font-size: 0.8em; color: #718096;">
                <i class="fas fa-robot"></i> Auto-closed by system
            </div>
        </div>
    `).join('');
}

function updateAlertTrendsChart(alertTrends) {
    const ctx = document.getElementById('alertTrendsChart').getContext('2d');
    
    if (alertTrendsChart) {
        alertTrendsChart.destroy();
    }
    
    alertTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: alertTrends.map(trend => formatDate(trend.date)),
            datasets: [
                {
                    label: 'Total Alerts',
                    data: alertTrends.map(trend => trend.count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Escalated',
                    data: alertTrends.map(trend => trend.escalated),
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Auto-Closed',
                    data: alertTrends.map(trend => trend.autoClosed),
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// Filter Functions
function applyFilters() {
    currentFilters = {
        status: document.getElementById('statusFilter').value,
        severity: document.getElementById('severityFilter').value,
        sourceType: document.getElementById('sourceTypeFilter').value,
        driverId: document.getElementById('driverIdFilter').value
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    loadAlerts();
}

async function loadAlerts() {
    try {
        showLoading(true);
        const response = await getAlerts(currentFilters);
        allAlerts = response.alerts;
        updateAlertsList(allAlerts);
        document.getElementById('alertCount').textContent = response.pagination.total;
    } catch (error) {
        console.error('Failed to load alerts:', error);
        showToast('Failed to load alerts', 'error');
    } finally {
        showLoading(false);
    }
}

// Modal Functions
function openCreateAlertModal() {
    document.getElementById('createAlertModal').style.display = 'block';
    document.getElementById('alertSourceType').focus();
}

function closeCreateAlertModal() {
    document.getElementById('createAlertModal').style.display = 'none';
    document.getElementById('createAlertForm').reset();
}

async function handleCreateAlert(event) {
    event.preventDefault();
    
    const formData = {
        sourceType: document.getElementById('alertSourceType').value,
        severity: document.getElementById('alertSeverity').value,
        metadata: {
            driverId: document.getElementById('alertDriverId').value || null,
            vehicleId: document.getElementById('alertVehicleId').value || null,
            description: document.getElementById('alertDescription').value || null
        }
    };
    
    // Remove null values
    Object.keys(formData.metadata).forEach(key => {
        if (!formData.metadata[key]) {
            delete formData.metadata[key];
        }
    });
    
    try {
        showLoading(true);
        await createAlert(formData);
        closeCreateAlertModal();
        showToast('Alert created successfully', 'success');
        await loadDashboard();
    } catch (error) {
        console.error('Failed to create alert:', error);
        showToast('Failed to create alert', 'error');
    } finally {
        showLoading(false);
    }
}

async function showAlertDetail(alertId) {
    try {
        showLoading(true);
        const response = await getAlertById(alertId);
        const alert = response.alert;
        
        const detailContent = document.getElementById('alertDetailContent');
        detailContent.innerHTML = `
            <div class="alert-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Alert ID</div>
                    <div class="detail-value" style="font-family: monospace;">${alert.alertId}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Source Type</div>
                    <div class="detail-value">${alert.sourceType.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Severity</div>
                    <div class="detail-value">
                        <span class="severity-badge severity-${alert.severity.toLowerCase()}">${alert.severity}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge status-${alert.status.toLowerCase()}">${alert.status.replace('_', ' ')}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Created</div>
                    <div class="detail-value">${formatTimestamp(alert.timestamp)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Age</div>
                    <div class="detail-value">${alert.age} days</div>
                </div>
                ${alert.metadata.driverId ? `
                <div class="detail-item">
                    <div class="detail-label">Driver ID</div>
                    <div class="detail-value">${alert.metadata.driverId}</div>
                </div>` : ''}
                ${alert.metadata.vehicleId ? `
                <div class="detail-item">
                    <div class="detail-label">Vehicle ID</div>
                    <div class="detail-value">${alert.metadata.vehicleId}</div>
                </div>` : ''}
            </div>
            
            ${alert.metadata.description ? `
            <div class="detail-item" style="margin-bottom: 25px;">
                <div class="detail-label">Description</div>
                <div class="detail-value">${alert.metadata.description}</div>
            </div>` : ''}
            
            ${alert.resolution ? `
            <div class="detail-item" style="margin-bottom: 25px;">
                <div class="detail-label">Resolution</div>
                <div class="detail-value">${alert.resolution}</div>
                <div style="font-size: 0.8em; color: #718096; margin-top: 5px;">
                    Resolved on ${formatTimestamp(alert.resolvedAt)}
                </div>
            </div>` : ''}
            
            ${alert.status === 'OPEN' || alert.status === 'ESCALATED' ? `
            <div style="margin-bottom: 25px;">
                <button class="btn btn-primary" onclick="showResolveForm('${alert.alertId}')">
                    <i class="fas fa-check"></i> Resolve Alert
                </button>
            </div>` : ''}
            
            <div class="history-section">
                <h4 style="margin-bottom: 15px; color: #2d3748;">
                    <i class="fas fa-history"></i> History (${alert.history.length} events)
                </h4>
                ${alert.history.map(event => `
                    <div class="history-item">
                        <div class="history-action">${event.action.replace('_', ' ').toUpperCase()}</div>
                        <div class="history-details">${event.details}</div>
                        ${event.previousStatus ? `
                        <div class="history-details">
                            Changed from ${event.previousStatus}${event.previousSeverity ? ` (${event.previousSeverity})` : ''}
                        </div>` : ''}
                        <div class="history-timestamp">${formatTimestamp(event.timestamp)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('alertDetailModal').style.display = 'block';
        
    } catch (error) {
        console.error('Failed to load alert details:', error);
        showToast('Failed to load alert details', 'error');
    } finally {
        showLoading(false);
    }
}

function closeAlertDetailModal() {
    document.getElementById('alertDetailModal').style.display = 'none';
}

async function showResolveForm(alertId) {
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;
    
    try {
        showLoading(true);
        await resolveAlert(alertId, resolution);
        showToast('Alert resolved successfully', 'success');
        closeAlertDetailModal();
        await loadDashboard();
    } catch (error) {
        console.error('Failed to resolve alert:', error);
        showToast('Failed to resolve alert', 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function refreshDashboard() {
    showToast('Refreshing dashboard...', 'info');
    loadDashboard();
}

function updateConnectionStatus(isConnected) {
    const statusDot = document.getElementById('connectionStatus');
    statusDot.style.background = isConnected ? '#48bb78' : '#f56565';
    statusDot.title = isConnected ? 'System Online' : 'System Offline';
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('hidden', !show);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function getAlertDescription(alert) {
    if (alert.metadata.description) {
        return alert.metadata.description;
    }
    
    // Generate description based on alert type and metadata
    switch (alert.sourceType) {
        case 'overspeed':
            return `Speed: ${alert.metadata.speed || 'N/A'} km/h (Limit: ${alert.metadata.speedLimit || 'N/A'} km/h)`;
        case 'driver_fatigue':
            return `Continuous driving: ${alert.metadata.consecutiveDrivingHours || 'N/A'} hours`;
        case 'compliance':
            return `Document: ${alert.metadata.documentType || 'Unknown'} - ${alert.metadata.document_valid ? 'Valid' : 'Invalid'}`;
        case 'vehicle_maintenance':
            return `Maintenance: ${alert.metadata.maintenanceType || 'General'} - ${alert.metadata.maintenance_completed ? 'Completed' : 'Pending'}`;
        case 'feedback_negative':
            return `Rating: ${alert.metadata.rating || 'N/A'}/5 - ${alert.metadata.feedback || 'No details'}`;
        default:
            return 'Alert details available in metadata';
    }
}