// src/pages/Expenses/Details/ExpenseDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { expenseService } from '../../../services/expenseService';
import './ExpenseDetails.css';

const ExpenseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();

    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadExpense();
    }, [id]);

    const loadExpense = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await expenseService.getById(id);
            setExpense(data);
        } catch (err) {
            console.error('Error loading expense:', err);
            setError(err.message || t('expenses.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await expenseService.delete(id);
            navigate('/expenses', {
                replace: true,
                state: { message: t('expenses.messages.deleteSuccess') }
            });
        } catch (err) {
            console.error('Error deleting expense:', err);
            setError(err.message || t('expenses.errors.deleteFailed'));
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={`expense-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="expense-details-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`expense-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="expense-details-error">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('common.error')}</h3>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={loadExpense} className="btn-retry">
                            {t('common.retry')}
                        </button>
                        <Link to="/expenses" className="btn-back">
                            {t('common.goBack')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className={`expense-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="expense-details-not-found">
                    <div className="not-found-icon">📄</div>
                    <h3>{t('expenses.notFound.title')}</h3>
                    <p>{t('expenses.notFound.message')}</p>
                    <Link to="/expenses" className="btn-back">
                        {t('common.goBack')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`expense-details-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="expense-details-header">
                <div className="header-navigation">
                    <Link to="/expenses" className="back-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5m7-7l-7 7 7 7" />
                        </svg>
                        {t('common.back')}
                    </Link>
                </div>

                <div className="header-content">
                    <div className="header-title-section">
                        <h1 className="page-title">{t('expenses.details.title')}</h1>
                        <div className="header-meta">
                            <span className="expense-id">ID: {expense.id}</span>
                            <span className="creation-date">
                                {t('expenses.fields.createdAt')}: {formatDate(expense.createdAt)}
                            </span>
                        </div>
                    </div>

                    <div className="header-actions">

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn-action btn-delete"
                            disabled={isDeleting}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                            </svg>
                            {isDeleting ? t('common.deleting') : t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="expense-details-content">
                {/* Basic Information Card */}
                <div className="details-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            {t('expenses.details.basicInfo')}
                        </h2>
                    </div>

                    <div className="card-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.title')}</label>
                                <div className="info-value expense-title">{expense.title}</div>
                            </div>

                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.amount')}</label>
                                <div className="info-value expense-amount">{formatCurrency(expense.amount)}</div>
                            </div>

                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.category')}</label>
                                <div className="info-value expense-category">
                                    <span className="category-badge">{expense.categoryName}</span>
                                </div>
                            </div>

                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.createdBy')}</label>
                                <div className="info-value expense-creator">
                                    <div className="creator-info">
                                        <span className="creator-name">{expense.createdByName || t('common.unknown')}</span>
                                        <span className="creator-date">{formatDate(expense.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {expense.description && (
                                <div className="info-item full-width">
                                    <label className="info-label">{t('expenses.fields.description')}</label>
                                    <div className="info-value expense-description">{expense.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Agency Information Card */}
                <div className="details-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9,22 9,12 15,12 15,22" />
                            </svg>
                            {t('expenses.details.agencyInfo')}
                        </h2>
                    </div>

                    <div className="card-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.agency')}</label>
                                <div className="info-value expense-agency">
                                    <span className="agency-name">{expense.agencyName}</span>
                                </div>
                            </div>

                            <div className="info-item">
                                <label className="info-label">{t('expenses.fields.agencyId')}</label>
                                <div className="info-value expense-agency-id">{expense.agencyId}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments Card */}
                {expense.attachments && expense.attachments.length > 0 && (
                    <div className="details-card">
                        <div className="card-header">
                            <h2 className="card-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                                {t('expenses.details.attachments')} ({expense.attachments.length})
                            </h2>
                        </div>

                        <div className="card-content">
                            <div className="attachments-grid">
                                {expense.attachments.map((attachment) => (
                                    <div key={attachment.id} className="attachment-item">
                                        <div className="attachment-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14,2 14,8 20,8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                                <polyline points="10,9 9,9 8,9" />
                                            </svg>
                                        </div>
                                        <div className="attachment-info">
                                            <div className="attachment-title">{attachment.title}</div>
                                            <div className="attachment-date">{formatDate(attachment.createdAt)}</div>
                                        </div>
                                        <a
                                            href={attachment.urlPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="attachment-download"
                                            title={t('expenses.attachments.download')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7,10 12,15 17,10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('expenses.delete.confirmTitle')}</h3>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="modal-close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="warning-icon">⚠️</div>
                            <p>{t('expenses.delete.confirmMessage', { title: expense.title })}</p>
                            <p className="warning-text">{t('expenses.delete.warningText')}</p>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-cancel"
                                disabled={isDeleting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn-confirm-delete"
                                disabled={isDeleting}
                            >
                                {isDeleting ? t('common.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseDetails;