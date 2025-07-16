// src/pages/Reports/Financial/FinancialCashFlow.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { expenseService } from '../../../services/expenseService';
import reservationService from '../../../services/reservationService';
import maintenanceService from '../../../services/maintenanceService';
import './FinancialCashFlow.css';

const FinancialCashFlow = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    // State for data
    const [cashFlowData, setCashFlowData] = useState({
        inflows: [],
        outflows: [],
        summary: {
            totalInflows: 0,
            totalOutflows: 0,
            netCashFlow: 0
        }
    });

    // State for filters
    const [filters, setFilters] = useState({
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        period: 'monthly'
    });

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    // Fetch cash flow data
    useEffect(() => {
        const fetchCashFlowData = async () => {
            if (!agencyId) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch data from all services in parallel
                const [reservationsData, expensesData, maintenanceData] = await Promise.all([
                    reservationService.getByAgencyId(agencyId),
                    expenseService.getByAgencyId(agencyId),
                    maintenanceService.getAll()
                ]);

                // Filter data by date range
                const startDate = new Date(filters.dateFrom);
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999); // Include the entire end date

                // Process inflows (reservations/revenue)
                const filteredReservations = reservationsData.filter(reservation => {
                    const reservationDate = new Date(reservation.createdAt || reservation.startDate);
                    return reservationDate >= startDate && reservationDate <= endDate;
                });

                const inflows = filteredReservations.map(reservation => ({
                    id: reservation.id,
                    date: reservation.createdAt || reservation.startDate,
                    description: `${t('reports.cashflow.reservation')} - ${reservation.car?.car_Model?.manufacturer?.name} ${reservation.car?.car_Model?.name}`,
                    amount: reservation.totalAmount || reservation.invoice?.totalAmount || 0,
                    category: 'Revenue',
                    type: 'inflow',
                    source: 'reservation'
                }));

                // Process outflows (expenses + maintenance)
                const filteredExpenses = expensesData.filter(expense => {
                    const expenseDate = new Date(expense.created_At);
                    return expenseDate >= startDate && expenseDate <= endDate;
                });

                const filteredMaintenance = maintenanceData.filter(maintenance => {
                    const maintenanceDate = new Date(maintenance.scheduledDate);
                    return maintenanceDate >= startDate && maintenanceDate <= endDate && maintenance.isCompleted && maintenance.cost;
                });

                const expenseOutflows = filteredExpenses.map(expense => ({
                    id: expense.id,
                    date: expense.created_At,
                    description: expense.title,
                    amount: expense.amount,
                    category: expense.expense_Category?.name || 'Other',
                    type: 'outflow',
                    source: 'expense'
                }));

                const maintenanceOutflows = filteredMaintenance.map(maintenance => ({
                    id: maintenance.id,
                    date: maintenance.completedDate || maintenance.scheduledDate,
                    description: `${t('reports.cashflow.maintenance')} - ${maintenance.description}`,
                    amount: maintenance.cost,
                    category: 'Maintenance',
                    type: 'outflow',
                    source: 'maintenance'
                }));

                const outflows = [...expenseOutflows, ...maintenanceOutflows];

                // Calculate summary
                const totalInflows = inflows.reduce((sum, item) => sum + (item.amount || 0), 0);
                const totalOutflows = outflows.reduce((sum, item) => sum + (item.amount || 0), 0);
                const netCashFlow = totalInflows - totalOutflows;

                setCashFlowData({
                    inflows: inflows.sort((a, b) => new Date(b.date) - new Date(a.date)),
                    outflows: outflows.sort((a, b) => new Date(b.date) - new Date(a.date)),
                    summary: {
                        totalInflows,
                        totalOutflows,
                        netCashFlow
                    }
                });

            } catch (err) {
                console.error('❌ Error fetching cash flow data:', err);
                setError(t('reports.cashflow.errorLoading') || 'Error loading cash flow data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCashFlowData();
    }, [agencyId, filters.dateFrom, filters.dateTo, t]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle period change
    const handlePeriodChange = (period) => {
        const today = new Date();
        let dateFrom, dateTo;

        switch (period) {
            case 'thisMonth':
                dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
                dateTo = today;
                break;
            case 'lastMonth':
                dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                dateTo = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'thisQuarter':
                const quarterStart = Math.floor(today.getMonth() / 3) * 3;
                dateFrom = new Date(today.getFullYear(), quarterStart, 1);
                dateTo = today;
                break;
            case 'thisYear':
                dateFrom = new Date(today.getFullYear(), 0, 1);
                dateTo = today;
                break;
            default:
                return;
        }

        setFilters(prev => ({
            ...prev,
            period,
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0]
        }));
    };

    // Export cash flow data
    const handleExport = () => {
        const allTransactions = [
            ...cashFlowData.inflows.map(item => ({ ...item, type: 'Inflow' })),
            ...cashFlowData.outflows.map(item => ({ ...item, type: 'Outflow' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const csvContent = [
            ['Date', 'Type', 'Description', 'Category', 'Amount'],
            ...allTransactions.map(item => [
                new Date(item.date).toLocaleDateString(),
                item.type,
                item.description,
                item.category,
                item.amount.toFixed(2)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash-flow-${filters.dateFrom}-to-${filters.dateTo}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className={`financial-cashflow-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`financial-cashflow-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('common.error')}</h3>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`financial-cashflow-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="cashflow-header">
                <div className="header-content">
                    <button
                        className="back-button"
                        onClick={() => navigate('/reports')}
                        aria-label={t('common.back')}
                    >
                        ←
                    </button>
                    <div className="header-info">
                        <h1 className="cashflow-title">{t('reports.cashflow.title')}</h1>
                        <p className="cashflow-description">{t('reports.cashflow.description')}</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-filter"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            🔍 {t('common.filters')}
                        </button>
                        <button
                            className="btn-export"
                            onClick={handleExport}
                        >
                            📊 {t('common.export')}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="filters-section">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label htmlFor="dateFrom">{t('common.dateFrom')}</label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    name="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="filter-group">
                                <label htmlFor="dateTo">{t('common.dateTo')}</label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    name="dateTo"
                                    value={filters.dateTo}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="period-buttons">
                            {[
                                { key: 'thisMonth', label: t('reports.periods.thisMonth') },
                                { key: 'lastMonth', label: t('reports.periods.lastMonth') },
                                { key: 'thisQuarter', label: t('reports.periods.thisQuarter') },
                                { key: 'thisYear', label: t('reports.periods.thisYear') }
                            ].map(period => (
                                <button
                                    key={period.key}
                                    className={`period-btn ${filters.period === period.key ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange(period.key)}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="summary-section">
                <div className="summary-cards">
                    <div className="summary-card inflow">
                        <div className="card-icon">💰</div>
                        <div className="card-content">
                            <div className="card-value">
                                ${cashFlowData.summary.totalInflows.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                            <div className="card-label">{t('reports.cashflow.totalInflows')}</div>
                        </div>
                    </div>

                    <div className="summary-card outflow">
                        <div className="card-icon">💸</div>
                        <div className="card-content">
                            <div className="card-value">
                                ${cashFlowData.summary.totalOutflows.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                            <div className="card-label">{t('reports.cashflow.totalOutflows')}</div>
                        </div>
                    </div>

                    <div className={`summary-card net ${cashFlowData.summary.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
                        <div className="card-icon">
                            {cashFlowData.summary.netCashFlow >= 0 ? '📈' : '📉'}
                        </div>
                        <div className="card-content">
                            <div className="card-value">
                                ${Math.abs(cashFlowData.summary.netCashFlow).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                            <div className="card-label">{t('reports.cashflow.netCashFlow')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-section">
                <div className="tabs-header">
                    {[
                        { key: 'summary', label: t('reports.cashflow.tabs.summary'), icon: '📊' },
                        { key: 'inflows', label: t('reports.cashflow.tabs.inflows'), icon: '💰' },
                        { key: 'outflows', label: t('reports.cashflow.tabs.outflows'), icon: '💸' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'summary' && (
                        <div className="summary-content">
                            <div className="summary-charts">
                                <div className="chart-container">
                                    <h3>{t('reports.cashflow.categoryBreakdown')}</h3>
                                    <div className="category-breakdown">
                                        {/* Inflow categories */}
                                        <div className="breakdown-section">
                                            <h4>{t('reports.cashflow.inflows')}</h4>
                                            <div className="category-item">
                                                <span className="category-name">{t('reports.cashflow.revenue')}</span>
                                                <span className="category-amount">
                                                    ${cashFlowData.summary.totalInflows.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Outflow categories */}
                                        <div className="breakdown-section">
                                            <h4>{t('reports.cashflow.outflows')}</h4>
                                            {Object.entries(
                                                cashFlowData.outflows.reduce((acc, item) => {
                                                    acc[item.category] = (acc[item.category] || 0) + item.amount;
                                                    return acc;
                                                }, {})
                                            ).map(([category, amount]) => (
                                                <div key={category} className="category-item">
                                                    <span className="category-name">{category}</span>
                                                    <span className="category-amount">
                                                        ${amount.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inflows' && (
                        <div className="transactions-content">
                            <div className="transactions-header">
                                <h3>{t('reports.cashflow.inflows')} ({cashFlowData.inflows.length})</h3>
                            </div>
                            <div className="transactions-list">
                                {cashFlowData.inflows.length === 0 ? (
                                    <div className="no-data">
                                        <div className="no-data-icon">💰</div>
                                        <p>{t('reports.cashflow.noInflows')}</p>
                                    </div>
                                ) : (
                                    cashFlowData.inflows.map(item => (
                                        <div key={`${item.source}-${item.id}`} className="transaction-item inflow">
                                            <div className="transaction-content">
                                                <div className="transaction-main">
                                                    <span className="transaction-description">{item.description}</span>
                                                    <span className="transaction-category">{item.category}</span>
                                                </div>
                                                <div className="transaction-meta">
                                                    <span className="transaction-date">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="transaction-amount positive">
                                                +${item.amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'outflows' && (
                        <div className="transactions-content">
                            <div className="transactions-header">
                                <h3>{t('reports.cashflow.outflows')} ({cashFlowData.outflows.length})</h3>
                            </div>
                            <div className="transactions-list">
                                {cashFlowData.outflows.length === 0 ? (
                                    <div className="no-data">
                                        <div className="no-data-icon">💸</div>
                                        <p>{t('reports.cashflow.noOutflows')}</p>
                                    </div>
                                ) : (
                                    cashFlowData.outflows.map(item => (
                                        <div key={`${item.source}-${item.id}`} className="transaction-item outflow">
                                            <div className="transaction-content">
                                                <div className="transaction-main">
                                                    <span className="transaction-description">{item.description}</span>
                                                    <span className="transaction-category">{item.category}</span>
                                                </div>
                                                <div className="transaction-meta">
                                                    <span className="transaction-date">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="transaction-amount negative">
                                                -${item.amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialCashFlow;