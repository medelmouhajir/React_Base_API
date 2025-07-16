// src/pages/Reports/Agency/AgencyCustomers.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { customerService } from '../../../services/customerService';
import { agencyService } from '../../../services/agencyService';
import './AgencyCustomers.css';

const AgencyCustomers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();

    // State management
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [analytics, setAnalytics] = useState({
        totalCustomers: 0,
        newThisMonth: 0,
        blacklistedCount: 0,
        topCustomers: []
    });

    // Filter options
    const filterOptions = [
        { value: 'all', label: t('reports.filters.all') },
        { value: 'active', label: t('reports.filters.active') },
        { value: 'blacklisted', label: t('reports.filters.blacklisted') },
        { value: 'recent', label: t('reports.filters.recent') }
    ];

    // Fetch customers data
    useEffect(() => {
        const fetchCustomersData = async () => {
            try {
                setIsLoading(true);

                // Get customers for the current agency
                const agencyId = user?.agencyId;
                if (!agencyId) {
                    console.error('No agency ID found for user');
                    setIsLoading(false);
                    return;
                }

                const customersData = await customerService.getByAgencyId(agencyId);
                setCustomers(customersData);

                // Calculate analytics
                const totalCustomers = customersData.length;
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const newThisMonth = customersData.filter(customer => {
                    const customerDate = new Date(customer.createdAt || new Date());
                    return customerDate.getMonth() === currentMonth &&
                        customerDate.getFullYear() === currentYear;
                }).length;

                const blacklistedCount = customersData.filter(customer =>
                    customer.isBlacklisted
                ).length;

                // Mock top customers data (would normally come from reservations/revenue data)
                const topCustomers = customersData
                    .slice(0, 5)
                    .map((customer, index) => ({
                        ...customer,
                        totalRevenue: Math.floor(Math.random() * 50000) + 5000,
                        totalReservations: Math.floor(Math.random() * 20) + 1
                    }));

                setAnalytics({
                    totalCustomers,
                    newThisMonth,
                    blacklistedCount,
                    topCustomers
                });

            } catch (error) {
                console.error('Error fetching customers data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomersData();
    }, [user?.agencyId]);

    // Filter customers based on search and filter criteria
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phoneNumber?.includes(searchTerm);

        switch (selectedFilter) {
            case 'active':
                return matchesSearch && !customer.isBlacklisted;
            case 'blacklisted':
                return matchesSearch && customer.isBlacklisted;
            case 'recent':
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                const customerDate = new Date(customer.createdAt || new Date());
                return matchesSearch && customerDate >= lastMonth;
            default:
                return matchesSearch;
        }
    });

    // Handle customer click to navigate to details
    const handleCustomerClick = (customerId) => {
        navigate(`/customers/${customerId}`);
    };

    // Generate customer growth chart data (mock data)
    const getCustomerGrowthData = () => {
        const months = [];
        const currentDate = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            months.push({
                month: date.toLocaleDateString('en', { month: 'short' }),
                customers: Math.floor(Math.random() * 20) + 10 + i * 5
            });
        }

        return months;
    };

    const customerGrowthData = getCustomerGrowthData();

    if (isLoading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className={`agency-customers-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header Section */}
            <div className="customers-header">
                <div className="header-content">
                    <h1 className="page-title">{t('reports.agency.customers.title')}</h1>
                    <p className="page-description">{t('reports.agency.customers.description')}</p>
                </div>
                <button
                    className="back-button"
                    onClick={() => navigate('/reports')}
                >
                    ← {t('common.back')}
                </button>
            </div>

            {/* Analytics Section */}
            <div className="analytics-section">
                <div className="analytics-grid">
                    {/* Total Customers */}
                    <div className="stat-card">
                        <div className="stat-icon customers-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{analytics.totalCustomers}</div>
                            <div className="stat-label">{t('reports.analytics.totalCustomers')}</div>
                        </div>
                    </div>

                    {/* New This Month */}
                    <div className="stat-card">
                        <div className="stat-icon growth-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{analytics.newThisMonth}</div>
                            <div className="stat-label">{t('reports.analytics.newThisMonth')}</div>
                        </div>
                    </div>

                    {/* Blacklisted */}
                    <div className="stat-card">
                        <div className="stat-icon warning-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{analytics.blacklistedCount}</div>
                            <div className="stat-label">{t('reports.analytics.blacklisted')}</div>
                        </div>
                    </div>

                    {/* Customer Growth Chart */}
                    <div className="chart-card">
                        <h3 className="chart-title">{t('reports.analytics.customerGrowth')}</h3>
                        <div className="simple-chart">
                            {customerGrowthData.map((data, index) => (
                                <div key={index} className="chart-bar">
                                    <div
                                        className="bar"
                                        style={{
                                            height: `${(data.customers / Math.max(...customerGrowthData.map(d => d.customers))) * 100}%`
                                        }}
                                    />
                                    <div className="bar-label">{data.month}</div>
                                    <div className="bar-value">{data.customers}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Customers Section */}
            <div className="top-customers-section">
                <h2 className="section-title">{t('reports.analytics.topCustomers')}</h2>
                <div className="top-customers-grid">
                    {analytics.topCustomers.map((customer, index) => (
                        <div
                            key={customer.id}
                            className="top-customer-card"
                            onClick={() => handleCustomerClick(customer.id)}
                        >
                            <div className="customer-rank">#{index + 1}</div>
                            <div className="customer-info">
                                <div className="customer-name">{customer.fullName}</div>
                                <div className="customer-details">
                                    <span className="revenue">
                                        {new Intl.NumberFormat('en-MA', {
                                            style: 'currency',
                                            currency: 'MAD'
                                        }).format(customer.totalRevenue)}
                                    </span>
                                    <span className="reservations">
                                        {customer.totalReservations} {t('reports.analytics.reservations')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Customers List Section */}
            <div className="customers-list-section">
                <div className="list-header">
                    <h2 className="section-title">{t('reports.customers.listTitle')}</h2>
                    <div className="list-controls">
                        {/* Search */}
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </div>

                        {/* Filter */}
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="filter-select"
                        >
                            {filterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-count">
                    {t('reports.customers.showingResults', {
                        count: filteredCustomers.length,
                        total: customers.length
                    })}
                </div>

                {/* Customers Table */}
                <div className="customers-table-container">
                    {filteredCustomers.length > 0 ? (
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>{t('customers.fields.fullName')}</th>
                                    <th>{t('customers.fields.email')}</th>
                                    <th>{t('customers.fields.phone')}</th>
                                    <th>{t('customers.fields.status')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="customer-row">
                                        <td className="customer-name-cell">
                                            <div className="customer-avatar">
                                                {customer.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="customer-name-info">
                                                <div className="name">{customer.fullName}</div>
                                                <div className="id">ID: {customer.id.slice(0, 8)}...</div>
                                            </div>
                                        </td>
                                        <td className="email-cell">{customer.email}</td>
                                        <td className="phone-cell">{customer.phoneNumber}</td>
                                        <td className="status-cell">
                                            <span className={`status-badge ${customer.isBlacklisted ? 'blacklisted' : 'active'}`}>
                                                {customer.isBlacklisted ? t('customers.status.blacklisted') : t('customers.status.active')}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="view-button"
                                                onClick={() => handleCustomerClick(customer.id)}
                                            >
                                                {t('common.view')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">👥</div>
                            <h3 className="empty-title">{t('reports.customers.noResults')}</h3>
                            <p className="empty-description">{t('reports.customers.noResultsDescription')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgencyCustomers;