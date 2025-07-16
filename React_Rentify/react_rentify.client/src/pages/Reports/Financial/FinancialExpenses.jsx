// src/pages/Reports/Financial/FinancialExpenses.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { expenseService } from '../../../services/expenseService';
import './FinancialExpenses.css';

const FinancialExpenses = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();

    // State management
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('month');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Date filtering
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Analytics data
    const [analytics, setAnalytics] = useState({
        totalExpenses: 0,
        totalAmount: 0,
        averageExpense: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        topExpenses: []
    });

    useEffect(() => {
        initializeDateRange();
        loadData();
    }, [user]);

    useEffect(() => {
        if (expenses.length > 0) {
            calculateAnalytics();
        }
    }, [expenses, selectedCategory, startDate, endDate]);

    const initializeDateRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [expensesData, categoriesData] = await Promise.all([
                user?.agencyId ? expenseService.getByAgencyId(user.agencyId) : expenseService.getAll(),
                user?.agencyId ? expenseService.getCategoriesByAgencyId(user.agencyId) : expenseService.getAllCategories()
            ]);

            setExpenses(expensesData || []);
            setCategories(categoriesData || []);
        } catch (err) {
            console.error('Error loading financial data:', err);
            setError(err.message || t('reports.financial.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        const now = new Date();
        let start = new Date();

        switch (range) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    };

    const getFilteredExpenses = () => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.createdAt);
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Date filter
            if (expenseDate < start || expenseDate > end) {
                return false;
            }

            // Category filter
            if (selectedCategory !== 'all' && expense.categoryId !== selectedCategory) {
                return false;
            }

            return true;
        });
    };

    const calculateAnalytics = () => {
        const filteredExpenses = getFilteredExpenses();

        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalCount = filteredExpenses.length;
        const averageExpense = totalCount > 0 ? totalAmount / totalCount : 0;

        // Category breakdown
        const categoryTotals = {};
        filteredExpenses.forEach(expense => {
            const categoryName = expense.categoryName || t('common.uncategorized');
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount;
        });

        const categoryBreakdown = Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount, percentage: (amount / totalAmount) * 100 }))
            .sort((a, b) => b.amount - a.amount);

        // Monthly trend (last 6 months)
        const monthlyData = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        filteredExpenses.forEach(expense => {
            const date = new Date(expense.createdAt);
            if (date >= sixMonthsAgo) {
                const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
            }
        });

        const monthlyTrend = Object.entries(monthlyData)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Top expenses
        const topExpenses = filteredExpenses
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        setAnalytics({
            totalExpenses: totalCount,
            totalAmount,
            averageExpense,
            categoryBreakdown,
            monthlyTrend,
            topExpenses
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatMonth = (monthString) => {
        const date = new Date(monthString + '-01');
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short'
        });
    };

    const exportData = () => {
        const filteredExpenses = getFilteredExpenses();
        const csvContent = [
            ['Date', 'Title', 'Category', 'Amount', 'Description'].join(','),
            ...filteredExpenses.map(expense => [
                formatDate(expense.createdAt),
                `"${expense.title}"`,
                `"${expense.categoryName || ''}"`,
                expense.amount,
                `"${expense.description || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-analysis-${startDate}-to-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={`financial-expenses-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`financial-expenses-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('common.error')}</h3>
                    <p>{error}</p>
                    <button onClick={loadData} className="retry-button">
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`financial-expenses-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-text">
                        <button
                            onClick={() => navigate('/reports')}
                            className="back-button"
                            title={t('common.back')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <path d="m12 19-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="page-title">
                                <span className="title-icon">📊</span>
                                {t('reports.financial.expenseAnalysis')}
                            </h1>
                            <p className="page-description">
                                {t('reports.financial.expenseAnalysisDescription')}
                            </p>
                        </div>
                    </div>
                    <button onClick={exportData} className="export-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {t('reports.export')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>{t('reports.dateRange')}</label>
                        <div className="date-range-buttons">
                            {['week', 'month', 'quarter', 'year'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => handleDateRangeChange(range)}
                                    className={`range-button ${dateRange === range ? 'active' : ''}`}
                                >
                                    {t(`reports.ranges.${range}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>{t('reports.customDate')}</label>
                        <div className="date-inputs">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="date-input"
                            />
                            <span>-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="date-input"
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>{t('expenses.fields.category')}</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="category-select"
                        >
                            <option value="all">{t('common.all')}</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="analytics-grid">
                <div className="analytics-card">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <div className="card-value">{formatCurrency(analytics.totalAmount)}</div>
                        <div className="card-label">{t('reports.financial.totalAmount')}</div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-icon">📝</div>
                    <div className="card-content">
                        <div className="card-value">{analytics.totalExpenses}</div>
                        <div className="card-label">{t('reports.financial.totalExpenses')}</div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                        <div className="card-value">{formatCurrency(analytics.averageExpense)}</div>
                        <div className="card-label">{t('reports.financial.averageExpense')}</div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                        <div className="card-value">{analytics.categoryBreakdown.length}</div>
                        <div className="card-label">{t('reports.financial.categories')}</div>
                    </div>
                </div>
            </div>

            {/* Charts and Analysis */}
            <div className="analysis-grid">
                {/* Category Breakdown */}
                <div className="analysis-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="title-icon">🏷️</span>
                            {t('reports.financial.categoryBreakdown')}
                        </h3>
                    </div>
                    <div className="card-content">
                        {analytics.categoryBreakdown.length > 0 ? (
                            <div className="category-list">
                                {analytics.categoryBreakdown.map((item, index) => (
                                    <div key={index} className="category-item">
                                        <div className="category-info">
                                            <span className="category-name">{item.category}</span>
                                            <span className="category-amount">{formatCurrency(item.amount)}</span>
                                        </div>
                                        <div className="category-bar">
                                            <div
                                                className="category-fill"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="category-percentage">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">
                                <span className="no-data-icon">📊</span>
                                <p>{t('reports.noData')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="analysis-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="title-icon">📈</span>
                            {t('reports.financial.monthlyTrend')}
                        </h3>
                    </div>
                    <div className="card-content">
                        {analytics.monthlyTrend.length > 0 ? (
                            <div className="trend-chart">
                                {analytics.monthlyTrend.map((item, index) => {
                                    const maxAmount = Math.max(...analytics.monthlyTrend.map(t => t.amount));
                                    const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

                                    return (
                                        <div key={index} className="trend-bar">
                                            <div className="bar-container">
                                                <div
                                                    className="bar-fill"
                                                    style={{ height: `${height}%` }}
                                                    title={`${formatMonth(item.month)}: ${formatCurrency(item.amount)}`}
                                                ></div>
                                            </div>
                                            <div className="bar-label">{formatMonth(item.month)}</div>
                                            <div className="bar-value">{formatCurrency(item.amount)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-data">
                                <span className="no-data-icon">📈</span>
                                <p>{t('reports.noData')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Expenses */}
                <div className="analysis-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="title-icon">🔝</span>
                            {t('reports.financial.topExpenses')}
                        </h3>
                    </div>
                    <div className="card-content">
                        {analytics.topExpenses.length > 0 ? (
                            <div className="top-expenses-list">
                                {analytics.topExpenses.map((expense, index) => (
                                    <div key={expense.id} className="expense-item">
                                        <div className="expense-rank">#{index + 1}</div>
                                        <div className="expense-details">
                                            <div className="expense-title">{expense.title}</div>
                                            <div className="expense-meta">
                                                <span className="expense-category">{expense.categoryName}</span>
                                                <span className="expense-date">{formatDate(expense.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">
                                <span className="no-data-icon">🔝</span>
                                <p>{t('reports.noData')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialExpenses;