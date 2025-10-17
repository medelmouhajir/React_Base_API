import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../../services/apiClient';
import './SpeedingAlertsPage.css';

const SpeedingAlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        severity: '',
        isAcknowledged: '',
        deviceSerialNumber: '',
        fromDate: '',
        toDate: ''
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAlerts();
        fetchStats();
    }, [page, filters]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page,
                pageSize: 20,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            });

            const response = await apiClient.get(`/SpeedingAlerts?${params}`);
            setAlerts(response.data.alerts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching speeding alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/SpeedingAlerts/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        try {
            const username = localStorage.getItem('username') || 'Manager';
            const notes = prompt('Enter notes (optional):');

            await apiClient.put(`/SpeedingAlerts/${alertId}/acknowledge`, {
                acknowledgedBy: username,
                notes: notes
            });

            // Refresh alerts
            fetchAlerts();
            fetchStats();
            alert('Alert acknowledged successfully');
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            alert('Failed to acknowledge alert');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Low': return '#ffc107';
            case 'Medium': return '#ff9800';
            case 'High': return '#ff5722';
            case 'Critical': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    const getSeverityBadge = (severity) => {
        return (
            <span 
                className="severity-badge" 
                style={{ backgroundColor: getSeverityColor(severity) }}
            >
                {severity}
            </span>
        );
    };

    const openInGoogleMaps = (lat, lon) => {
        window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
    };

    return (
        <div className="speeding-alerts-container">
            <h1>🚨 Speeding Alerts</h1>

            {/* Statistics Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Alerts</h3>
                        <div className="stat-value">{stats.totalAlerts}</div>
                    </div>
                    <div className="stat-card warning">
                        <h3>Unacknowledged</h3>
                        <div className="stat-value">{stats.unacknowledgedAlerts}</div>
                    </div>
                    {stats.bySeverity?.map(item => (
                        <div key={item.severity} className="stat-card">
                            <h3>{item.severity}</h3>
                            <div className="stat-value">{item.count}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <input
                    type="text"
                    placeholder="Device Serial Number"
                    value={filters.deviceSerialNumber}
                    onChange={(e) => setFilters({ ...filters, deviceSerialNumber: e.target.value })}
                />
                
                <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                    <option value="">All Severities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>

                <select
                    value={filters.isAcknowledged}
                    onChange={(e) => setFilters({ ...filters, isAcknowledged: e.target.value })}
                >
                    <option value="">All Alerts</option>
                    <option value="false">Unacknowledged</option>
                    <option value="true">Acknowledged</option>
                </select>

                <input
                    type="date"
                    placeholder="From Date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                />

                <input
                    type="date"
                    placeholder="To Date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                />

                <button onClick={() => {
                    setFilters({
                        severity: '',
                        isAcknowledged: '',
                        deviceSerialNumber: '',
                        fromDate: '',
                        toDate: ''
                    });
                    setPage(1);
                }}>
                    Clear Filters
                </button>
            </div>

            {/* Alerts Table */}
            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="alerts-table-container">
                        <table className="alerts-table">
                            <thead>
                                <tr>
                                    <th>Severity</th>
                                    <th>Device / Car</th>
                                    <th>Date & Time</th>
                                    <th>Speed</th>
                                    <th>Limit</th>
                                    <th>Exceeded By</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(alert => (
                                    <tr key={alert.id} className={alert.isAcknowledged ? 'acknowledged' : ''}>
                                        <td>{getSeverityBadge(alert.severity)}</td>
                                        <td>
                                            <div className="device-info">
                                                <strong>{alert.deviceSerialNumber}</strong>
                                                <small>{alert.installCarPlate}</small>
                                            </div>
                                        </td>
                                        <td>{new Date(alert.timestamp).toLocaleString()}</td>
                                        <td className="speed-actual">{alert.actualSpeedKmh.toFixed(1)} km/h</td>
                                        <td className="speed-limit">{alert.speedLimitKmh} km/h</td>
                                        <td className="exceeded">
                                            <div>+{alert.exceededByKmh.toFixed(1)} km/h</div>
                                            <small>({alert.exceededByPercentage.toFixed(1)}%)</small>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-map"
                                                onClick={() => openInGoogleMaps(alert.latitude, alert.longitude)}
                                            >
                                                📍 View Map
                                            </button>
                                        </td>
                                        <td>
                                            {alert.isAcknowledged ? (
                                                <span className="status-acknowledged">✓ Acknowledged</span>
                                            ) : (
                                                <span className="status-pending">⏳ Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            {!alert.isAcknowledged && (
                                                <button 
                                                    className="btn-acknowledge"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SpeedingAlertsPage;