// src/pages/Cars/Details/CarDetails.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carAttachmentService from '../../../services/carAttachmentService';
import './CarDetails.css';

const CarDetails = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;
    const fileInputRef = useRef(null);

    // Car data state
    const [car, setCar] = useState(null);
    const [attachments, setAttachments] = useState([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileError, setFileError] = useState(null);

    // Edit modals
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [showTechnicalVisitModal, setShowTechnicalVisitModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Forms for editing
    const [insuranceForm, setInsuranceForm] = useState({
        assuranceName: '',
        assuranceStartDate: '',
        assuranceEndDate: ''
    });

    const [technicalVisitForm, setTechnicalVisitForm] = useState({
        technicalVisitStartDate: '',
        technicalVisitEndDate: ''
    });

    // For attachment upload
    const [fileToUpload, setFileToUpload] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    // Fetch car and related data
    useEffect(() => {
        const fetchCarData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch car details
                const carData = await carService.getById(id);
                setCar(carData);

                // Initialize forms with existing data
                setInsuranceForm({
                    assuranceName: carData.assuranceName || '',
                    assuranceStartDate: carData.assuranceStartDate ?
                        new Date(carData.assuranceStartDate).toISOString().split('T')[0] : '',
                    assuranceEndDate: carData.assuranceEndDate ?
                        new Date(carData.assuranceEndDate).toISOString().split('T')[0] : ''
                });

                setTechnicalVisitForm({
                    technicalVisitStartDate: carData.technicalVisitStartDate ?
                        new Date(carData.technicalVisitStartDate).toISOString().split('T')[0] : '',
                    technicalVisitEndDate: carData.technicalVisitEndDate ?
                        new Date(carData.technicalVisitEndDate).toISOString().split('T')[0] : ''
                });

                // Fetch attachments
                if (carData.attachments) {
                    setAttachments(carData.attachments);
                }

            } catch (err) {
                console.error('Error fetching car data:', err);
                setError(err.message || 'Failed to fetch car details');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCarData();
        }
    }, [id]);

    // Tab change handler
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Insurance update handler
    const handleInsuranceUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            await carService.updateInsurance(id, insuranceForm);

            // Refresh car data
            const updatedCar = await carService.getById(id);
            setCar(updatedCar);

            setShowInsuranceModal(false);

            // Show success message
            console.log('Insurance information updated successfully');
        } catch (error) {
            console.error('Error updating insurance:', error);
            setError('Failed to update insurance information');
        } finally {
            setIsUpdating(false);
        }
    };

    // Technical visit update handler
    const handleTechnicalVisitUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            await carService.updateTechnicalVisit(id, technicalVisitForm);

            // Refresh car data
            const updatedCar = await carService.getById(id);
            setCar(updatedCar);

            setShowTechnicalVisitModal(false);

            // Show success message
            console.log('Technical visit information updated successfully');
        } catch (error) {
            console.error('Error updating technical visit:', error);
            setError('Failed to update technical visit information');
        } finally {
            setIsUpdating(false);
        }
    };

    // File upload handler
    const handleFileUpload = async () => {
        if (!fileToUpload) return;

        setUploadingFile(true);
        setFileError(null);

        try {
            await carAttachmentService.uploadFile(id, fileToUpload);

            // Refresh attachments
            const carData = await carService.getById(id);
            setAttachments(carData.attachments || []);

            setFileToUpload(null);
            setShowAttachmentModal(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setFileError('Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available': return 'var(--status-available)';
            case 'rented': return 'var(--status-unavailable)';
            case 'maintenance': return 'var(--status-maintenance)';
            case 'retired': return 'var(--status-retired)';
            default: return 'var(--text-muted)';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    // Check if document is expired
    const isExpired = (endDate) => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    // Get days until expiration
    const getDaysUntilExpiration = (endDate) => {
        if (!endDate) return null;
        const today = new Date();
        const expiry = new Date(endDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (isLoading) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error || !car) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h2>{error || (t('car.notFound') || 'Car not found')}</h2>
                    <button
                        className="back-button-primary"
                        onClick={() => navigate('/cars')}
                    >
                        {t('common.goBack') || 'Go back to cars list'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="page-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/cars')}
                    aria-label={t('common.goBack') || 'Go back'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    {t('common.back') || 'Back'}
                </button>

                <div className="header-actions">
                    <Link
                        to={`/cars/${id}/edit`}
                        className="edit-button"
                        aria-label={t('car.edit') || 'Edit car'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                        {t('common.edit') || 'Edit'}
                    </Link>
                </div>
            </div>

            {/* Car Hero Section */}
            <div className="car-hero">
                <div className="car-image-container">
                    {car.images && car.images.length > 0 ? (
                        <img
                            src={apiUrl + (car.images.find(img => img.isMainImage)?.path || car.images[0]?.path)}
                            alt={`${car.fields?.manufacturer} ${car.fields?.model}`}
                            className="car-image"
                        />
                    ) : (
                        <div className="car-placeholder">
                            <div className="car-placeholder-content">
                                <div className="car-placeholder-icon">🚗</div>
                                <p>{t('car.noImage') || 'No image available'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="car-hero-content">
                    <h1 className="car-title">
                        {car.fields?.manufacturer} {car.fields?.model}
                    </h1>
                    <p className="car-year">{car.fields?.year}</p>
                    <div className="car-status-badge">
                        <span
                            className={`status-indicator ${car.isAvailable ? 'available' : 'unavailable'}`}
                            style={{ backgroundColor: getStatusColor(car.status) }}
                        ></span>
                        {t('car.status.' + car.status.toLowerCase())}
                    </div>
                </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="mobile-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => handleTabChange('overview')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" />
                        <path d="M9 11V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7" />
                    </svg>
                    {t('car.tabs.info') || 'Overview'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => handleTabChange('documents')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                    </svg>
                    {t('car.tabs.maintenance') || 'Documents'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => handleTabChange('attachments')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    {t('car.tabs.attachments') || 'Attachments'}
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        <div className="details-grid">
                            <div className="detail-card">
                                <h3>{t('car.details.basic') || 'Basic Information'}</h3>
                                <div className="detail-rows">
                                    <div className="detail-row">
                                        <span className="label">{t('car.licensePlate') || 'License Plate'}</span>
                                        <span className="value">{car.licensePlate || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">{t('car.currentKm') || 'Current KM'}</span>
                                        <span className="value">{car.currentKM?.toLocaleString() || 'N/A'} km</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">{t('car.color') || 'Color'}</span>
                                        <span className="value color-value">
                                            <div
                                                className="color-dot"
                                                style={{ backgroundColor: car.color || '#ccc' }}
                                            ></div>
                                            {car.color || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">{t('car.fields.engineType') || 'Engine'}</span>
                                        <span className="value">{car.engine || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">{t('car.fields.gearType') || 'Transmission'}</span>
                                        <span className="value">{car.gear || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-card">
                                <h3>{t('car.details.pricing') || 'Pricing & Status'}</h3>
                                <div className="detail-rows">
                                    <div className="detail-row">
                                        <span className="label">{t('car.dailyRate') || 'Daily Rate'}</span>
                                        <span className="value price">{car.dailyRate || 'N/A'} {t('common.currency')}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">{t('car.fields.status') || 'Status'}</span>
                                        <span className="value">{car.status || 'N/A'}</span>
                                    </div>
                                    {car.deviceSerialNumber && (
                                        <div className="detail-row">
                                            <span className="label">{t('carDetails.tracking') || 'GPS Tracking'}</span>
                                            <span className={`value tracking ${car.isTrackingActive ? 'active' : 'inactive'}`}>
                                                {car.isTrackingActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="documents-section">
                        <div className="documents-grid">
                            {/* Insurance Card */}
                            <div className="document-card">
                                <div className="document-header">
                                    <h3>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        {t('car.add.insurance') || 'Insurance'}
                                    </h3>
                                    <button
                                        className="edit-doc-button"
                                        onClick={() => setShowInsuranceModal(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                        {t('common.edit') || 'Edit'}
                                    </button>
                                </div>
                                <div className="document-content">
                                    <div className="document-field">
                                        <span className="label">{t('car.add.insuranceName') || 'Insurance Company'}</span>
                                        <span className="value">{car.assuranceName || 'Not specified'}</span>
                                    </div>
                                    <div className="document-field">
                                        <span className="label">{t('car.add.insuranceStartDate') || 'Start Date'}</span>
                                        <span className="value">{formatDate(car.assuranceStartDate)}</span>
                                    </div>
                                    <div className="document-field">
                                        <span className="label">{t('car.add.insuranceEndDate') || 'End Date'}</span>
                                        <span className={`value ${isExpired(car.assuranceEndDate) ? 'expired' : ''}`}>
                                            {formatDate(car.assuranceEndDate)}
                                            {car.assuranceEndDate && (
                                                <span className="expiry-info">
                                                    {isExpired(car.assuranceEndDate) ?
                                                        ' (Expired)' :
                                                        ` (${getDaysUntilExpiration(car.assuranceEndDate)} days left)`
                                                    }
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {isExpired(car.assuranceEndDate) && (
                                    <div className="document-warning">
                                        ⚠️ Insurance has expired
                                    </div>
                                )}
                            </div>

                            {/* Technical Visit Card */}
                            <div className="document-card">
                                <div className="document-header">
                                    <h3>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                        </svg>
                                        {t('car.add.technicalVisit') || 'Technical Visit'}
                                    </h3>
                                    <button
                                        className="edit-doc-button"
                                        onClick={() => setShowTechnicalVisitModal(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                        {t('common.edit') || 'Edit'}
                                    </button>
                                </div>
                                <div className="document-content">
                                    <div className="document-field">
                                        <span className="label">{t('car.add.technicalVisitStartDate') || 'Start Date'}</span>
                                        <span className="value">{formatDate(car.technicalVisitStartDate)}</span>
                                    </div>
                                    <div className="document-field">
                                        <span className="label">{t('car.add.technicalVisitEndDate') || 'End Date'}</span>
                                        <span className={`value ${isExpired(car.technicalVisitEndDate) ? 'expired' : ''}`}>
                                            {formatDate(car.technicalVisitEndDate)}
                                            {car.technicalVisitEndDate && (
                                                <span className="expiry-info">
                                                    {isExpired(car.technicalVisitEndDate) ?
                                                        ' (Expired)' :
                                                        ` (${getDaysUntilExpiration(car.technicalVisitEndDate)} days left)`
                                                    }
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {isExpired(car.technicalVisitEndDate) && (
                                    <div className="document-warning">
                                        ⚠️ Technical visit has expired
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attachments' && (
                    <div className="attachments-section">
                        <div className="attachments-header">
                            <h3>{t('car.attachments.title') || 'Attachments'}</h3>
                            <button
                                className="add-button"
                                onClick={() => setShowAttachmentModal(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                {t('attachment.add') || 'Add Attachment'}
                            </button>
                        </div>

                        {attachments && attachments.length > 0 ? (
                            <div className="attachments-grid">
                                {attachments.map((attachment) => (
                                    <div key={attachment.id} className="attachment-item">
                                        <div className="attachment-icon">📎</div>
                                        <div className="attachment-info">
                                            <h4>{attachment.fileName}</h4>
                                            <p>{new Date(attachment.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                        <a
                                            href={`${apiUrl}${attachment.filePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="attachment-download"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7,10 12,15 17,10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📎</div>
                                <h4>{t('car.attachments.noFiles') || 'No attachments'}</h4>
                                <p>{t('car.attachments.addFirstFile') || 'Upload documents related to this car'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Insurance Modal */}
            {showInsuranceModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{t('car.insurance.update') || 'Update Insurance Information'}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowInsuranceModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleInsuranceUpdate} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="assuranceName">{t('car.insurance.company') || 'Insurance Company'}</label>
                                <input
                                    type="text"
                                    id="assuranceName"
                                    value={insuranceForm.assuranceName}
                                    onChange={(e) => setInsuranceForm(prev => ({
                                        ...prev,
                                        assuranceName: e.target.value
                                    }))}
                                    placeholder="Enter insurance company name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="assuranceStartDate">{t('car.insurance.startDate') || 'Start Date'}</label>
                                <input
                                    type="date"
                                    id="assuranceStartDate"
                                    value={insuranceForm.assuranceStartDate}
                                    onChange={(e) => setInsuranceForm(prev => ({
                                        ...prev,
                                        assuranceStartDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="assuranceEndDate">{t('car.insurance.endDate') || 'End Date'}</label>
                                <input
                                    type="date"
                                    id="assuranceEndDate"
                                    value={insuranceForm.assuranceEndDate}
                                    onChange={(e) => setInsuranceForm(prev => ({
                                        ...prev,
                                        assuranceEndDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => setShowInsuranceModal(false)}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="button-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ?
                                        (t('common.updating') || 'Updating...') :
                                        (t('common.update') || 'Update')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Technical Visit Modal */}
            {showTechnicalVisitModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{t('car.technicalVisit.update') || 'Update Technical Visit Information'}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowTechnicalVisitModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleTechnicalVisitUpdate} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="technicalVisitStartDate">{t('car.technicalVisit.startDate') || 'Start Date'}</label>
                                <input
                                    type="date"
                                    id="technicalVisitStartDate"
                                    value={technicalVisitForm.technicalVisitStartDate}
                                    onChange={(e) => setTechnicalVisitForm(prev => ({
                                        ...prev,
                                        technicalVisitStartDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="technicalVisitEndDate">{t('car.technicalVisit.endDate') || 'End Date'}</label>
                                <input
                                    type="date"
                                    id="technicalVisitEndDate"
                                    value={technicalVisitForm.technicalVisitEndDate}
                                    onChange={(e) => setTechnicalVisitForm(prev => ({
                                        ...prev,
                                        technicalVisitEndDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => setShowTechnicalVisitModal(false)}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="button-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ?
                                        (t('common.updating') || 'Updating...') :
                                        (t('common.update') || 'Update')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attachment Upload Modal */}
            {showAttachmentModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{t('attachment.upload') || 'Upload Attachment'}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowAttachmentModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="file-upload-area">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setFileToUpload(e.target.files[0])}
                                    className="file-input"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <div className="file-upload-content">
                                    <div className="upload-icon">📁</div>
                                    <p>{t('attachment.selectFile') || 'Select a file to upload'}</p>
                                    <small>{t('attachment.supportedFormats') || 'Supported: PDF, DOC, DOCX, JPG, PNG'}</small>
                                </div>
                            </div>

                            {fileToUpload && (
                                <div className="selected-file">
                                    <span>📎 {fileToUpload.name}</span>
                                    <button
                                        onClick={() => setFileToUpload(null)}
                                        className="remove-file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {fileError && (
                                <div className="error-message">
                                    {fileError}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => setShowAttachmentModal(false)}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    className="button-primary"
                                    onClick={handleFileUpload}
                                    disabled={!fileToUpload || uploadingFile}
                                >
                                    {uploadingFile ?
                                        (t('attachment.uploading') || 'Uploading...') :
                                        (t('attachment.upload') || 'Upload')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarDetails;