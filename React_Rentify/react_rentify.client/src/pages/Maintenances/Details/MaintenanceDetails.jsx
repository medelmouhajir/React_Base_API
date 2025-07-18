// src/pages/Maintenances/Details/MaintenanceDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import './MaintenanceDetails.css';

const MaintenanceDetails = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    // State management
    const [maintenance, setMaintenance] = useState(null);
    const [car, setCar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Fetch maintenance record and associated car data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get maintenance record details
                const record = await maintenanceService.getById(id);
                setMaintenance(record);

                // Get car details if we have a car ID
                if (record?.carId) {
                    const carData = await carService.getById(record.carId);
                    setCar(carData);
                }
            } catch (err) {
                console.error('❌ Error fetching maintenance details:', err);
                setError(t('maintenance.details.error') || 'Error loading maintenance details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, t]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Format currency for display
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Handle maintenance deletion
    const handleDelete = async () => {
        try {
            await maintenanceService.delete(id);
            navigate('/maintenances');
        } catch (err) {
            console.error('❌ Error deleting maintenance record:', err);
            setError(t('maintenance.details.deleteError') || 'Error deleting maintenance record.');
        } finally {
            setShowDeleteModal(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`maintenanceDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="maintenanceDetails-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('maintenance.details.loading') || 'Loading maintenance details...'}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`maintenanceDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="maintenanceDetails-error">
                    <p>{error}</p>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        {t('common.back') || 'Back'}
                    </button>
                </div>
            </div>
        );
    }

    // Not found state
    if (!maintenance) {
        return (
            <div className={`maintenanceDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="maintenanceDetails-notFound">
                    <p>{t('maintenance.details.notFound') || 'Maintenance record not found.'}</p>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/maintenances')}
                    >
                        {t('maintenance.list.title') || 'View All Maintenance Records'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`maintenanceDetails-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="maintenanceDetails-header">
                <h1 className="maintenanceDetails-title">
                    {t('maintenance.details.title') || 'Maintenance Details'}
                </h1>
                <div className="maintenanceDetails-actions">
                    <Link
                        to={`/maintenances/${id}/edit`}
                        className="btn-primary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                        </svg>
                        {t('common.edit') || 'Edit'}
                    </Link>
                    <button
                        className="btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        {t('common.delete') || 'Delete'}
                    </button>
                </div>
            </div>

            {/* Car details section */}
            {car && (
                <div className="maintenanceDetails-section car-section">
                    <h2 className="section-title">
                        {t('car.car') || 'Car'}
                        <Link to={`/cars/${car.id}`} className="car-link">
                            {t('common.view') || 'View'}
                        </Link>
                    </h2>
                    <div className="car-details">
                        <div className="car-info">
                            <span className="car-name">
                                {car.fields.manufacturer} {car.fields.model} ({car.fields.year})
                            </span>
                            <span className="car-license">{car.licensePlate}</span>
                        </div>
                        {car.color && (
                            <div className="car-color">
                                <span
                                    className="color-dot"
                                    style={{ backgroundColor: car.color }}
                                    title={car.color}
                                ></span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main maintenance details */}
            <div className="maintenanceDetails-section">
                <h2 className="section-title">{t('maintenance.details.info') || 'Maintenance Information'}</h2>

                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">{t('maintenance.scheduledDate') || 'Scheduled Date'}</span>
                        <span className="detail-value">{formatDate(maintenance.scheduledDate)}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">{t('maintenance.cost') || 'Cost'}</span>
                        <span className="detail-value cost">{formatCurrency(maintenance.cost)}</span>
                    </div>

                    <div className="detail-item status-item">
                        <span className="detail-label">{t('maintenance.status.title') || 'Status'}</span>
                        <span className={`status-badge ${maintenance.isCompleted ? 'completed' : 'pending'}`}>
                            {maintenance.isCompleted
                                ? (t('maintenance.status.completed') || 'Completed')
                                : (t('maintenance.status.pending') || 'Pending')}
                        </span>
                    </div>

                    {maintenance.isCompleted && maintenance.completedDate && (
                        <div className="detail-item">
                            <span className="detail-label">{t('maintenance.completedDate') || 'Completed Date'}</span>
                            <span className="detail-value">{formatDate(maintenance.completedDate)}</span>
                        </div>
                    )}
                </div>

                <div className="description-container">
                    <span className="detail-label">{t('maintenance.description') || 'Description'}</span>
                    <p className="maintenance-description">{maintenance.description || '-'}</p>
                </div>

                {maintenance.remarks && (
                    <div className="remarks-container">
                        <span className="detail-label">{t('maintenance.remarks') || 'Remarks'}</span>
                        <p className="maintenance-remarks">{maintenance.remarks}</p>
                    </div>
                )}
            </div>

            {/* Back button */}
            <div className="maintenanceDetails-footer">
                <button
                    className="btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    {t('common.back') || 'Back'}
                </button>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">{t('maintenance.delete.title') || 'Delete Maintenance Record'}</h3>
                        <p className="modal-message">
                            {t('maintenance.delete.confirm') || 'Are you sure you want to delete this maintenance record? This action cannot be undone.'}
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDelete}
                            >
                                {t('common.delete') || 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceDetails;