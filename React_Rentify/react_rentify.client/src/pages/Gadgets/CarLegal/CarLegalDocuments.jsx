// src/pages/Gadgets/CarLegal/CarLegalDocuments.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import './CarLegalDocuments.css';

const CarLegalDocuments = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const apiUrl = import.meta.env.VITE_API_URL;

    // State management
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('list'); // 'list' | 'details'

    // Form states
    const [insuranceForm, setInsuranceForm] = useState({
        assuranceName: '',
        assuranceStartDate: '',
        assuranceEndDate: ''
    });

    const [technicalVisitForm, setTechnicalVisitForm] = useState({
        technicalVisitStartDate: '',
        technicalVisitEndDate: ''
    });

    // Success/error messages
    const [successMessage, setSuccessMessage] = useState('');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateType, setUpdateType] = useState(''); // 'insurance' | 'technical'

    // Fetch cars data
    useEffect(() => {
        fetchCars();
    }, [agencyId]);

    const fetchCars = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await carService.getByAgencyId(agencyId);
            setCars(response || []);
        } catch (err) {
            console.error('Error fetching cars:', err);
            setError(t('cars.fetchError') || 'Failed to load cars');
        } finally {
            setIsLoading(false);
        }
    };

    // Get document status helpers
    const getInsuranceStatus = (car) => {
        return carService.getInsuranceStatus(car);
    };

    const getTechnicalVisitStatus = (car) => {
        return carService.getTechnicalVisitStatus(car);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'expired': return 'status-badge status-expired';
            case 'expiring_soon': return 'status-badge status-warning';
            case 'valid': return 'status-badge status-valid';
            case 'not_set': return 'status-badge status-not-set';
            default: return 'status-badge';
        }
    };

    // Handle car selection
    const handleCarSelect = (car) => {
        setSelectedCar(car);
        setView('details');

        // Initialize forms with current data
        setInsuranceForm({
            assuranceName: car.assuranceName || '',
            assuranceStartDate: car.assuranceStartDate ? new Date(car.assuranceStartDate).toISOString().split('T')[0] : '',
            assuranceEndDate: car.assuranceEndDate ? new Date(car.assuranceEndDate).toISOString().split('T')[0] : ''
        });

        setTechnicalVisitForm({
            technicalVisitStartDate: car.technicalVisitStartDate ? new Date(car.technicalVisitStartDate).toISOString().split('T')[0] : '',
            technicalVisitEndDate: car.technicalVisitEndDate ? new Date(car.technicalVisitEndDate).toISOString().split('T')[0] : ''
        });
    };

    // Handle back to list
    const handleBackToList = () => {
        setView('list');
        setSelectedCar(null);
        setSuccessMessage('');
        setError(null);
    };

    // Handle form updates
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);

        try {
            if (updateType === 'insurance') {
                await carService.updateInsurance(selectedCar.id, insuranceForm);
                setSuccessMessage(t('car.insurance.updateSuccess') || 'Insurance information updated successfully');
            } else if (updateType === 'technical') {
                await carService.updateTechnicalVisit(selectedCar.id, technicalVisitForm);
                setSuccessMessage(t('car.technicalVisit.updateSuccess') || 'Technical visit information updated successfully');
            }

            // Refresh car data
            const updatedCar = await carService.getById(selectedCar.id);
            setSelectedCar(updatedCar);

            // Refresh cars list
            await fetchCars();

            setShowUpdateModal(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error('Error updating car legal documents:', err);
            setError(err.message || t('car.updateError') || 'Failed to update information');
        } finally {
            setIsUpdating(false);
        }
    };

    // Open update modal
    const openUpdateModal = (type) => {
        setUpdateType(type);
        setShowUpdateModal(true);
        setError(null);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return t('common.notSet') || 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    // Get alert count for a car
    const getAlertCount = (car) => {
        let count = 0;
        const insuranceStatus = getInsuranceStatus(car);
        const technicalStatus = getTechnicalVisitStatus(car);

        if (insuranceStatus.status === 'expired' || insuranceStatus.status === 'expiring_soon') count++;
        if (technicalStatus.status === 'expired' || technicalStatus.status === 'expiring_soon') count++;

        return count;
    };

    if (isLoading) {
        return (
            <div className={`car-legal-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-legal-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="page-header">
                {view === 'details' && (
                    <button
                        className="back-button"
                        onClick={handleBackToList}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        {t('common.back') || 'Back'}
                    </button>
                )}
                <div className="header-content">
                    <h1>
                        {view === 'list'
                            ? (t('car.legalDocuments.title') || 'Car Legal Documents')
                            : (t('car.legalDocuments.details') || 'Legal Document Details')
                        }
                    </h1>
                    <p className="header-subtitle">
                        {view === 'list'
                            ? (t('car.legalDocuments.subtitle') || 'Manage insurance and technical visit information for your fleet')
                            : `${selectedCar?.fields?.manufacturer} ${selectedCar?.fields?.model} - ${selectedCar?.licensePlate}`
                        }
                    </p>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="alert alert-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="alert alert-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Main Content */}
            {view === 'list' ? (
                /* Cars List View */
                <div className="cars-grid">
                    {cars.length === 0 ? (
                        <div className="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5h2m3 5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
                                <circle cx="7" cy="17" r="2" />
                                <path d="M9 17h6" />
                                <circle cx="17" cy="17" r="2" />
                            </svg>
                            <h3>{t('cars.noCars') || 'No cars found'}</h3>
                            <p>{t('cars.noCarsDescription') || 'No cars are available for your agency.'}</p>
                        </div>
                    ) : (
                        cars.map(car => {
                            const insuranceStatus = getInsuranceStatus(car);
                            const technicalStatus = getTechnicalVisitStatus(car);
                            const alertCount = getAlertCount(car);

                            return (
                                <div
                                    key={car.id}
                                    className="car-card"
                                    onClick={() => handleCarSelect(car)}
                                >
                                    {/* Alert Badge */}
                                    {alertCount > 0 && (
                                        <div className="alert-badge">
                                            {alertCount}
                                        </div>
                                    )}

                                    {/* Car Image */}
                                    <div className="car-image">
                                        {car.images && car.images.length > 0 ? (
                                            <img
                                                src={apiUrl + car.images.find(img => img.isMainImage)?.path || car.images[0]?.path}
                                                alt={`${car.fields?.manufacturer} ${car.fields?.model}`}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="car-image-placeholder" style={{ display: (!car.images || car.images.length === 0) ? 'flex' : 'none' }}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5h2m3 5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
                                                <circle cx="7" cy="17" r="2" />
                                                <path d="M9 17h6" />
                                                <circle cx="17" cy="17" r="2" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Car Info */}
                                    <div className="car-info">
                                        <div className="car-header">
                                            <h3 className="car-title">
                                                {car.fields?.manufacturer} {car.fields?.model}
                                            </h3>
                                            <div className="car-meta">
                                                <span className="license-plate">{car.licensePlate}</span>
                                                <span className="car-year">{car.fields?.year}</span>
                                            </div>
                                        </div>

                                        {/* Legal Status */}
                                        <div className="legal-status">
                                            <div className="status-item">
                                                <span className="status-label">
                                                    {t('car.add.insurance') || 'Insurance'}
                                                </span>
                                                <span className={getStatusBadgeClass(insuranceStatus.status)}>
                                                    {t(`car.status.${insuranceStatus.status}`) || insuranceStatus.message}
                                                </span>
                                            </div>
                                            <div className="status-item">
                                                <span className="status-label">
                                                    {t('car.add.technicalVisit') || 'Technical Visit'}
                                                </span>
                                                <span className={getStatusBadgeClass(technicalStatus.status)}>
                                                    {t(`car.status.${technicalStatus.status}`) || technicalStatus.message}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Arrow */}
                                    <div className="car-action">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Car Details View */
                <div className="car-details">
                    {/* Car Header */}
                    <div className="car-details-header">
                        <div className="car-main-image">
                            {selectedCar.images && selectedCar.images.length > 0 ? (
                                <img
                                    src={apiUrl + selectedCar.images.find(img => img.isMainImage)?.path || selectedCar.images[0]?.path}
                                    alt={`${selectedCar.fields?.manufacturer} ${selectedCar.fields?.model}`}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className="car-main-image-placeholder" style={{ display: (!selectedCar.images || selectedCar.images.length === 0) ? 'flex' : 'none' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5h2m3 5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
                                    <circle cx="7" cy="17" r="2" />
                                    <path d="M9 17h6" />
                                    <circle cx="17" cy="17" r="2" />
                                </svg>
                            </div>
                        </div>
                        <div className="car-details-info">
                            <h2>{selectedCar.fields?.manufacturer} {selectedCar.fields?.model}</h2>
                            <div className="car-details-meta">
                                <span className="detail-item">
                                    <strong>{t('car.licensePlate') || 'License Plate'}:</strong> {selectedCar.licensePlate}
                                </span>
                                <span className="detail-item">
                                    <strong>{t('car.fields.year') || 'Year'}:</strong> {selectedCar.fields?.year}
                                </span>
                                <span className="detail-item">
                                    <strong>{t('car.color') || 'Color'}:</strong> {selectedCar.color}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Legal Documents */}
                    <div className="legal-documents">
                        {/* Insurance Section */}
                        <div className="document-section">
                            <div className="document-card">
                                <div className="document-header">
                                    <div className="document-title">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        </svg>
                                        <h3>{t('car.add.insurance') || 'Insurance'}</h3>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => openUpdateModal('insurance')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                        {t('common.edit') || 'Edit'}
                                    </button>
                                </div>
                                <div className="document-content">
                                    <div className="document-field">
                                        <label>{t('car.add.insuranceName') || 'Insurance Company'}</label>
                                        <span>{selectedCar.assuranceName || (t('common.notSet') || 'Not set')}</span>
                                    </div>
                                    <div className="document-field">
                                        <label>{t('car.add.insuranceStartDate') || 'Start Date'}</label>
                                        <span>{formatDate(selectedCar.assuranceStartDate)}</span>
                                    </div>
                                    <div className="document-field">
                                        <label>{t('car.add.insuranceEndDate') || 'End Date'}</label>
                                        <div className="field-with-status">
                                            <span>{formatDate(selectedCar.assuranceEndDate)}</span>
                                            <span className={getStatusBadgeClass(getInsuranceStatus(selectedCar).status)}>
                                                {t(`car.status.${getInsuranceStatus(selectedCar).status}`) || getInsuranceStatus(selectedCar).message}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Visit Section */}
                        <div className="document-section">
                            <div className="document-card">
                                <div className="document-header">
                                    <div className="document-title">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                        </svg>
                                        <h3>{t('car.add.technicalVisit') || 'Technical Visit'}</h3>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => openUpdateModal('technical')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                        {t('common.edit') || 'Edit'}
                                    </button>
                                </div>
                                <div className="document-content">
                                    <div className="document-field">
                                        <label>{t('car.add.technicalVisitStartDate') || 'Start Date'}</label>
                                        <span>{formatDate(selectedCar.technicalVisitStartDate)}</span>
                                    </div>
                                    <div className="document-field">
                                        <label>{t('car.add.technicalVisitEndDate') || 'End Date'}</label>
                                        <div className="field-with-status">
                                            <span>{formatDate(selectedCar.technicalVisitEndDate)}</span>
                                            <span className={getStatusBadgeClass(getTechnicalVisitStatus(selectedCar).status)}>
                                                {t(`car.status.${getTechnicalVisitStatus(selectedCar).status}`) || getTechnicalVisitStatus(selectedCar).message}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {showUpdateModal && (
                <div className="modal-backdrop" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {updateType === 'insurance'
                                    ? (t('car.insurance.update') || 'Update Insurance Information')
                                    : (t('car.technicalVisit.update') || 'Update Technical Visit Information')
                                }
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowUpdateModal(false)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="modal-form">
                            {updateType === 'insurance' ? (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="assuranceName">
                                            {t('car.add.insuranceName') || 'Insurance Company'}
                                        </label>
                                        <input
                                            type="text"
                                            id="assuranceName"
                                            value={insuranceForm.assuranceName}
                                            onChange={(e) => setInsuranceForm(prev => ({ ...prev, assuranceName: e.target.value }))}
                                            placeholder={t('car.insurance.namePlaceholder') || 'Enter insurance company name'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="assuranceStartDate">
                                            {t('car.add.insuranceStartDate') || 'Start Date'}
                                        </label>
                                        <input
                                            type="date"
                                            id="assuranceStartDate"
                                            value={insuranceForm.assuranceStartDate}
                                            onChange={(e) => setInsuranceForm(prev => ({ ...prev, assuranceStartDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="assuranceEndDate">
                                            {t('car.add.insuranceEndDate') || 'End Date'}
                                        </label>
                                        <input
                                            type="date"
                                            id="assuranceEndDate"
                                            value={insuranceForm.assuranceEndDate}
                                            onChange={(e) => setInsuranceForm(prev => ({ ...prev, assuranceEndDate: e.target.value }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="technicalVisitStartDate">
                                            {t('car.add.technicalVisitStartDate') || 'Start Date'}
                                        </label>
                                        <input
                                            type="date"
                                            id="technicalVisitStartDate"
                                            value={technicalVisitForm.technicalVisitStartDate}
                                            onChange={(e) => setTechnicalVisitForm(prev => ({ ...prev, technicalVisitStartDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="technicalVisitEndDate">
                                            {t('car.add.technicalVisitEndDate') || 'End Date'}
                                        </label>
                                        <input
                                            type="date"
                                            id="technicalVisitEndDate"
                                            value={technicalVisitForm.technicalVisitEndDate}
                                            onChange={(e) => setTechnicalVisitForm(prev => ({ ...prev, technicalVisitEndDate: e.target.value }))}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowUpdateModal(false)}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="loading-spinner small"></div>
                                            {t('common.updating') || 'Updating...'}
                                        </>
                                    ) : (
                                        t('common.update') || 'Update'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarLegalDocuments;