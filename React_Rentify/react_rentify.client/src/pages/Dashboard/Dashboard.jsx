// src/pages/Dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { carService } from '../../services/carService';
import { reservationService } from '../../services/reservationService';
import { maintenanceService } from '../../services/maintenanceService';
import { invoiceService } from '../../services/invoiceService';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const agencyId = user?.agencyId;

    const [stats, setStats] = useState({
        totalCars: 0,
        availableCars: 0,
        activeReservations: 0,
        pendingReservations: 0,
        upcomingMaintenance: 0,
        monthlyRevenue: 0
    });
    const [recentReservations, setRecentReservations] = useState([]);
    const [carStatus, setCarStatus] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch all required data in parallel
                const [carsData, reservationsData, maintenanceData, invoicesData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    reservationService.getByAgencyId(agencyId),
                    maintenanceService.getByAgencyId(agencyId),
                    invoiceService.getByAgencyId(agencyId)
                ]);

                // Process cars data
                const availableCars = carsData.filter(car => car.isAvailable);

                // Process reservations data
                const activeReservations = reservationsData.filter(res => res.status === 'Ongoing');
                const pendingReservations = reservationsData.filter(res => res.status === 'Reserved');

                // Calculate upcoming maintenance
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);

                const upcomingMaintenance = maintenanceData.filter(record => {
                    const dueDate = new Date(record.scheduledDate);
                    return dueDate > today && dueDate < nextMonth;
                }).length;

                // Calculate monthly revenue
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const monthlyRevenue = invoicesData
                    .filter(invoice => {
                        const invoiceDate = new Date(invoice.createdAt);
                        return invoiceDate.getMonth() === currentMonth &&
                            invoiceDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

                // Get recent reservations (last 5)
                const sortedReservations = reservationsData
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);

                // Get recent cars with their status
                const recentCars = carsData
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);

                // Generate alerts
                const alertList = [];

                // Maintenance alerts
                if (upcomingMaintenance > 0) {
                    alertList.push({
                        id: 'maintenance',
                        type: 'warning',
                        title: t('dashboard.maintenanceAlert'),
                        message: t('dashboard.maintenanceAlertMessage', { count: upcomingMaintenance }),
                        action: () => navigate('/maintenances'),
                        actionText: t('dashboard.viewMaintenance')
                    });
                }

                // Low availability alert
                const availabilityRate = carsData.length > 0 ? (availableCars.length / carsData.length) * 100 : 0;
                if (availabilityRate < 20 && carsData.length > 0) {
                    alertList.push({
                        id: 'lowAvailability',
                        type: 'danger',
                        title: t('dashboard.lowAvailabilityAlert'),
                        message: t('dashboard.lowAvailabilityMessage', {
                            available: availableCars.length,
                            total: carsData.length
                        }),
                        action: () => navigate('/cars'),
                        actionText: t('dashboard.manageCars')
                    });
                }

                // Pending reservations alert
                if (pendingReservations.length > 0) {
                    alertList.push({
                        id: 'pendingReservations',
                        type: 'info',
                        title: t('dashboard.pendingReservationsAlert'),
                        message: t('dashboard.pendingReservationsMessage', { count: pendingReservations.length }),
                        action: () => navigate('/reservations'),
                        actionText: t('dashboard.reviewReservations')
                    });
                }

                // Update state with all processed data
                setStats({
                    totalCars: carsData.length,
                    availableCars: availableCars.length,
                    activeReservations: activeReservations.length,
                    pendingReservations: pendingReservations.length,
                    upcomingMaintenance,
                    monthlyRevenue
                });
                setRecentReservations(sortedReservations);
                setCarStatus(recentCars);
                setAlerts(alertList);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsLoading(false);
            }
        };

        if (agencyId) {
            fetchDashboardData();
        }
    }, [agencyId, navigate, t]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Reserved': 'status-badge status-pending',
            'Ongoing': 'status-badge status-active',
            'Completed': 'status-badge status-completed',
            'Cancelled': 'status-badge status-cancelled'
        };

        return statusClasses[status] || 'status-badge status-default';
    };

    if (isLoading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner" />
                <p className="loading-text">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Welcome Message */}
            <section className={`welcome-card ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="welcome-content">
                    <h1 className="welcome-title">
                        {t('dashboard.welcomeMessage', { name: user?.fullName || t('common.user') })}
                    </h1>
                    <p className="welcome-date">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <div className="welcome-actions">
                    <button
                        className="quick-action-btn primary"
                        onClick={() => handleNavigation('/reservations/add')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14m-7-7h14" />
                        </svg>
                        {!isMobile && t('dashboard.newReservation')}
                    </button>
                </div>
            </section>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <section className="alerts-section">
                    <div className="alerts-grid">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`alert-card alert-${alert.type} ${isDarkMode ? 'dark' : 'light'}`}>
                                <div className="alert-content">
                                    <div className="alert-icon">
                                        {alert.type === 'warning' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        )}
                                        {alert.type === 'danger' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                        )}
                                        {alert.type === 'info' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 16v-4" />
                                                <path d="M12 8h.01" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="alert-text">
                                        <h4 className="alert-title">{alert.title}</h4>
                                        <p className="alert-message">{alert.message}</p>
                                    </div>
                                </div>
                                {alert.action && (
                                    <button className="alert-action-btn" onClick={alert.action}>
                                        {alert.actionText}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Shortcuts */}
            <section className="shortcuts-section">
                <h2 className="section-heading">{t('dashboard.quickShortcuts')}</h2>
                <div className={`shortcuts ${isMobile ? 'mobile' : ''}`}>
                    <button className="shortcut-button" onClick={() => handleNavigation('/cars')}>
                        <div className="shortcut-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                                <circle cx="6.5" cy="16.5" r="2.5" />
                                <circle cx="16.5" cy="16.5" r="2.5" />
                            </svg>
                        </div>
                        <span>{t('dashboard.viewCars')}</span>
                    </button>
                    <button className="shortcut-button" onClick={() => handleNavigation('/reservations')}>
                        <div className="shortcut-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <span>{t('dashboard.viewReservations')}</span>
                    </button>
                    <button className="shortcut-button" onClick={() => handleNavigation('/maintenances')}>
                        <div className="shortcut-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </div>
                        <span>{t('dashboard.viewMaintenance')}</span>
                    </button>
                    <button className="shortcut-button" onClick={() => handleNavigation('/invoices')}>
                        <div className="shortcut-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10,9 9,9 8,9" />
                            </svg>
                        </div>
                        <span>{t('dashboard.viewInvoices')}</span>
                    </button>
                </div>
            </section>

            {/* Statistics Cards */}
            <section className="stats-section">
                <h2 className="section-heading">{t('dashboard.overview')}</h2>
                <div className={`stats-grid ${isMobile ? 'mobile' : ''}`}>
                    <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="stat-icon stat-icon-cars">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                                <circle cx="6.5" cy="16.5" r="2.5" />
                                <circle cx="16.5" cy="16.5" r="2.5" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{t('dashboard.fleet')}</p>
                            <p className="stat-value">{stats.totalCars}</p>
                            <div className="stat-sub">
                                <span>
                                    <span className="sub-label">{t('dashboard.available')}:</span>
                                    <span className="sub-value">{stats.availableCars}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="stat-icon stat-icon-reservations">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{t('dashboard.reservations')}</p>
                            <p className="stat-value">{stats.activeReservations + stats.pendingReservations}</p>
                            <div className="stat-sub">
                                <span>
                                    <span className="sub-label">{t('dashboard.active')}:</span>
                                    <span className="sub-value">{stats.activeReservations}</span>
                                </span>
                                <span>
                                    <span className="sub-label">{t('dashboard.pending')}:</span>
                                    <span className="sub-value">{stats.pendingReservations}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="stat-icon stat-icon-revenue">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{t('dashboard.monthlyRevenue')}</p>
                            <p className="stat-value">{formatCurrency(stats.monthlyRevenue)}</p>
                            <div className="stat-sub">
                                <span>
                                    <span className="sub-label">{t('dashboard.maintenance')}:</span>
                                    <span className="sub-value">{stats.upcomingMaintenance}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Activity */}
            <div className={`dashboard-grid ${isMobile ? 'mobile' : ''}`}>
                {/* Recent Reservations */}
                {recentReservations.length > 0 && (
                    <section className={`recent-section ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="section-header">
                            <h3 className="section-title">{t('dashboard.recentReservations')}</h3>
                            <Link to="/reservations" className="section-link">
                                {t('dashboard.viewAll')}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        </div>
                        <div className="recent-list">
                            {recentReservations.map(reservation => (
                                <div key={reservation.id} className="recent-item">
                                    <div className="recent-item-main">
                                        <div className="recent-item-info">
                                            <p className="recent-item-primary">
                                                {reservation.customers?.length > 0
                                                    ? `${reservation.customers[0].fullName}`
                                                    : t('dashboard.unknownCustomer')}
                                            </p>
                                            <p className="recent-item-secondary">
                                                {reservation.carLicensePlate || t('dashboard.unknownCar')} • {formatDate(reservation.startDate)}
                                            </p>
                                        </div>
                                        <div className="recent-item-status">
                                            <span className={getStatusBadge(reservation.status)}>
                                                {t(`reservation.status.${reservation.status?.toLowerCase()}`)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Car Status */}
                {carStatus.length > 0 && (
                    <section className={`recent-section ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="section-header">
                            <h3 className="section-title">{t('dashboard.carStatus')}</h3>
                            <Link to="/cars" className="section-link">
                                {t('dashboard.viewAll')}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        </div>
                        <div className="recent-list">
                            {carStatus.map(car => (
                                <div key={car.id} className="recent-item">
                                    <div className="recent-item-main">
                                        <div className="recent-item-info">
                                            <p className="recent-item-primary">{car.licensePlate}</p>
                                            <p className="recent-item-secondary">
                                                {car.fields.manufacturer} {car.fields.model} • {car.fields.year}
                                            </p>
                                        </div>
                                        <div className="recent-item-status">
                                            <span className={`availability-badge ${car.status.toLowerCase() == 'available' ? 'available' : 'unavailable'}`}>
                                                {t('car.status.' + car.status.toLowerCase())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Dashboard;