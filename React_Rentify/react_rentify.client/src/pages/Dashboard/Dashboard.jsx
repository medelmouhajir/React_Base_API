// src/pages/Dashboard/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { carService } from '../../services/carService';
import { reservationService } from '../../services/reservationService';
import { maintenanceService } from '../../services/maintenanceService';
import { invoiceService } from '../../services/invoiceService';
import { Chart, registerables } from 'chart.js/auto';
import './Dashboard.css';

Chart.register(...registerables);

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
    const [chartData, setChartData] = useState({
        cars: [],
        reservations: [],
        revenue: []
    });

    const carsChartRef = useRef(null);
    const reservationsChartRef = useRef(null);
    const revenueChartRef = useRef(null);
    const carsChartInstance = useRef(null);
    const reservationsChartInstance = useRef(null);
    const revenueChartInstance = useRef(null);

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
            if (!agencyId) return;

            setIsLoading(true);
            try {
                const [carsData, reservationsData, maintenanceData, invoicesData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    reservationService.getByAgencyId(agencyId),
                    maintenanceService.getByAgencyId(agencyId),
                    invoiceService.getByAgencyId(agencyId)
                ]);

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // Calculate stats
                const availableCars = carsData.filter(car => car.availability === 'Available');
                const activeReservations = reservationsData.filter(r => r.status === 'Ongoing');
                const pendingReservations = reservationsData.filter(r => r.status === 'Reserved');
                const upcomingMaintenance = maintenanceData.filter(m => {
                    const maintenanceDate = new Date(m.scheduledDate);
                    return maintenanceDate > now && maintenanceDate.getMonth() === currentMonth;
                }).length;

                const monthlyRevenue = invoicesData
                    .filter(inv => {
                        const invDate = new Date(inv.issueDate);
                        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

                // Prepare chart data (last 6 months)
                const monthsData = [];
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(currentYear, currentMonth - i, 1);
                    monthsData.push({
                        month: date.toLocaleDateString(undefined, { month: 'short' }),
                        monthIndex: date.getMonth(),
                        year: date.getFullYear()
                    });
                }

                const carsChartData = monthsData.map(m => {
                    return carsData.filter(car => {
                        const addedDate = new Date(car.createdAt || car.addedDate || now);
                        return addedDate.getMonth() <= m.monthIndex && addedDate.getFullYear() <= m.year;
                    }).length;
                });

                const reservationsChartData = monthsData.map(m => {
                    return reservationsData.filter(res => {
                        const resDate = new Date(res.createdAt || res.startDate);
                        return resDate.getMonth() === m.monthIndex && resDate.getFullYear() === m.year;
                    }).length;
                });

                const revenueChartData = monthsData.map(m => {
                    return invoicesData
                        .filter(inv => {
                            const invDate = new Date(inv.issueDate);
                            return invDate.getMonth() === m.monthIndex && invDate.getFullYear() === m.year;
                        })
                        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
                });

                setChartData({
                    cars: { labels: monthsData.map(m => m.month), data: carsChartData },
                    reservations: { labels: monthsData.map(m => m.month), data: reservationsChartData },
                    revenue: { labels: monthsData.map(m => m.month), data: revenueChartData }
                });

                // Process recent reservations
                const sortedReservations = [...reservationsData]
                    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
                    .slice(0, 6);

                // Process recent cars
                const recentCars = [...carsData]
                    .sort((a, b) => new Date(b.createdAt || b.addedDate || 0) - new Date(a.createdAt || a.addedDate || 0))
                    .slice(0, 5);

                // Generate alerts
                const alertList = [];
                if (pendingReservations.length > 0) {
                    alertList.push({
                        id: 'pending-reservations',
                        type: 'warning',
                        title: t('dashboard.pendingReservationsAlert'),
                        message: t('dashboard.pendingReservationsMessage', { count: pendingReservations.length }),
                        action: () => navigate('/reservations'),
                        actionText: t('dashboard.reviewReservations')
                    });
                }
                if (upcomingMaintenance > 0) {
                    alertList.push({
                        id: 'upcoming-maintenance',
                        type: 'info',
                        title: t('dashboard.maintenanceAlert'),
                        message: t('dashboard.maintenanceAlertMessage', { count: upcomingMaintenance }),
                        action: () => navigate('/maintenances'),
                        actionText: t('dashboard.viewMaintenance')
                    });
                }

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

    // Create charts
    useEffect(() => {
        if (isLoading || !chartData.cars.labels) return;

        const createChart = (ref, instance, label, data, color) => {
            if (instance.current) {
                instance.current.destroy();
            }

            const ctx = ref.current?.getContext('2d');
            if (!ctx) return;

            instance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: label,
                        data: data.data,
                        borderColor: color,
                        backgroundColor: `${color}20`,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: isDarkMode ? '#475569' : '#e5e7eb'
                            },
                            ticks: {
                                color: isDarkMode ? '#d1d5db' : '#6b7280'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: isDarkMode ? '#d1d5db' : '#6b7280'
                            }
                        }
                    }
                }
            });
        };

        createChart(carsChartRef, carsChartInstance, t('dashboard.fleet'), chartData.cars, '#10b981');
        createChart(reservationsChartRef, reservationsChartInstance, t('dashboard.reservations'), chartData.reservations, '#3b82f6');
        createChart(revenueChartRef, revenueChartInstance, t('dashboard.monthlyRevenue'), chartData.revenue, '#f59e0b');

        return () => {
            if (carsChartInstance.current) carsChartInstance.current.destroy();
            if (reservationsChartInstance.current) reservationsChartInstance.current.destroy();
            if (revenueChartInstance.current) revenueChartInstance.current.destroy();
        };
    }, [chartData, isLoading, isDarkMode, t]);

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

    const getStatusColor = (status) => {
        const colors = {
            'Reserved': '#f59e0b',
            'Ongoing': '#10b981',
            'Completed': '#6b7280',
            'Cancelled': '#ef4444'
        };
        return colors[status] || '#6b7280';
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

            {/* Quick Shortcuts - Scrollable horizontal */}
            <section className="shortcuts-dashboard-section">
                <h2 className="section-heading">{t('dashboard.quickShortcuts')}</h2>
                <div className="shortcuts-scroll-container">
                    <div className="scroll-indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    <div className={`shortcuts ${isMobile ? 'mobile' : ''}`}>
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/cars')}>
                            <div className="shortcut-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                                    <circle cx="6.5" cy="16.5" r="2.5" />
                                    <circle cx="16.5" cy="16.5" r="2.5" />
                                </svg>
                            </div>
                            <span>{t('dashboard.viewCars')}</span>
                        </button>
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/customers')}>
                            <div className="shortcut-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <span>{t('customer.list.title')}</span>
                        </button>
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/reservations')}>
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
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/reservations/unpaid')}>
                            <div className="shortcut-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span>{t('reservation.unpaid.title')}</span>
                        </button>
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/maintenances')}>
                            <div className="shortcut-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                            </div>
                            <span>{t('dashboard.viewMaintenance')}</span>
                        </button>
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/invoices')}>
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
                        <button className="shortcut-dashboard-button" onClick={() => handleNavigation('/reports')}>
                            <div className="shortcut-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                            </div>
                            <span>{t('sidebar.reports')}</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <section className="alerts-dashboard-section">
                    <h2 className="section-heading">{t('dashboard.alerts')}</h2>
                    <div className="alerts-grid">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`alert-card alert-${alert.type} ${isDarkMode ? 'dark' : 'light'}`}>
                                <div className="alert-content">
                                    <div className={`alert-icon ${alert.type}`}>
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

            {/* Statistics Graphs */}
            <section className="stats-section">
                <h2 className="section-heading">{t('dashboard.overview')}</h2>
                <div className={`stats-grid ${isMobile ? 'mobile' : ''}`}>
                    <div className={`stat-card chart-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="chart-header">
                            <div className="stat-icon stat-icon-cars">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                                    <circle cx="6.5" cy="16.5" r="2.5" />
                                    <circle cx="16.5" cy="16.5" r="2.5" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <p className="stat-label">{t('dashboard.fleet')}</p>
                                <p className="stat-value">{stats.totalCars}</p>
                                <p className="stat-sublabel">{t('dashboard.available')}: {stats.availableCars}</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            <canvas ref={carsChartRef}></canvas>
                        </div>
                    </div>

                    <div className={`stat-card chart-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="chart-header">
                            <div className="stat-icon stat-icon-reservations">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <p className="stat-label">{t('dashboard.reservations')}</p>
                                <p className="stat-value">{stats.activeReservations + stats.pendingReservations}</p>
                                <p className="stat-sublabel">{t('dashboard.active')}: {stats.activeReservations}</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            <canvas ref={reservationsChartRef}></canvas>
                        </div>
                    </div>

                    <div className={`stat-card chart-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="chart-header">
                            <div className="stat-icon stat-icon-revenue">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <p className="stat-label">{t('dashboard.monthlyRevenue')}</p>
                                <p className="stat-value">{formatCurrency(stats.monthlyRevenue)}</p>
                                <p className="stat-sublabel">{t('dashboard.maintenance')}: {stats.upcomingMaintenance}</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            <canvas ref={revenueChartRef}></canvas>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Reservations - Grid Cards */}
            {recentReservations.length > 0 && (
                <section className="reservations-dashboard-grid-section">
                    <div className="section-header">
                        <h3 className="section-heading">{t('dashboard.recentReservations')}</h3>
                        <Link to="/reservations" className="section-link">
                            {t('dashboard.viewAll')}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </Link>
                    </div>
                    <div className="reservations-dashboard-grid">
                        {recentReservations.map(reservation => (
                            <Link
                                key={reservation.id}
                                to={`/reservations/${reservation.id}`}
                                className={`reservation-dashboard-card ${isDarkMode ? 'dark' : 'light'}`}
                                style={{ borderLeftColor: getStatusColor(reservation.status) }}
                            >
                                <div className="reservation-dashboard-header">
                                    <span className={getStatusBadge(reservation.status)}>
                                        {t(`reservation.status.${reservation.status?.toLowerCase()}`)}
                                    </span>
                                </div>
                                <div className="reservation-dashboard-body">
                                    <div className="reservation-info-row">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span className="reservation-dashboard-customer">
                                            {reservation.customers?.length > 0
                                                ? reservation.customers[0].fullName
                                                : t('dashboard.unknownCustomer')}
                                        </span>
                                    </div>
                                    <div className="reservation-info-row">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                                            <circle cx="6.5" cy="16.5" r="2.5" />
                                            <circle cx="16.5" cy="16.5" r="2.5" />
                                        </svg>
                                        <span className="reservation-dashboard-car">
                                            {reservation.carLicensePlate || t('dashboard.unknownCar')}
                                        </span>
                                    </div>
                                    <div className="reservation-info-row">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span className="reservation-dashboard-date">
                                            {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
};

export default Dashboard;