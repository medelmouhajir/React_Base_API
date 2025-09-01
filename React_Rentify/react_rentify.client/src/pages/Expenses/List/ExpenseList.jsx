// src/pages/Expenses/List/ExpenseList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { expenseService } from '../../../services/expenseService';
import './ExpenseList.css';

const ExpenseList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    // State management
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Load data on component mount
    useEffect(() => {
        if (agencyId) {
            loadExpenses();
            loadCategories();
        }
    }, [agencyId]);

    // Apply filters when dependencies change
    useEffect(() => {
        applyFilters();
    }, [expenses, searchTerm, selectedCategory, dateRange, sortBy, sortOrder]);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await expenseService.getByAgencyId(agencyId);
            setExpenses(data || []);
        } catch (err) {
            console.error('Error loading expenses:', err);
            setError(t('expenses.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await expenseService.getCategoriesByAgencyId(agencyId);
            setCategories(data || []);
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const applyFilters = () => {
        let filtered = [...expenses];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(expense =>
                expense.title?.toLowerCase().includes(term) ||
                expense.description?.toLowerCase().includes(term) ||
                expense.expense_Category?.name?.toLowerCase().includes(term)
            );
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(expense =>
                expense.expense_CategoryId === selectedCategory
            );
        }

        // Date range filter
        if (dateRange.startDate) {
            filtered = filtered.filter(expense =>
                new Date(expense.created_At) >= new Date(dateRange.startDate)
            );
        }
        if (dateRange.endDate) {
            filtered = filtered.filter(expense =>
                new Date(expense.created_At) <= new Date(dateRange.endDate)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'created_At') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (sortBy === 'amount') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredExpenses(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm(t('expenses.confirmDelete'))) return;

        try {
            await expenseService.delete(expenseId);
            await loadExpenses(); // Reload the list
        } catch (err) {
            console.error('Error deleting expense:', err);
            setError(t('expenses.errorDeleting'));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getTotalAmount = () => {
        return filteredExpenses.reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

    if (loading) {
        return (
            <div className={`expense-list-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`expense-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="expense-list-header">
                <div className="header-content">
                    <h1 className="page-title">{t('expenses.list.title')}</h1>
                    <p className="page-description">{t('expenses.list.description')}</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/expenses/add')}
                >
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t('expenses.add.title')}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="summary-content">
                        <h3>{t('expenses.summary.total')}</h3>
                        <p className="summary-value">{formatCurrency(getTotalAmount())}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 11H3l5 5 4-4 5 4v-7h-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="summary-content">
                        <h3>{t('expenses.summary.count')}</h3>
                        <p className="summary-value">{filteredExpenses.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-expenses-section">
                <div className="filters-expenses-row">
                    <div className="search-expenses-group">
                        <div className="search-expenses-input-wrapper">
                            <svg className="search-icon-expenses" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                                <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('expenses.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input-expenses"
                            />
                        </div>
                    </div>

                    <div className="filter-expenses-group">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-expenses-select"
                        >
                            <option value="">{t('expenses.filters.allCategories')}</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-expenses-group">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="date-input"
                            placeholder={t('expenses.filters.startDate')}
                        />
                    </div>

                    <div className="filter-expenses-group">
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="date-input"
                            placeholder={t('expenses.filters.endDate')}
                        />
                    </div>

                    <div className="sort-group">
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="sort-select"
                        >
                            <option value="created_At-desc">{t('expenses.sort.dateDesc')}</option>
                            <option value="created_At-asc">{t('expenses.sort.dateAsc')}</option>
                            <option value="amount-desc">{t('expenses.sort.amountDesc')}</option>
                            <option value="amount-asc">{t('expenses.sort.amountAsc')}</option>
                            <option value="title-asc">{t('expenses.sort.titleAsc')}</option>
                            <option value="title-desc">{t('expenses.sort.titleDesc')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <line x1="15" y1="9" x2="9" y2="15" strokeWidth={2} strokeLinecap="round" />
                        <line x1="9" y1="9" x2="15" y2="15" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Expenses Table/List */}
            {currentItems.length > 0 ? (
                <>
                    <div className="expenses-table-container">
                        <table className="expenses-table">
                            <thead>
                                <tr>
                                    <th>{t('expenses.fields.title')}</th>
                                    <th>{t('expenses.fields.category')}</th>
                                    <th>{t('expenses.fields.amount')}</th>
                                    <th>{t('expenses.fields.date')}</th>
                                    <th>{t('expenses.fields.createdBy')}</th>
                                    <th className="actions-column">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((expense) => (
                                    <tr key={expense.id} className="expense-row">
                                        <td className="title-cell">
                                            <div className="expense-title">{expense.title}</div>
                                            {expense.description && (
                                                <div className="expense-description">{expense.description}</div>
                                            )}
                                        </td>
                                        <td>
                                            <span className="category-badge">
                                                {expense.categoryName}
                                            </span>
                                        </td>
                                        <td className="amount-cell">
                                            <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                                        </td>
                                        <td className="date-cell">
                                            {formatDate(expense.createdAt)}
                                        </td>
                                        <td>
                                            {expense.created_By?.fullName || expense?.createdByName || t('common.unknown')}
                                        </td>
                                        <td className="actions-cell">
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-view"
                                                    onClick={() => navigate(`/expenses/${expense.id}`)}
                                                    title={t('common.view')}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    title={t('common.delete')}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <polyline points="3,6 5,6 21,6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="expenses-mobile-list">
                        {currentItems.map((expense) => (
                            <div key={expense.id} className="expense-card">
                                <div className="card-header">
                                    <h3 className="expense-title">{expense.title}</h3>
                                    <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                                </div>

                                {expense.description && (
                                    <p className="expense-description">{expense.description}</p>
                                )}

                                <div className="card-details">
                                    <div className="detail-item">
                                        <span className="detail-label">{t('expenses.fields.category')}:</span>
                                        <span className="category-badge">
                                            {expense.categoryName || t('common.unknown')}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">{t('expenses.fields.date')}:</span>
                                        <span>{formatDate(expense.createdAt)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">{t('expenses.fields.createdBy')}:</span>
                                        <span>{expense.created_By?.fullName || expense.createdByName || t('common.unknown')}</span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => navigate(`/expenses/${expense.id}`)}
                                    >
                                        {t('common.view')}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteExpense(expense.id)}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination-info">
                                {t('common.pagination.showing', {
                                    start: indexOfFirstItem + 1,
                                    end: Math.min(indexOfLastItem, filteredExpenses.length),
                                    total: filteredExpenses.length
                                })}
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    {t('common.pagination.previous')}
                                </button>

                                <div className="page-numbers">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const page = index + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    className={`page-btn ${page === currentPage ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="page-ellipsis">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    {t('common.pagination.next')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3>{t('expenses.empty.title')}</h3>
                    <p>{t('expenses.empty.description')}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/expenses/add')}
                    >
                        {t('expenses.empty.addFirst')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;