// src/pages/Reports/Agency/AgencyFinancial.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { expenseService } from '../../../services/expenseService';
import { customerService } from '../../../services/customerService';
import { agencyService } from '../../../services/agencyService';
import './AgencyFinancial.css';

const AgencyFinancial = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    // Financial data state
    const [financialData, setFinancialData] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        revenueByMonth: [],
        expensesByCategory: [],
        profitMargin: 0,
        customerCount: 0,
        avgRevenuePerCustomer: 0
    });

    // Load financial data
    useEffect(() => {
        loadFinancialData();
    }, [selectedPeriod, selectedYear, selectedMonth, user?.agencyId]);

    const loadFinancialData = async () => {
        if (!user?.agencyId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch data from various services
            const [expenses, customers, agency] = await Promise.all([
                expenseService.getByAgencyId(user.agencyId),
                customerService.getByAgencyId(user.agencyId),
                agencyService.getById(user.agencyId)
            ]);

            // Process and calculate financial metrics
            const processedData = processFinancialData(expenses, customers, agency);
            setFinancialData(processedData);

        } catch (err) {
            console.error('Error loading financial data:', err);
            setError(t('reports.agency.financial.errorLoading'));
        } finally {
            setIsLoading(false);
        }
    };

    const processFinancialData = (expenses, customers, agency) => {
        // Mock calculations - in real app, this would come from API
        const currentDate = new Date();
        const currentYear = selectedYear;
        const currentMonth = selectedMonth;

        // Filter expenses by selected period
        const filteredExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.createdAt);
            if (selectedPeriod === 'month') {
                return expenseDate.getFullYear() === currentYear &&
                    expenseDate.getMonth() + 1 === currentMonth;
            } else if (selectedPeriod === 'year') {
                return expenseDate.getFullYear() === currentYear;
            }
            return true;
        });

        // Calculate totals
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Mock revenue calculation (in real app, this would come from reservations/bookings)
        const totalRevenue = totalExpenses * 2.5; // Mock 2.5x expense ratio
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const avgRevenuePerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;

        // Process monthly revenue data for chart
        const revenueByMonth = generateMonthlyData(currentYear, totalRevenue);

        // Process expenses by category
        const expensesByCategory = processExpensesByCategory(filteredExpenses);

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            revenueByMonth,
            expensesByCategory,
            profitMargin,
            customerCount: customers.length,
            avgRevenuePerCustomer
        };
    };

    const generateMonthlyData = (year, totalRevenue) => {
        const months = [];
        for (let i = 1; i <= 12; i++) {
            // Mock data distribution across months
            const revenue = (totalRevenue / 12) * (0.7 + Math.random() * 0.6);
            months.push({
                month: i,
                monthName: t(`common.months.${i}`),
                revenue: Math.round(revenue),
                expenses: Math.round(revenue * 0.6)
            });
        }
        return months;
    };

    const processExpensesByCategory = (expenses) => {
        const categoryTotals = {};

        expenses.forEach(expense => {
            const category = expense.categoryName || t('common.uncategorized');
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        return Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            amount,
            percentage: 0 // Will be calculated after sorting
        })).sort((a, b) => b.amount - a.amount);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${value.toFixed(1)}%`;
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };

    const handleExportReport = () => {
        // Mock export functionality
        console.log('Exporting financial report...');
        // In real app, this would generate PDF/Excel report
    };

    const handleGoBack = () => {
        navigate('/reports');
    };

    if (isLoading) {
        return (
            <div className={`agency-financial-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`agency-financial-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('common.error')}</h3>
                    <p>{error}</p>
                    <button className="retry-button" onClick={loadFinancialData}>
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`agency-financial-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="financial-header">
                <div className="header-main">
                    <button className="back-button" onClick={handleGoBack}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        {t('common.back')}
                    </button>

                    <div className="header-content">
                        <h1 className="financial-title">
                            <span className="title-icon">💰</span>
                            {t('reports.agency.financial.title')}
                        </h1>
                        <p className="financial-description">
                            {t('reports.agency.financial.subtitle')} - {user?.agencyName}
                        </p>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="export-button" onClick={handleExportReport}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {t('reports.common.export')}
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="financial-filters">
                <div className="filter-group">
                    <label className="filter-label">{t('reports.common.period')}</label>
                    <div className="period-tabs">
                        {['month', 'quarter', 'year'].map(period => (
                            <button
                                key={period}
                                className={`period-tab ${selectedPeriod === period ? 'active' : ''}`}
                                onClick={() => handlePeriodChange(period)}
                            >
                                {t(`reports.common.periods.${period}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">{t('reports.common.year')}</label>
                    <select
                        className="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {[2024, 2023, 2022, 2021].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {selectedPeriod === 'month' && (
                    <div className="filter-group">
                        <label className="filter-label">{t('reports.common.month')}</label>
                        <select
                            className="month-select"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>
                                    {t(`common.months.${month}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Key Metrics Section */}
            <div className="metrics-section">
                <div className="metrics-grid">
                    <div className="metric-card revenue">
                        <div className="metric-icon">📈</div>
                        <div className="metric-content">
                            <h3 className="metric-title">{t('reports.agency.financial.totalRevenue')}</h3>
                            <div className="metric-value">{formatCurrency(financialData.totalRevenue)}</div>
                            <div className="metric-change positive">+12.5%</div>
                        </div>
                    </div>

                    <div className="metric-card expenses">
                        <div className="metric-icon">💸</div>
                        <div className="metric-content">
                            <h3 className="metric-title">{t('reports.agency.financial.totalExpenses')}</h3>
                            <div className="metric-value">{formatCurrency(financialData.totalExpenses)}</div>
                            <div className="metric-change negative">+8.3%</div>
                        </div>
                    </div>

                    <div className="metric-card profit">
                        <div className="metric-icon">💰</div>
                        <div className="metric-content">
                            <h3 className="metric-title">{t('reports.agency.financial.netProfit')}</h3>
                            <div className="metric-value">{formatCurrency(financialData.netProfit)}</div>
                            <div className="metric-change positive">+18.2%</div>
                        </div>
                    </div>

                    <div className="metric-card margin">
                        <div className="metric-icon">📊</div>
                        <div className="metric-content">
                            <h3 className="metric-title">{t('reports.agency.financial.profitMargin')}</h3>
                            <div className="metric-value">{formatPercentage(financialData.profitMargin)}</div>
                            <div className="metric-change positive">+4.1%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Analytics Section */}
            <div className="analytics-section">
                <div className="analytics-grid">
                    {/* Revenue Trend Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">{t('reports.agency.financial.revenueVsExpenses')}</h3>
                        </div>
                        <div className="chart-content">
                            <div className="simple-chart">
                                {financialData.revenueByMonth.slice(0, 6).map((data, index) => (
                                    <div key={index} className="chart-bar-group">
                                        <div className="chart-bars">
                                            <div
                                                className="chart-bar revenue-bar"
                                                style={{ height: `${(data.revenue / Math.max(...financialData.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                                                title={`Revenue: ${formatCurrency(data.revenue)}`}
                                            ></div>
                                            <div
                                                className="chart-bar expense-bar"
                                                style={{ height: `${(data.expenses / Math.max(...financialData.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                                                title={`Expenses: ${formatCurrency(data.expenses)}`}
                                            ></div>
                                        </div>
                                        <div className="chart-label">{data.monthName.substring(0, 3)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <div className="legend-color revenue"></div>
                                    <span>{t('reports.agency.financial.revenue')}</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color expenses"></div>
                                    <span>{t('reports.agency.financial.expenses')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Categories */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">{t('reports.agency.financial.expensesByCategory')}</h3>
                        </div>
                        <div className="chart-content">
                            <div className="expense-categories">
                                {financialData.expensesByCategory.slice(0, 5).map((category, index) => (
                                    <div key={index} className="expense-category-item">
                                        <div className="category-info">
                                            <span className="category-name">{category.category}</span>
                                            <span className="category-amount">{formatCurrency(category.amount)}</span>
                                        </div>
                                        <div className="category-bar">
                                            <div
                                                className="category-fill"
                                                style={{
                                                    width: `${(category.amount / Math.max(...financialData.expensesByCategory.map(c => c.amount))) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="additional-metrics">
                <div className="metrics-grid secondary">
                    <div className="metric-card secondary">
                        <div className="metric-content">
                            <h4 className="metric-title">{t('reports.agency.financial.totalCustomers')}</h4>
                            <div className="metric-value">{financialData.customerCount}</div>
                        </div>
                    </div>

                    <div className="metric-card secondary">
                        <div className="metric-content">
                            <h4 className="metric-title">{t('reports.agency.financial.avgRevenuePerCustomer')}</h4>
                            <div className="metric-value">{formatCurrency(financialData.avgRevenuePerCustomer)}</div>
                        </div>
                    </div>

                    <div className="metric-card secondary">
                        <div className="metric-content">
                            <h4 className="metric-title">{t('reports.agency.financial.lastUpdated')}</h4>
                            <div className="metric-value">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyFinancial;