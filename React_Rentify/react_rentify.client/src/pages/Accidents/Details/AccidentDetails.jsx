// src/pages/Accidents/Details/AccidentDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import './AccidentDetails.css';
import accidentService from '../../../services/accidentService';

const AccidentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // State management
    const [accident, setAccident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Expense/Refund modal states
    const [expenseModal, setExpenseModal] = useState({ open: false, name: '', amount: '', file: null });
    const [refundModal, setRefundModal] = useState({ open: false, name: '', amount: '', file: null });

    // Loading states for actions
    const [actionLoading, setActionLoading] = useState({
        updateStatus: false,
        updateExpert: false,
        addExpense: false,
        addRefund: false
    });

    // Fetch accident data
    useEffect(() => {
        const fetchAccident = async () => {
            try {
                setLoading(true);
                const data = await accidentService.getById(id);
                setAccident(data);
                setEditData({
                    accidentDate: new Date(data.accidentDate).toISOString().slice(0, 16),
                    notes: data.notes,
                    status: data.status,
                    expertFullname: data.expertFullname || '',
                    expertPhone: data.expertPhone || ''
                });
            } catch (err) {
                setError(err.message);
                toast.error(t('accidents.details.loadError'));
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAccident();
        }
    }, [id, t]);

    // Handle update accident
    const handleUpdate = async () => {
        try {
            setActionLoading(prev => ({ ...prev, updateStatus: true }));
            const updatedAccident = await accidentService.update(id, {
                id: accident.id,
                accidentDate: new Date(editData.accidentDate),
                notes: editData.notes,
                status: parseInt(editData.status),
                expertFullname: editData.expertFullname,
                expertPhone: editData.expertPhone
            });
            setAccident(updatedAccident);
            setIsEditing(false);
            toast.success(t('accidents.details.updateSuccess'));
        } catch (err) {
            toast.error(t('accidents.details.updateError'));
        } finally {
            setActionLoading(prev => ({ ...prev, updateStatus: false }));
        }
    };

    // Handle add expense
    const handleAddExpense = async () => {
        if (!expenseModal.name || !expenseModal.amount) {
            toast.error(t('accidents.details.fillAllFields'));
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, addExpense: true }));
            await accidentService.addExpense(id, expenseModal.name, parseFloat(expenseModal.amount), expenseModal.file);

            // Refresh accident data
            const updatedAccident = await accidentService.getById(id);
            setAccident(updatedAccident);

            setExpenseModal({ open: false, name: '', amount: '', file: null });
            toast.success(t('accidents.details.expenseAdded'));
        } catch (err) {
            toast.error(t('accidents.details.expenseError'));
        } finally {
            setActionLoading(prev => ({ ...prev, addExpense: false }));
        }
    };

    // Handle add refund
    const handleAddRefund = async () => {
        if (!refundModal.name || !refundModal.amount) {
            toast.error(t('accidents.details.fillAllFields'));
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, addRefund: true }));
            await accidentService.addRefund(id, refundModal.name, parseFloat(refundModal.amount), refundModal.file);

            // Refresh accident data
            const updatedAccident = await accidentService.getById(id);
            setAccident(updatedAccident);

            setRefundModal({ open: false, name: '', amount: '', file: null });
            toast.success(t('accidents.details.refundAdded'));
        } catch (err) {
            toast.error(t('accidents.details.refundError'));
        } finally {
            setActionLoading(prev => ({ ...prev, addRefund: false }));
        }
    };

    // Handle delete expense
    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm(t('accidents.details.confirmDeleteExpense'))) return;

        try {
            await accidentService.deleteExpense(id, expenseId);
            const updatedAccident = await accidentService.getById(id);
            setAccident(updatedAccident);
            toast.success(t('accidents.details.expenseDeleted'));
        } catch (err) {
            toast.error(t('accidents.details.deleteExpenseError'));
        }
    };

    // Handle delete refund
    const handleDeleteRefund = async (refundId) => {
        if (!window.confirm(t('accidents.details.confirmDeleteRefund'))) return;

        try {
            await accidentService.deleteRefund(id, refundId);
            const updatedAccident = await accidentService.getById(id);
            setAccident(updatedAccident);
            toast.success(t('accidents.details.refundDeleted'));
        } catch (err) {
            toast.error(t('accidents.details.deleteRefundError'));
        }
    };

    // Handle file download
    const handleDownloadFile = async (filePath, fileName) => {
        try {
            // Extract the actual filename from the path if needed
            const actualFileName = filePath.split('/').pop() || fileName;

            // Since your backend stores files in the wwwroot/uploads directory
            // and the filePath already contains the relative path like "/uploads/Agencies/{agencyId}/Accident/{accidentId}/{filename}"
            // We can directly access it through the base URL
            const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
            const downloadUrl = `${baseUrl}${filePath}`;

            try {
                // First, try to fetch the file to check if it exists
                const response = await fetch(downloadUrl, {
                    method: 'HEAD',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('File not found or access denied');
                }

                // Create a temporary link element and trigger download
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = actualFileName;
                link.target = '_blank';

                // For browsers that support it, set authorization header for download
                // Note: This might not work for all file types in all browsers
                const authToken = localStorage.getItem('authToken');
                if (authToken) {
                    // For downloads that require auth, we'll use a different approach
                    const response = await fetch(downloadUrl, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const objectUrl = window.URL.createObjectURL(blob);
                        link.href = objectUrl;

                        // Clean up the object URL after download
                        link.addEventListener('click', () => {
                            setTimeout(() => {
                                window.URL.revokeObjectURL(objectUrl);
                            }, 100);
                        });
                    }
                }

                // Add to DOM temporarily and click
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(t('accidents.details.downloadStarted'));
            } catch (fetchError) {
                // Fallback: open in new tab if direct download fails
                window.open(downloadUrl, '_blank');
                toast.info(t('accidents.details.downloadFallback'));
            }
        } catch (err) {
            toast.error(t('accidents.details.downloadError'));
            console.error('Download error:', err);
        }
    };

    // Get status badge class
    const getStatusBadge = (status) => {
        const statusMap = {
            0: { class: 'ad-status-created', text: t('accidents.status.created') },
            1: { class: 'ad-status-maintenance', text: t('accidents.status.maintenance') },
            2: { class: 'ad-status-completed', text: t('accidents.status.completed') }
        };
        return statusMap[status] || { class: 'ad-status-unknown', text: t('accidents.status.unknown') };
    };

    // Calculate net cost
    const calculateNetCost = () => {
        const totalExpenses = accident?.totalExpenses || 0;
        const totalRefunds = accident?.totalRefunds || 0;
        return totalExpenses - totalRefunds;
    };

    // Loading screen
    if (loading) {
        return (
            <div className="accident-details-container">
                <div className="ad-loading">
                    <div className="ad-loading-spinner"></div>
                    <p>{t('accidents.details.loading')}</p>
                </div>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="accident-details-container">
                <div className="ad-error">
                    <h2>{t('accidents.details.error')}</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/accidents')} className="ad-btn ad-btn-primary">
                        {t('accidents.details.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="accident-details-container">
            {/* Header */}
            <div className="ad-header">
                <div className="ad-header-top">
                    <button onClick={() => navigate('/accidents')} className="ad-back-btn">
                        <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t('accidents.details.back')}
                    </button>

                    <div className="ad-header-actions">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="ad-btn ad-btn-secondary">
                                <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('accidents.details.edit')}
                            </button>
                        ) : (
                            <div className="ad-edit-actions">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="ad-btn ad-btn-secondary"
                                    disabled={actionLoading.updateStatus}
                                >
                                    {t('accidents.details.cancel')}
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="ad-btn ad-btn-primary"
                                    disabled={actionLoading.updateStatus}
                                >
                                    {actionLoading.updateStatus && <div className="ad-btn-spinner"></div>}
                                    {t('accidents.details.save')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ad-header-info">
                    <h1 className="ad-title">{t('accidents.details.title')}</h1>
                    <div className={`ad-status-badge ${getStatusBadge(accident?.status).class}`}>
                        {getStatusBadge(accident?.status).text}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="ad-content">
                {/* Accident Information */}
                <div className="ad-section">
                    <h2 className="ad-section-title">{t('accidents.details.accidentInfo')}</h2>
                    <div className="ad-info-grid">
                        <div className="ad-info-item">
                            <label>{t('accidents.details.accidentDate')}</label>
                            {isEditing ? (
                                <input
                                    type="datetime-local"
                                    value={editData.accidentDate}
                                    onChange={(e) => setEditData(prev => ({ ...prev, accidentDate: e.target.value }))}
                                    className="ad-input"
                                />
                            ) : (
                                <span className="ad-info-value">
                                    {new Date(accident?.accidentDate).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div className="ad-info-item">
                            <label>{t('accidents.details.status')}</label>
                            {isEditing ? (
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                                    className="ad-input"
                                >
                                    <option value={0}>{t('accidents.status.created')}</option>
                                    <option value={1}>{t('accidents.status.maintenance')}</option>
                                    <option value={2}>{t('accidents.status.completed')}</option>
                                </select>
                            ) : (
                                <div className={`ad-status-badge ${getStatusBadge(accident?.status).class}`}>
                                    {getStatusBadge(accident?.status).text}
                                </div>
                            )}
                        </div>

                        <div className="ad-info-item ad-info-full-width">
                            <label>{t('accidents.details.notes')}</label>
                            {isEditing ? (
                                <textarea
                                    value={editData.notes}
                                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="ad-input ad-textarea"
                                    rows={4}
                                />
                            ) : (
                                <span className="ad-info-value">{accident?.notes}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Car Information */}
                <div className="ad-section">
                    <h2 className="ad-section-title">{t('accidents.details.carInfo')}</h2>
                    <div className="ad-car-info">
                        <div className="ad-car-details">
                            <h3 className="ad-car-plate">{accident?.carInfo?.licensePlate}</h3>
                            <p className="ad-car-model">
                                {accident?.carInfo?.manufacturer} {accident?.carInfo?.model}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Technical Expert Information */}
                <div className="ad-section">
                    <h2 className="ad-section-title">{t('accidents.details.expertInfo')}</h2>
                    <div className="ad-info-grid">
                        <div className="ad-info-item">
                            <label>{t('accidents.details.expertName')}</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.expertFullname}
                                    onChange={(e) => setEditData(prev => ({ ...prev, expertFullname: e.target.value }))}
                                    className="ad-input"
                                    placeholder={t('accidents.details.expertNamePlaceholder')}
                                />
                            ) : (
                                <span className="ad-info-value">
                                    {accident?.expertFullname || t('accidents.details.notAssigned')}
                                </span>
                            )}
                        </div>

                        <div className="ad-info-item">
                            <label>{t('accidents.details.expertPhone')}</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editData.expertPhone}
                                    onChange={(e) => setEditData(prev => ({ ...prev, expertPhone: e.target.value }))}
                                    className="ad-input"
                                    placeholder={t('accidents.details.expertPhonePlaceholder')}
                                />
                            ) : (
                                <span className="ad-info-value">
                                    {accident?.expertPhone || t('accidents.details.notProvided')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="ad-section">
                    <h2 className="ad-section-title">{t('accidents.details.financialSummary')}</h2>
                    <div className="ad-financial-summary">
                        <div className="ad-financial-item ad-expenses">
                            <div className="ad-financial-label">{t('accidents.details.totalExpenses')}</div>
                            <div className="ad-financial-value">
                                {(accident?.totalExpenses || 0).toLocaleString()} {t('common.currency')}
                            </div>
                        </div>
                        <div className="ad-financial-item ad-refunds">
                            <div className="ad-financial-label">{t('accidents.details.totalRefunds')}</div>
                            <div className="ad-financial-value">
                                {(accident?.totalRefunds || 0).toLocaleString()} {t('common.currency')}
                            </div>
                        </div>
                        <div className="ad-financial-item ad-net-cost">
                            <div className="ad-financial-label">{t('accidents.details.netCost')}</div>
                            <div className="ad-financial-value">
                                {calculateNetCost().toLocaleString()} {t('common.currency')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="ad-section">
                    <div className="ad-section-header">
                        <h2 className="ad-section-title">{t('accidents.details.expenses')}</h2>
                        <button
                            onClick={() => setExpenseModal(prev => ({ ...prev, open: true }))}
                            className="ad-btn ad-btn-primary ad-btn-sm"
                        >
                            <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('accidents.details.addExpense')}
                        </button>
                    </div>

                    <div className="ad-list">
                        {accident?.expenses?.length > 0 ? (
                            accident.expenses.map((expense) => (
                                <div key={expense.id} className="ad-list-item">
                                    <div className="ad-list-content">
                                        <h4 className="ad-list-title">{expense.name}</h4>
                                        <p className="ad-list-meta">
                                            {new Date(expense.createdAt).toLocaleDateString()}
                                            {expense.filePath && (
                                                <span className="ad-file-indicator">
                                                    <svg className="ad-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    {t('accidents.details.hasAttachment')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="ad-list-actions">
                                        <span className="ad-list-amount">
                                            {expense.amount.toLocaleString()} {t('common.currency')}
                                        </span>
                                        <div className="ad-action-buttons">
                                            {expense.filePath && (
                                                <button
                                                    onClick={() => handleDownloadFile(expense.filePath, `${expense.name}_expense`)}
                                                    className="ad-btn-icon ad-btn-secondary"
                                                    title={t('accidents.details.downloadFile')}
                                                >
                                                    <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="ad-btn-icon ad-btn-danger"
                                                title={t('accidents.details.deleteExpense')}
                                            >
                                                <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="ad-empty">
                                <svg className="ad-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <p>{t('accidents.details.noExpenses')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Refunds Section */}
                <div className="ad-section">
                    <div className="ad-section-header">
                        <h2 className="ad-section-title">{t('accidents.details.refunds')}</h2>
                        <button
                            onClick={() => setRefundModal(prev => ({ ...prev, open: true }))}
                            className="ad-btn ad-btn-success ad-btn-sm"
                        >
                            <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('accidents.details.addRefund')}
                        </button>
                    </div>

                    <div className="ad-list">
                        {accident?.refunds?.length > 0 ? (
                            accident.refunds.map((refund) => (
                                <div key={refund.id} className="ad-list-item">
                                    <div className="ad-list-content">
                                        <h4 className="ad-list-title">{refund.name}</h4>
                                        <p className="ad-list-meta">
                                            {new Date(refund.createdAt).toLocaleDateString()}
                                            {refund.filePath && (
                                                <span className="ad-file-indicator">
                                                    <svg className="ad-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    {t('accidents.details.hasAttachment')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="ad-list-actions">
                                        <span className="ad-list-amount ad-refund-amount">
                                            +{refund.amount.toLocaleString()} {t('common.currency')}
                                        </span>
                                        <div className="ad-action-buttons">
                                            {refund.filePath && (
                                                <button
                                                    onClick={() => handleDownloadFile(refund.filePath, `${refund.name}_refund`)}
                                                    className="ad-btn-icon ad-btn-secondary"
                                                    title={t('accidents.details.downloadFile')}
                                                >
                                                    <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteRefund(refund.id)}
                                                className="ad-btn-icon ad-btn-danger"
                                                title={t('accidents.details.deleteRefund')}
                                            >
                                                <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="ad-empty">
                                <svg className="ad-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3-3-3h1m1 0h6m-7 0a3 3 0 110-6" />
                                </svg>
                                <p>{t('accidents.details.noRefunds')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {expenseModal.open && (
                <div className="ad-modal-overlay" onClick={() => setExpenseModal({ open: false, name: '', amount: '', file: null })}>
                    <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ad-modal-header">
                            <h3>{t('accidents.details.addExpense')}</h3>
                            <button
                                onClick={() => setExpenseModal({ open: false, name: '', amount: '', file: null })}
                                className="ad-modal-close"
                            >
                                <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="ad-modal-content">
                            <div className="ad-form-group">
                                <label>{t('accidents.details.expenseName')}</label>
                                <input
                                    type="text"
                                    value={expenseModal.name}
                                    onChange={(e) => setExpenseModal(prev => ({ ...prev, name: e.target.value }))}
                                    className="ad-input"
                                    placeholder={t('accidents.details.expenseNamePlaceholder')}
                                />
                            </div>

                            <div className="ad-form-group">
                                <label>{t('accidents.details.expenseAmount')}</label>
                                <input
                                    type="number"
                                    value={expenseModal.amount}
                                    onChange={(e) => setExpenseModal(prev => ({ ...prev, amount: e.target.value }))}
                                    className="ad-input"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="ad-form-group">
                                <label>{t('accidents.details.attachFile')} ({t('accidents.details.optional')})</label>
                                <input
                                    type="file"
                                    onChange={(e) => setExpenseModal(prev => ({ ...prev, file: e.target.files[0] }))}
                                    className="ad-input"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </div>
                        </div>

                        <div className="ad-modal-actions">
                            <button
                                onClick={() => setExpenseModal({ open: false, name: '', amount: '', file: null })}
                                className="ad-btn ad-btn-secondary"
                                disabled={actionLoading.addExpense}
                            >
                                {t('accidents.details.cancel')}
                            </button>
                            <button
                                onClick={handleAddExpense}
                                className="ad-btn ad-btn-primary"
                                disabled={actionLoading.addExpense}
                            >
                                {actionLoading.addExpense && <div className="ad-btn-spinner"></div>}
                                {t('accidents.details.addExpense')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Refund Modal */}
            {refundModal.open && (
                <div className="ad-modal-overlay" onClick={() => setRefundModal({ open: false, name: '', amount: '', file: null })}>
                    <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ad-modal-header">
                            <h3>{t('accidents.details.addRefund')}</h3>
                            <button
                                onClick={() => setRefundModal({ open: false, name: '', amount: '', file: null })}
                                className="ad-modal-close"
                            >
                                <svg className="ad-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="ad-modal-content">
                            <div className="ad-form-group">
                                <label>{t('accidents.details.refundName')}</label>
                                <input
                                    type="text"
                                    value={refundModal.name}
                                    onChange={(e) => setRefundModal(prev => ({ ...prev, name: e.target.value }))}
                                    className="ad-input"
                                    placeholder={t('accidents.details.refundNamePlaceholder')}
                                />
                            </div>

                            <div className="ad-form-group">
                                <label>{t('accidents.details.refundAmount')}</label>
                                <input
                                    type="number"
                                    value={refundModal.amount}
                                    onChange={(e) => setRefundModal(prev => ({ ...prev, amount: e.target.value }))}
                                    className="ad-input"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="ad-form-group">
                                <label>{t('accidents.details.attachFile')} ({t('accidents.details.optional')})</label>
                                <input
                                    type="file"
                                    onChange={(e) => setRefundModal(prev => ({ ...prev, file: e.target.files[0] }))}
                                    className="ad-input"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </div>
                        </div>

                        <div className="ad-modal-actions">
                            <button
                                onClick={() => setRefundModal({ open: false, name: '', amount: '', file: null })}
                                className="ad-btn ad-btn-secondary"
                                disabled={actionLoading.addRefund}
                            >
                                {t('accidents.details.cancel')}
                            </button>
                            <button
                                onClick={handleAddRefund}
                                className="ad-btn ad-btn-success"
                                disabled={actionLoading.addRefund}
                            >
                                {actionLoading.addRefund && <div className="ad-btn-spinner"></div>}
                                {t('accidents.details.addRefund')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccidentDetails;