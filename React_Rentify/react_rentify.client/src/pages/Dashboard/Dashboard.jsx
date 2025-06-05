// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Dashboard.css';

// Mock data for dashboard widgets
const mockReservations = [
    { id: 1, customer: 'Ahmed Hassan', car: 'Toyota Corolla', startDate: '2025-06-01', endDate: '2025-06-05', status: 'Confirmed' },
    { id: 2, customer: 'Sofia Alami', car: 'Renault Clio', startDate: '2025-06-02', endDate: '2025-06-04', status: 'Ongoing' },
    { id: 3, customer: 'Omar Benali', car: 'Hyundai Tucson', startDate: '2025-06-07', endDate: '2025-06-10', status: 'Pending' },
];

const mockCars = [
    { id: 1, model: 'Toyota Corolla', licensePlate: '12345-A-5', status: 'Available', maintenanceDue: '2025-07-15' },
    { id: 2, model: 'Renault Clio', licensePlate: '67890-B-7', status: 'Rented', maintenanceDue: '2025-08-20' },
    { id: 3, model: 'Hyundai Tucson', licensePlate: '54321-C-9', status: 'Maintenance', maintenanceDue: '2025-06-05' },
];

const mockStats = {
    totalCars: 15,
    availableCars: 9,
    activeReservations: 4,
    pendingReservations: 2,
    upcomingMaintenance: 3,
    monthlyRevenue: 24500,
};

const mockAlerts = [
    { id: 1, message: 'Car #12345-A-5 due for service in 2 days', type: 'warning', date: '2025-06-03' },
    { id: 2, message: 'Reservation #2 is overdue', type: 'danger', date: '2025-06-04' },
    { id: 3, message: 'New user registered: Youssef El Idrissi', type: 'info', date: '2025-06-04' },
];

const Dashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [stats, setStats] = useState(mockStats);
    const [recentReservations, setRecentReservations] = useState([]);
    const [carStatus, setCarStatus] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setTimeout(() => {
                    setStats(mockStats);
                    setRecentReservations(mockReservations);
                    setCarStatus(mockCars);
                    setAlerts(mockAlerts);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
                    <button className="shortcut-button">
                        📋 {t('dashboard.viewCars')}
                    </button>
                    <button className="shortcut-button">
                        🚗 {t('dashboard.viewReservations')}
                    </button>
                    <button className="shortcut-button">
                        📊 {t('dashboard.viewStats')}
                    </button>
                    <button className="shortcut-button">
                        ⚙️ {t('dashboard.settings')}
                    </button>
                </div>
            </section>

            {/* Alerts */}
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
                    <a href="/alerts" className="view-all-link">
                        {t('common.viewAll')} →
                    </a>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid">
                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon stat-icon-cars" />
                    <div className="stat-content">
                        <p className="stat-label">{t('dashboard.totalCars')}</p>
                        <p className="stat-value">{stats.totalCars}</p>
                        <div className="stat-sub">
                            <span className="sub-label">{t('dashboard.availableCars')}</span>
                            <span className="sub-value">{stats.availableCars}</span>
                            <span className="sub-label">{t('dashboard.maintenanceDue')}</span>
                            <span className="sub-value">{stats.upcomingMaintenance}</span>
                        </div>
                    </div>
                </div>

                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon stat-icon-reservations" />
                    <div className="stat-content">
                        <p className="stat-label">{t('dashboard.activeReservations')}</p>
                        <p className="stat-value">{stats.activeReservations}</p>
                        <div className="stat-sub">
                            <span className="sub-label">{t('dashboard.pendingReservations')}</span>
                            <span className="sub-value">{stats.pendingReservations}</span>
                        </div>
                    </div>
                </div>

                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon stat-icon-revenue" />
                    <div className="stat-content">
                        <p className="stat-label">{t('dashboard.monthlyRevenue')}</p>
                        <p className="stat-value">
                            {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(stats.monthlyRevenue)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Near Reservations */}
            <section className="near-reservations-section">
                <h2 className="section-heading">{t('dashboard.nearReservations')}</h2>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('reservations.customer')}</th>
                                <th>{t('reservations.car')}</th>
                                <th>{t('reservations.startDate')}</th>
                                <th>{t('reservations.endDate')}</th>
                                <th>{t('reservations.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReservations.map(res => (
                                <tr key={res.id}>
                                    <td>{res.customer}</td>
                                    <td>{res.car}</td>
                                    <td>{res.startDate}</td>
                                    <td>{res.endDate}</td>
                                    <td>
                                        <span className={`status-badge status-${res.status.toLowerCase()}`}>
                                            {res.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <a href="/reservations" className="view-all-link">
                        {t('common.viewAll')} →
                    </a>
                </div>
            </section>

            {/* Car Status */}
            <section className="car-status-section">
                <h2 className="section-heading">{t('dashboard.carStatus')}</h2>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('cars.model')}</th>
                                <th>{t('cars.licensePlate')}</th>
                                <th>{t('cars.status')}</th>
                                <th>{t('cars.maintenanceDue')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carStatus.map(car => (
                                <tr key={car.id}>
                                    <td>{car.model}</td>
                                    <td>{car.licensePlate}</td>
                                    <td>
                                        <span className={`status-badge status-${car.status.toLowerCase()}`}>
                                            {car.status}
                                        </span>
                                    </td>
                                    <td>{car.maintenanceDue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <a href="/cars" className="view-all-link">
                        {t('common.viewAll')} →
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
