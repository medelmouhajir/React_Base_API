// src/pages/Invoices/List/InvoicesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import invoiceService from '../../../services/invoiceService';
import './InvoicesList.css';

const InvoicesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('issuedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!agencyId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await invoiceService.getByAgencyId(agencyId);
                setInvoices(data);
                setFilteredInvoices(data);
            } catch (err) {
                console.error('❌ Error fetching invoices:', err);
                setError(t('invoice.list.fetchError') || 'Failed to load invoices. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, [agencyId, t]);

    const handleFilter = () => {
        let filtered = [...invoices];

        // Date filtering
        if (fromDate || toDate) {
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(toDate) : null;

            filtered = filtered.filter((inv) => {
                const issued = new Date(inv.issuedAt);
                if (from && issued < from) return false;
                if (to) {
                    const toEnd = new Date(to);
                    toEnd.setHours(23, 59, 59, 999);
                    if (issued > toEnd) return false;
                }
                return true;
            });
        }

        // Search filtering
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((inv) =>
                inv.reservationId?.toString().toLowerCase().includes(term) ||
                inv.amount?.toString().includes(term) ||
                inv.currency?.toLowerCase().includes(term) ||
                (inv.isPaid ? 'paid' : 'unpaid').includes(term)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'issuedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredInvoices(filtered);
    };

    const handleClear = () => {
        setFromDate('');
        setToDate('');
        setSearchTerm('');
        setSortBy('issuedAt');
        setSortOrder('desc');
        setFilteredInvoices(invoices);
    };

    const handleRetry = () => {
        const fetchInvoices = async () => {
            if (!agencyId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await invoiceService.getByAgencyId(agencyId);
                setInvoices(data);
                setFilteredInvoices(data);
            } catch (err) {
                console.error('❌ Error fetching invoices:', err);
                setError(t('invoice.list.fetchError') || 'Failed to load invoices. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    };

    // Apply filters whenever dependencies change
    useEffect(() => {
        handleFilter();
    }, [invoices, searchTerm, sortBy, sortOrder, fromDate, toDate]);

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const getStatusColor = (isPaid) => {
        return isPaid ? 'status-paid' : 'status-unpaid';
    };

    if (error) {
        return (
            <div className={`invoices-list-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3 className="error-title">{t('common.error') || 'Error'}</h3>
                    <p className="error-message">{error}</p>
                    <button className="retry-button" onClick={handleRetry}>
                        {t('common.retry') || 'Try Again'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`invoices-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="invoices-list-header">
                <div className="header-content">
                    <h1 className="page-title">{t('invoice.list.title') || 'Invoices'}</h1>
                    <div className="header-stats">
                        <span className="stats-item">
                            {t('invoice.list.total') || 'Total'}: {filteredInvoices.length}
                        </span>
                        <span className="stats-item">
                            {t('invoice.list.paid') || 'Paid'}: {filteredInvoices.filter(inv => inv.isPaid).length}
                        </span>
                    </div>
                </div>
                <button
                    className="add-button"
                    onClick={() => navigate('/invoices/add')}
                >
                    <span className="add-icon">+</span>
                    <span className="add-text">{t('invoice.list.new') || 'New Invoice'}</span>
                </button>
            </div>

            {/* Search and Controls */}
            <div className="controls-section">
                <div className="search-invoices-wrapper">
                    <input
                        type="text"
                        className="search-input-invoices"
                        placeholder={t('invoice.list.search') || 'Search invoices...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="search-invoices-icon">🔍</div>
                </div>

                <div className="controls-actions">
                    <button
                        className="toggle-filters-button"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span className="filter-icon">⚙️</span>
                        <span>{t('common.filters') || 'Filters'}</span>
                        <span className={`chevron ${showFilters ? 'expanded' : ''}`}>▼</span>
                    </button>

                    <select
                        className="sort-select"
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-');
                            setSortBy(field);
                            setSortOrder(order);
                        }}
                    >
                        <option value="issuedAt-desc">{t('invoice.sort.dateDesc') || 'Date (Newest)'}</option>
                        <option value="issuedAt-asc">{t('invoice.sort.dateAsc') || 'Date (Oldest)'}</option>
                        <option value="amount-desc">{t('invoice.sort.amountDesc') || 'Amount (High to Low)'}</option>
                        <option value="amount-asc">{t('invoice.sort.amountAsc') || 'Amount (Low to High)'}</option>
                    </select>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label htmlFor="fromDate">{t('invoice.filters.from') || 'From Date'}</label>
                            <input
                                type="date"
                                id="fromDate"
                                className="filter-input"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="toDate">{t('invoice.filters.to') || 'To Date'}</label>
                            <input
                                type="date"
                                id="toDate"
                                className="filter-input"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button className="clear-filters-button" onClick={handleClear}>
                            {t('common.clear') || 'Clear All'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">{t('common.loading') || 'Loading invoices...'}</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3 className="empty-title">{t('invoice.list.noInvoices') || 'No Invoices Found'}</h3>
                    <p className="empty-message">
                        {searchTerm || fromDate || toDate
                            ? (t('invoice.list.noResults') || 'No invoices match your search criteria. Try adjusting your filters.')
                            : (t('invoice.list.noInvoicesMessage') || 'Get started by creating your first invoice.')
                        }
                    </p>
                    {!searchTerm && !fromDate && !toDate && (
                        <button
                            className="empty-action-button"
                            onClick={() => navigate('/invoices/add')}
                        >
                            {t('invoice.list.createFirst') || 'Create First Invoice'}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="desktop-table">
                        <div className="table-responsive">
                            <table className="invoices-table">
                                <thead>
                                    <tr>
                                        <th>{t('invoice.fields.issuedAt') || 'Issued Date'}</th>
                                        <th>{t('invoice.fields.amount') || 'Amount'}</th>
                                        <th>{t('invoice.fields.status') || 'Status'}</th>
                                        <th>{t('invoice.fields.reservation') || 'Reservation'}</th>
                                        <th>{t('invoice.fields.paymentMethod') || 'Payment Method'}</th>
                                        <th className="actions-column">{t('common.actions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="table-row">
                                            <td className="date-cell">
                                                {new Date(invoice.issuedAt).toLocaleDateString()}
                                            </td>
                                            <td className="amount-cell">
                                                {formatCurrency(invoice.amount, invoice.currency)}
                                            </td>
                                            <td className="status-cell">
                                                <span className={`status-badge ${getStatusColor(invoice.isPaid)}`}>
                                                    {invoice.isPaid ? (t('common.paid') || 'Paid') : (t('common.unpaid') || 'Unpaid')}
                                                </span>
                                            </td>
                                            <td className="reservation-cell">
                                                #{invoice.reservationId?.toString().slice(-6) || 'N/A'}
                                            </td>
                                            <td className="payment-method-cell">
                                                {invoice.paymentMethod || '-'}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="action-button view-button"
                                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                                >
                                                    {t('common.view') || 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-cards">
                        {filteredInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="invoice-card"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                            >
                                <div className="card-header">
                                    <div className="card-title">
                                        <span className="invoice-amount">
                                            {formatCurrency(invoice.amount, invoice.currency)}
                                        </span>
                                        <span className={`status-badge ${getStatusColor(invoice.isPaid)}`}>
                                            {invoice.isPaid ? (t('common.paid') || 'Paid') : (t('common.unpaid') || 'Unpaid')}
                                        </span>
                                    </div>
                                    <div className="card-date">
                                        {new Date(invoice.issuedAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="card-row">
                                        <span className="card-label">{t('invoice.fields.reservation') || 'Reservation'}:</span>
                                        <span className="card-value">#{invoice.reservationId?.toString().slice(-6) || 'N/A'}</span>
                                    </div>
                                    {invoice.paymentMethod && (
                                        <div className="card-row">
                                            <span className="card-label">{t('invoice.fields.paymentMethod') || 'Payment Method'}:</span>
                                            <span className="card-value">{invoice.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="action-button view-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/invoices/${invoice.id}`);
                                        }}
                                    >
                                        {t('common.viewDetails') || 'View Details'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoicesList;