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

                console.log(reservationsData);
                // Process cars data
                const availableCars = carsData.filter(car => car.isAvailable);

                // Process reservations data
                const activeReservations = reservationsData.filter(res => res.status === 'Ongoing');
                const pendingReservations = reservationsData.filter(res => res.status === 'Reserved');

                // Calculate upcoming maintenance
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);

                // Find service alerts and maintenance records due in next month
                const upcomingMaintenance = maintenanceData.filter(record => {
                    const dueDate = new Date(record.scheduledDate);
                    return dueDate > today && dueDate < nextMonth;
                }).length;

                // Calculate monthly revenue
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const monthlyRevenue = invoicesData
                    .filter(invoice => {
                        const invoiceDate = new Date(invoice.issueDate);
                        return invoiceDate.getMonth() === currentMonth &&
                            invoiceDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

                // Get recent reservations (limit to 3)
                const sortedReservations = [...reservationsData]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3);

                // Get car status (limit to 3)
                const recentCars = carsData.slice(0, 3);

                // Generate alerts
                const alertsList = [];

                // Add maintenance alerts
                maintenanceData.forEach(record => {
                    const dueDate = new Date(record.scheduledDate);
                    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                    if (daysUntilDue > 0 && daysUntilDue <= 7) {
                        const car = carsData.find(c => c.id === record.carId);
                        alertsList.push({
                            id: `maintenance-${record.id}`,
                            message: `${car?.licensePlate || 'Vehicle'} due for "${record.description}" in ${daysUntilDue} days`,
                            type: daysUntilDue <= 2 ? 'danger' : 'warning',
                            date: today.toISOString().split('T')[0]
                        });
                    }
                });

                // Add overdue reservation alerts
                reservationsData.forEach(reservation => {
                    const endDate = new Date(reservation.endDate);
                    if (reservation.status === 'Ongoing' && endDate < today) {
                        const daysOverdue = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
                        alertsList.push({
                            id: `reservation-${reservation.id}`,
                            message: `Reservation #${reservation.id.substring(0, 8)} is overdue by ${daysOverdue} days`,
                            type: 'danger',
                            date: today.toISOString().split('T')[0]
                        });
                    }
                });

                // Limit alerts to 3 most important
                const sortedAlerts = alertsList
                    .sort((a, b) => a.type === 'danger' ? -1 : 1)
                    .slice(0, 3);

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
                setAlerts(sortedAlerts);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
    };

    if (isLoading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Welcome Message */}
            <section className={`welcome-card ${isDarkMode ? 'dark' : 'light'}`}>
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
            </section>

            {/* Quick Shortcuts */}
            <section className="shortcuts-section">
                <h2 className="section-heading">{t('dashboard.quickShortcuts')}</h2>
                <div className="shortcuts">
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/cars')}
                    >
                        🚗 {t('dashboard.viewCars')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/reservations')}
                    >
                        📋 {t('dashboard.viewReservations')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/maintenances')}
                    >
                        🔧 {t('dashboard.viewMaintenances')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/invoices')}
                    >
                        💰 {t('dashboard.viewInvoices')}
                    </button>
                </div>
            </section>

            {/* Alerts */}
            {alerts.length > 0 && (
                <section className="alerts-section">
                    <h2 className="section-heading">{t('dashboard.alerts')}</h2>
                    <ul className="alerts-list">
                        {alerts.map(alert => (
                            <li key={alert.id} className={`alert-item alert-${alert.type}`}>
                                <span className="alert-date">{alert.date}</span>
                                <span className="alert-message">{alert.message}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="alerts-footer">
                        <button
                            className="view-all-link"
                            onClick={() => handleNavigation('/maintenances')}
                        >
                            {t('common.viewAll')} →
                        </button>
                    </div>
                </section>
            )}

            {/* Stats Grid */}
            <section className="stats-grid">
                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon stat-icon-cars">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">{t('dashboard.monthlyRevenue')}</p>
                        <p className="stat-value">
                            {new Intl.NumberFormat(undefined, {
                                style: 'currency',
                                currency: 'MAD',
                                minimumFractionDigits: 0
                            }).format(stats.monthlyRevenue)}
                        </p>
                        <div className="stat-sub">
                            <span>
                                <span className="sub-label">{t('dashboard.maintenance')}:</span>
                                <span className="sub-value">{stats.upcomingMaintenance}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Reservations */}
            {recentReservations.length > 0 && (
                <section className="near-reservations-section">
                    <h2 className="section-heading">{t('dashboard.recentReservations')}</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('dashboard.customer')}</th>
                                    <th>{t('dashboard.car')}</th>
                                    <th>{t('dashboard.dates')}</th>
                                    <th>{t('dashboard.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReservations.map(reservation => (
                                    <tr key={reservation.id}>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {reservation.customers?.length > 0
                                                ? reservation.customers.map((customer, idx) => (
                                                    <span key={customer?.id || 'hhh'}>
                                                        <Link to={`/customer/${customer.id}`}>
                                                            {customer?.fullName || 'hello'}
                                                        </Link>
                                                        {/* add comma separator except after last */}
                                                        {idx < reservation.customers.length - 1 && ', '}
                                                    </span>
                                                ))
                                                : 'Unknown'}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>{reservation.carLicensePlate + ' | ' + reservation.model || 'Unknown'}</td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                                                {t('reservation.status.' + reservation.status.toLowerCase())}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <button
                            className="view-all-link"
                            onClick={() => handleNavigation('/reservations')}
                        >
                            {t('common.viewAll')} →
                        </button>
                    </div>
                </section>
            )}

            {/* Car Status */}
            {carStatus.length > 0 && (
                <section className="car-status-section">
                    <h2 className="section-heading">{t('dashboard.carStatus')}</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('dashboard.model')}</th>
                                    <th>{t('dashboard.licensePlate')}</th>
                                    <th>{t('dashboard.status')}</th>
                                    <th>{t('dashboard.maintenanceDue')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carStatus.map(car => (
                                    <tr key={car.id}>
                                        <td className={isDarkMode ? 'dark' : 'light'}>{car.fields?.model || car.model || 'Unknown'}</td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>{car.licensePlate}</td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <span className={`status-badge status-${car.status?.toLowerCase() || 'unknown'}`}>
                                                {t('car.status.' + car.status.toLowerCase())}
                                            </span>
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {car.maintenanceDue ? new Date(car.maintenanceDue).toLocaleDateString() : t('dashboard.notScheduled')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <button
                            className="view-all-link"
                            onClick={() => handleNavigation('/cars')}
                        >
                            {t('common.viewAll')} →
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;