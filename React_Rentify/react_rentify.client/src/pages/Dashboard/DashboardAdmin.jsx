// src/pages/Dashboard/DashboardAdmin.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ticketService } from '../../services/ticketService';
import agencyService from '../../services/agencyService';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalAgencies: 0,
        activeAgencies: 0,
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        completedTickets: 0,
        totalStaff: 0,
        activeCars: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [agenciesData, setAgenciesData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch admin dashboard data
    useEffect(() => {
        const fetchAdminDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch all required data in parallel
                const [agenciesResponse, ticketsResponse] = await Promise.all([
                    agencyService.getAll(),
                    ticketService.getAll()
                ]);

                console.log('Agencies data:', agenciesResponse);
                console.log('Tickets data:', ticketsResponse);

                // Process agencies data
                const agencies = agenciesResponse || [];
                const activeAgencies = agencies.filter(agency => agency.isActive);

                // Calculate total staff and cars across all agencies
                const totalStaff = agencies.reduce((sum, agency) => sum + (agency.staffCount || 0), 0);
                const activeCars = agencies.reduce((sum, agency) => sum + (agency.carsCount || 0), 0);

                // Process tickets data
                const tickets = ticketsResponse || [];
                const openTickets = tickets.filter(ticket => ticket.status === 0); // Created
                const inProgressTickets = tickets.filter(ticket => ticket.status === 1); // InProgress
                const completedTickets = tickets.filter(ticket => ticket.status === 2); // Completed

                // Sort tickets by date (most recent first)
                const sortedTickets = tickets
                    .sort((a, b) => new Date(b.createdAt || b.dateAdded) - new Date(a.createdAt || a.dateAdded))
                    .slice(0, 5);

                // Generate alerts based on data
                const alertsList = [];

                if (openTickets.length > 5) {
                    alertsList.push({
                        id: 'high-open-tickets',
                        type: 'warning',
                        message: t('admin.alerts.highOpenTickets', { count: openTickets.length }),
                        date: new Date().toISOString()
                    });
                }

                if (activeAgencies.length !== agencies.length) {
                    const inactiveCount = agencies.length - activeAgencies.length;
                    alertsList.push({
                        id: 'inactive-agencies',
                        type: 'info',
                        message: t('admin.alerts.inactiveAgencies', { count: inactiveCount }),
                        date: new Date().toISOString()
                    });
                }

                // Update state with all processed data
                setStats({
                    totalAgencies: agencies.length,
                    activeAgencies: activeAgencies.length,
                    totalTickets: tickets.length,
                    openTickets: openTickets.length,
                    inProgressTickets: inProgressTickets.length,
                    completedTickets: completedTickets.length,
                    totalStaff,
                    activeCars
                });
                setRecentTickets(sortedTickets);
                setAgenciesData(agencies.slice(0, 5)); // Show top 5 agencies
                setAlerts(alertsList);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching admin dashboard data:', error);
                setIsLoading(false);
            }
        };

        // Only fetch if user is admin
        if (user?.role === 'Admin') {
            fetchAdminDashboardData();
        }
    }, [user, t]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const getTicketStatusText = (status) => {
        switch (status) {
            case 0: return t('tickets.status.created');
            case 1: return t('tickets.status.inProgress');
            case 2: return t('tickets.status.completed');
            case 3: return t('tickets.status.cancelled');
            default: return t('tickets.status.unknown');
        }
    };

    const getTicketStatusClass = (status) => {
        switch (status) {
            case 0: return 'status-created';
            case 1: return 'status-progress';
            case 2: return 'status-completed';
            case 3: return 'status-cancelled';
            default: return 'status-unknown';
        }
    };

    // Redirect if not admin
    if (user?.role !== 'Admin') {
        return (
            <div className={`admin-dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="access-denied">
                    <h2>{t('common.accessDenied')}</h2>
                    <p>{t('admin.accessDeniedMessage')}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className={`admin-dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Welcome Message */}
            <section className={`welcome-card ${isDarkMode ? 'dark' : 'light'}`}>
                <h1 className="welcome-title">
                    {t('admin.dashboard.welcomeMessage', { name: user?.fullName || t('common.admin') })}
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
                <h2 className="section-heading">{t('admin.dashboard.quickActions')}</h2>
                <div className="shortcuts">
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/agencies')}
                    >
                        🏢 {t('admin.dashboard.manageAgencies')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/tickets')}
                    >
                        🎫 {t('admin.dashboard.viewTickets')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/filters')}
                    >
                        🔧 {t('admin.dashboard.manageFilters')}
                    </button>
                    <button
                        className="shortcut-button"
                        onClick={() => handleNavigation('/settings')}
                    >
                        ⚙️ {t('admin.dashboard.systemSettings')}
                    </button>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid">
                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon agencies">🏢</div>
                    <div className="stat-content">
                        <h3>{stats.totalAgencies}</h3>
                        <p>{t('admin.stats.totalAgencies')}</p>
                        <span className="stat-subtitle">
                            {stats.activeAgencies} {t('admin.stats.active')}
                        </span>
                    </div>
                </div>

                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon tickets">🎫</div>
                    <div className="stat-content">
                        <h3>{stats.totalTickets}</h3>
                        <p>{t('admin.stats.totalTickets')}</p>
                        <span className="stat-subtitle">
                            {stats.openTickets} {t('admin.stats.open')}
                        </span>
                    </div>
                </div>

                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon staff">👥</div>
                    <div className="stat-content">
                        <h3>{stats.totalStaff}</h3>
                        <p>{t('admin.stats.totalStaff')}</p>
                        <span className="stat-subtitle">
                            {t('admin.stats.acrossAgencies')}
                        </span>
                    </div>
                </div>

                <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className="stat-icon cars">🚗</div>
                    <div className="stat-content">
                        <h3>{stats.activeCars}</h3>
                        <p>{t('admin.stats.activeCars')}</p>
                        <span className="stat-subtitle">
                            {t('admin.stats.systemWide')}
                        </span>
                    </div>
                </div>
            </section>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <section className="alerts-section">
                    <h2 className="section-heading">{t('admin.dashboard.systemAlerts')}</h2>
                    <ul className="alerts-list">
                        {alerts.map((alert) => (
                            <li key={alert.id} className={`alert-item alert-${alert.type}`}>
                                <div className="alert-content">
                                    <span className="alert-message">{alert.message}</span>
                                    <span className="alert-date">
                                        {new Date(alert.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Recent Tickets */}
            {recentTickets.length > 0 && (
                <section className={`table-section ${isDarkMode ? 'dark' : 'light'}`}>
                    <h2 className="section-heading">{t('admin.dashboard.recentTickets')}</h2>
                    <div className="table-container">
                        <table className={`dashboard-table ${isDarkMode ? 'dark' : 'light'}`}>
                            <thead>
                                <tr>
                                    <th>{t('tickets.fields.name')}</th>
                                    <th>{t('tickets.fields.object')}</th>
                                    <th>{t('tickets.fields.phone')}</th>
                                    <th>{t('tickets.fields.status')}</th>
                                    <th>{t('tickets.fields.date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <strong>{ticket.name}</strong>
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {ticket.object}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {ticket.phone}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <span className={`status-badge ${getTicketStatusClass(ticket.status)}`}>
                                                {getTicketStatusText(ticket.status)}
                                            </span>
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {new Date(ticket.createdAt || ticket.dateAdded).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <button
                            className="view-all-link"
                            onClick={() => handleNavigation('/tickets')}
                        >
                            {t('common.viewAll')} →
                        </button>
                    </div>
                </section>
            )}

            {/* Top Agencies */}
            {agenciesData.length > 0 && (
                <section className={`table-section ${isDarkMode ? 'dark' : 'light'}`}>
                    <h2 className="section-heading">{t('admin.dashboard.agenciesOverview')}</h2>
                    <div className="table-container">
                        <table className={`dashboard-table ${isDarkMode ? 'dark' : 'light'}`}>
                            <thead>
                                <tr>
                                    <th>{t('agency.fields.name')}</th>
                                    <th>{t('agency.fields.email')}</th>
                                    <th>{t('agency.fields.phoneOne')}</th>
                                    <th>{t('admin.stats.status')}</th>
                                    <th>{t('admin.stats.cars')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agenciesData.map((agency) => (
                                    <tr key={agency.id}>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <strong>{agency.name}</strong>
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {agency.email}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {agency.phoneOne}
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            <span className={`status-badge ${agency.isActive ? 'status-active' : 'status-inactive'}`}>
                                                {agency.isActive ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className={isDarkMode ? 'dark' : 'light'}>
                                            {agency.carsCount || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <button
                            className="view-all-link"
                            onClick={() => handleNavigation('/agencies')}
                        >
                            {t('common.viewAll')} →
                        </button>
                    </div>
                </section>
            )}

            {/* Ticket Status Breakdown */}
            <section className="ticket-breakdown">
                <h2 className="section-heading">{t('admin.dashboard.ticketBreakdown')}</h2>
                <div className="breakdown-grid">
                    <div className={`breakdown-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="breakdown-number created">{stats.openTickets}</div>
                        <div className="breakdown-label">{t('tickets.status.created')}</div>
                    </div>
                    <div className={`breakdown-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="breakdown-number progress">{stats.inProgressTickets}</div>
                        <div className="breakdown-label">{t('tickets.status.inProgress')}</div>
                    </div>
                    <div className={`breakdown-card ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="breakdown-number completed">{stats.completedTickets}</div>
                        <div className="breakdown-label">{t('tickets.status.completed')}</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DashboardAdmin;