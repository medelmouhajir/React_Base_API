import { useState, useEffect } from 'react';
import {
    Bell,
    BellOff,
    Car,
    MapPin,
    Wrench,
    Settings,
    Shield,
    Clock,
    Save
} from 'lucide-react';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useWebPush } from '../../../hooks/useWebPush';
import { useTheme } from '../../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import './NotificationPreferences.css';

const NotificationPreferences = () => {
    const { preferences, updatePreferences } = useNotifications();
    const {
        isSupported,
        permission,
        requestPermission,
        unsubscribeFromPush
    } = useWebPush();
    const { isDarkMode } = useTheme();

    const [formData, setFormData] = useState({
        enablePush: true,
        reservationNotifications: true,
        gpsAlerts: true,
        maintenanceAlerts: true,
        systemNotifications: true,
        securityAlerts: true,
        criticalOnly: false,
        quietHoursStart: null,
        quietHoursEnd: null
    });

    const [isSaving, setIsSaving] = useState(false);

    // Load preferences
    useEffect(() => {
        if (preferences) {
            setFormData({
                enablePush: preferences.enablePush,
                reservationNotifications: preferences.reservationNotifications,
                gpsAlerts: preferences.gpsAlerts,
                maintenanceAlerts: preferences.maintenanceAlerts,
                systemNotifications: preferences.systemNotifications,
                securityAlerts: preferences.securityAlerts,
                criticalOnly: preferences.criticalOnly,
                quietHoursStart: preferences.quietHoursStart
                    ? `${String(preferences.quietHoursStart.hours).padStart(2, '0')}:${String(preferences.quietHoursStart.minutes).padStart(2, '0')}`
                    : '',
                quietHoursEnd: preferences.quietHoursEnd
                    ? `${String(preferences.quietHoursEnd.hours).padStart(2, '0')}:${String(preferences.quietHoursEnd.minutes).padStart(2, '0')}`
                    : ''
            });
        }
    }, [preferences]);

    const handleToggle = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleTimeChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEnablePush = async () => {
        if (permission === 'denied') {
            toast.error('Push notifications are blocked. Please enable them in your browser settings.');
            return;
        }

        if (permission === 'granted') {
            // Unsubscribe
            await unsubscribeFromPush();
            setFormData(prev => ({ ...prev, enablePush: false }));
            toast.success('Push notifications disabled');
        } else {
            // Request permission and subscribe
            const granted = await requestPermission();
            if (granted) {
                setFormData(prev => ({ ...prev, enablePush: true }));
                toast.success('Push notifications enabled');
            }
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Parse time strings
            const parseTime = (timeString) => {
                if (!timeString) return null;
                const [hours, minutes] = timeString.split(':').map(Number);
                return { hours, minutes, seconds: 0 };
            };

            const updatedPreferences = {
                ...formData,
                quietHoursStart: parseTime(formData.quietHoursStart),
                quietHoursEnd: parseTime(formData.quietHoursEnd)
            };

            await updatePreferences(updatedPreferences);
            toast.success('Preferences saved successfully');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`notification-preferences ${isDarkMode ? 'dark' : ''}`}>
            <div className="preferences-header">
                <div className="header-content">
                    <Bell size={32} />
                    <div>
                        <h1>Notification Preferences</h1>
                        <p>Manage how and when you receive notifications</p>
                    </div>
                </div>
            </div>

            <div className="preferences-content">
                {/* Push Notifications */}
                {isSupported && (
                    <div className="preference-section">
                        <h2>Push Notifications</h2>
                        <div className="preference-item">
                            <div className="preference-info">
                                <div className="preference-icon">
                                    {formData.enablePush ? <Bell /> : <BellOff />}
                                </div>
                                <div>
                                    <h3>Enable Push Notifications</h3>
                                    <p>Receive notifications even when the app is closed</p>
                                    {permission === 'denied' && (
                                        <span className="permission-warning">
                                            ⚠️ Push notifications are blocked in your browser
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                className={`toggle-btn ${formData.enablePush ? 'active' : ''}`}
                                onClick={handleEnablePush}
                                disabled={permission === 'denied'}
                            >
                                <span className="toggle-slider" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Notification Categories */}
                <div className="preference-section">
                    <h2>Notification Categories</h2>

                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon reservation">
                                <Car />
                            </div>
                            <div>
                                <h3>Reservation Notifications</h3>
                                <p>Booking confirmations, reminders, and status updates</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.reservationNotifications ? 'active' : ''}`}
                            onClick={() => handleToggle('reservationNotifications')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon gps">
                                <MapPin />
                            </div>
                            <div>
                                <h3>GPS & Location Alerts</h3>
                                <p>Geofence violations, speed alerts, and tracking updates</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.gpsAlerts ? 'active' : ''}`}
                            onClick={() => handleToggle('gpsAlerts')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon maintenance">
                                <Wrench />
                            </div>
                            <div>
                                <h3>Maintenance Alerts</h3>
                                <p>Service reminders and maintenance due dates</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.maintenanceAlerts ? 'active' : ''}`}
                            onClick={() => handleToggle('maintenanceAlerts')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon system">
                                <Settings />
                            </div>
                            <div>
                                <h3>System Notifications</h3>
                                <p>App updates, features, and general announcements</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.systemNotifications ? 'active' : ''}`}
                            onClick={() => handleToggle('systemNotifications')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon security">
                                <Shield />
                            </div>
                            <div>
                                <h3>Security Alerts</h3>
                                <p>Login attempts, security issues, and account activity</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.securityAlerts ? 'active' : ''}`}
                            onClick={() => handleToggle('securityAlerts')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>
                </div>

                {/* Priority Settings */}
                <div className="preference-section">
                    <h2>Priority Settings</h2>
                    <div className="preference-item">
                        <div className="preference-info">
                            <div className="preference-icon critical">
                                <Bell />
                            </div>
                            <div>
                                <h3>Critical Alerts Only</h3>
                                <p>Only receive urgent, high-priority notifications</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn ${formData.criticalOnly ? 'active' : ''}`}
                            onClick={() => handleToggle('criticalOnly')}
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>
                </div>

                {/* Quiet Hours */}
                <div className="preference-section">
                    <h2>
                        <Clock size={20} />
                        Quiet Hours
                    </h2>
                    <p className="section-description">
                        Set times when you don't want to receive notifications (except critical alerts)
                    </p>

                    <div className="quiet-hours-inputs">
                        <div className="time-input-group">
                            <label>Start Time</label>
                            <input
                                type="time"
                                value={formData.quietHoursStart}
                                onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                                className="time-input"
                            />
                        </div>

                        <div className="time-separator">—</div>

                        <div className="time-input-group">
                            <label>End Time</label>
                            <input
                                type="time"
                                value={formData.quietHoursEnd}
                                onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                                className="time-input"
                            />
                        </div>
                    </div>

                    {formData.quietHoursStart && formData.quietHoursEnd && (
                        <div className="quiet-hours-preview">
                            ℹ️ Quiet hours active from {formData.quietHoursStart} to {formData.quietHoursEnd}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="preferences-actions">
                    <button
                        className="save-button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPreferences;