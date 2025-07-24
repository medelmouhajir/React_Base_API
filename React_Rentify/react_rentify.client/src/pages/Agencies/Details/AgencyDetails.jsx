// src/pages/Agencies/Details/AgencyDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
import agencyService from '../../../services/agencyService';
import agencyStaffService from '../../../services/agencyStaffService';
import './AgencyDetails.css';

const AgencyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    useRtlDirection();

    // State
    const [agency, setAgency] = useState(null);
    const [staff, setStaff] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        const fetchAgencyData = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                setError(null);

                // Fetch agency details
                const agencyData = await agencyService.getById(id);
                setAgency(agencyData);

                // Fetch staff if user is admin
                if (isAdmin) {
                    try {
                        const staffData = await agencyStaffService.getStaffByAgencyId(id);
                        setStaff(staffData || []);
                    } catch (staffErr) {
                        console.error('Error fetching staff:', staffErr);
                        // Don't set error state for staff fetch failure
                    }
                }

                // Fetch attachments
                try {
                    const attachmentData = await agencyService.getAttachments(id);
                    setAttachments(attachmentData || []);
                } catch (attachErr) {
                    console.error('Error fetching attachments:', attachErr);
                    // Don't set error state for attachments fetch failure
                }

            } catch (err) {
                console.error('Error fetching agency details:', err);
                setError(t('agencyDetails.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgencyData();
    }, [id, t, isAdmin]);

    const handleEdit = () => {
        navigate(`/agencies/edit/${id}`);
    };

    const handleManageSubscription = () => {
        navigate(`/agencies/${id}/subscription`);
    };

    const handleManageStaff = () => {
        navigate(`/agencies/${id}/staff`);
    };


    const handleDeleteAgency = async () => {
        setActionLoading(prev => ({ ...prev, delete: true }));
        try {
            await agencyService.delete(id);
            navigate('/agencies', {
                state: { message: t('agencyDetails.deleteSuccess') }
            });
        } catch (err) {
            console.error('Error deleting agency:', err);
            setError(t('agencyDetails.deleteError'));
        } finally {
            setActionLoading(prev => ({ ...prev, delete: false }));
            setShowConfirmDelete(false);
        }
    };

    const handleBackToList = () => {
        navigate('/agencies');
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleDateString(t('common.locale'), {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        return imagePath.startsWith('http') ? imagePath : `${apiBaseUrl}${imagePath}`;
    };

    if (isLoading) {
        return (
            <div className="agency-details-container">
                <div className="loading-wrapper">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="agency-details-container">
                <div className="error-wrapper">
                    <div className="error-icon">⚠️</div>
                    <h2>{t('common.error')}</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="agency-details-container">
                <div className="not-found-wrapper">
                    <h2>{t('agencyDetails.notFound')}</h2>
                    <button onClick={handleBackToList} className="back-button">
                        {t('common.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`agency-details-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="agency-details-header">
                <div className="header-left">
                    <button onClick={handleBackToList} className="back-button" aria-label={t('common.goBack')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                        <span>{t('common.backToList')}</span>
                    </button>
                    <div className="agency-title">
                        <h1>{agency.name}</h1>
                        <p className="agency-subtitle">{t('agencyDetails.subtitle')}</p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="header-actions">
                        <button
                            onClick={handleEdit}
                            className="action-button primary"
                            aria-label={t('agencyDetails.editAgency')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span className="button-text">{t('agencyDetails.editAgency')}</span>
                        </button>

                        <div className="dropdown-wrapper">
                            <button className="action-button secondary dropdown-toggle">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                </svg>
                                <span className="button-text">{t('common.actions')}</span>
                            </button>

                            <div className="dropdown-menu">
                                <button onClick={handleManageSubscription} className="dropdown-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    {t('agencyDetails.manageSubscription')}
                                </button>

                                <button onClick={handleManageStaff} className="dropdown-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    {t('agencyDetails.manageStaff')}
                                </button>


                                <div className="dropdown-divider"></div>

                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="dropdown-item danger"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                                    </svg>
                                    {t('agencyDetails.deleteAgency')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="agency-details-content">
                {/* Basic Information */}
                <div className="details-section">
                    <div className="section-header">
                        <h2>{t('agencyDetails.basicInformation')}</h2>
                    </div>

                    <div className="agency-info-grid">
                        <div className="agency-logo-section">
                            {agency.logoUrl ? (
                                <img
                                    src={getImageUrl(agency.logoUrl)}
                                    alt={t('agencyDetails.logoAlt')}
                                    className="agency-logo"
                                />
                            ) : (
                                <div className="no-logo">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                    <span>{t('agencyDetails.noLogo')}</span>
                                </div>
                            )}
                        </div>

                        <div className="agency-basic-info">
                            <div className="info-row">
                                <label>{t('agency.fields.name')}</label>
                                <span>{agency.name}</span>
                            </div>

                            <div className="info-row">
                                <label>{t('agency.fields.email')}</label>
                                <span>{agency.email || t('common.notAvailable')}</span>
                            </div>

                            <div className="info-row">
                                <label>{t('agency.fields.phoneOne')}</label>
                                <span>{agency.phoneOne || t('common.notAvailable')}</span>
                            </div>

                            {agency.phoneTwo && (
                                <div className="info-row">
                                    <label>{t('agency.fields.phoneTwo')}</label>
                                    <span>{agency.phoneTwo}</span>
                                </div>
                            )}

                            <div className="info-row">
                                <label>{t('agency.fields.address')}</label>
                                <span>{agency.address || t('common.notAvailable')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics (if admin) */}
                {isAdmin && (
                    <div className="details-section">
                        <div className="section-header">
                            <h2>{t('agencyDetails.statistics')}</h2>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{staff.length}</div>
                                    <div className="stat-label">{t('agencyDetails.staffMembers')}</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M7 17V7a2 2 0 0 1 2-2h10l-2-2H9a4 4 0 0 0-4 4v10" />
                                        <path d="M11 13h6l-3-3 3-3" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{agency.cars?.length || 0}</div>
                                    <div className="stat-label">{t('agencyDetails.vehicles')}</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="20" y1="8" x2="20" y2="14" />
                                        <line x1="23" y1="11" x2="17" y2="11" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{agency.customers?.length || 0}</div>
                                    <div className="stat-label">{t('agencyDetails.customers')}</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14,2 14,8 20,8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{agency.reservations?.length || 0}</div>
                                    <div className="stat-label">{t('agencyDetails.reservations')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Members (if admin) */}
                {isAdmin && staff.length > 0 && (
                    <div className="details-section">
                        <div className="section-header">
                            <h2>{t('agencyDetails.staffMembers')}</h2>
                            <button onClick={handleManageStaff} className="section-action">
                                {t('agencyDetails.manageAll')}
                            </button>
                        </div>

                        <div className="staff-grid">
                            {staff.slice(0, 6).map((member) => (
                                <div key={member.id} className="staff-card">
                                    <div className="staff-avatar">
                                        {member.profileImageUrl ? (
                                            <img src={getImageUrl(member.profileImageUrl)} alt={member.fullName} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {member.fullName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="staff-info">
                                        <h4>{member.fullName}</h4>
                                        <p className="staff-role">{member.role}</p>
                                        <p className="staff-email">{member.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {staff.length > 6 && (
                            <div className="show-more">
                                <button onClick={handleManageStaff} className="show-more-button">
                                    {t('agencyDetails.viewAllStaff', { count: staff.length })}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="details-section">
                        <div className="section-header">
                            <h2>{t('agencyDetails.attachments')}</h2>
                        </div>

                        <div className="attachments-grid">
                            {attachments.map((attachment) => (
                                <div key={attachment.id} className="attachment-card">
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
                                        <h4>{attachment.fileName || attachment.title}</h4>
                                        <p className="attachment-date">
                                            {formatDate(attachment.createdAt)}
                                        </p>
                                    </div>

                                    <a
                                        href={getImageUrl(attachment.urlPath)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="attachment-download"
                                        aria-label={t('common.download')}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7,10 12,15 17,10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Conditions */}
                {agency.conditions && (
                    <div className="details-section">
                        <div className="section-header">
                            <h2>{t('agencyDetails.conditions')}</h2>
                        </div>

                        <div className="conditions-content">
                            <p>{agency.conditions}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirmDelete && (
                <div className="modal-overlay" onClick={() => setShowConfirmDelete(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('agencyDetails.confirmDelete')}</h3>
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                className="modal-close"
                                aria-label={t('common.close')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>{t('agencyDetails.deleteWarning')}</p>
                            <p className="delete-agency-name">{agency.name}</p>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                className="button-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDeleteAgency}
                                className="button-danger"
                                disabled={actionLoading.delete}
                            >
                                {actionLoading.delete ? t('common.loading') : t('agencyDetails.confirmDeleteButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyDetails;