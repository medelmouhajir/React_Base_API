// src/pages/Cars/Details/CarDetails.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import maintenanceService from '../../../services/maintenanceService';
import carAttachmentService from '../../../services/carAttachmentService';
import reservationService from '../../../services/reservationService';
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
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [currentReservation, setCurrentReservation] = useState(null);
    const [upcomingReservations, setUpcomingReservations] = useState([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileError, setFileError] = useState(null);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);
    const [isSwiping, setIsSwiping] = useState(false);

    // For attachment upload
    const [fileToUpload, setFileToUpload] = useState(null);


    const apiUrl = import.meta.env.VITE_API_URL;

    // Fetch car and related data
    useEffect(() => {
        const fetchCarData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch car details, maintenance records, and reservations in parallel
                const [carData, maintenanceData, reservationsData] = await Promise.all([
                    carService.getById(id),
                    maintenanceService.getByCarId(id),
                    reservationService.getByCarId(id)
                ]);

                setCar(carData);

                console.log(carData);

                const MainPicture = carData.images && carData.images.length > 0
                    ? (carData.images.find(img => img.isMainImage === true) || null)
                    : null;


                setMaintenanceRecords(maintenanceData || []);

                // Process reservations
                if (reservationsData) {
                    const now = new Date();
                    const current = reservationsData.find(r =>
                        new Date(r.startDate) <= now && new Date(r.endDate) >= now
                    );
                    const upcoming = reservationsData.filter(r =>
                        new Date(r.startDate) > now
                    ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                    setCurrentReservation(current);
                    setUpcomingReservations(upcoming);
                }

                // Fetch attachments
                try {
                    const attachmentData = await carAttachmentService.getByCarId(id);
                    setAttachments(attachmentData || []);
                } catch (attachmentError) {
                    console.warn('Failed to fetch attachments:', attachmentError);
                    setAttachments([]);
                }

            } catch (err) {
                console.error('Error fetching car data:', err);
                setError(t('car.details.fetchError') || 'Failed to load car details');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCarData();
        }
    }, [id, t]);

    // Navigation handlers
    const handleBack = () => {
        navigate('/cars');
    };

    const handleEdit = () => {
        navigate(`/cars/edit/${id}`);
    };

    // Touch handlers for mobile navigation
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setTouchStartX(touch.clientX);
        setTouchStartY(touch.clientY);
        setIsSwiping(false);
    };


    const mainPicture = useMemo(() => {
        const imgs = car?.images || [];
        if (imgs.length === 0) return null;

        // be tolerant to key casing/naming
        const byFlag =
            imgs.find(i => i.isMainImage === true) ||
            imgs.find(i => i.isMain === true) ||
            imgs.find(i => i.IsMain === true);

        return byFlag || null; // or fallback to first: byFlag || imgs[0]
    }, [car]);

    const handleTouchMove = (e) => {
        if (!touchStartX || !touchStartY) return;

        const touch = e.touches[0];
        const diffX = touchStartX - touch.clientX;
        const diffY = touchStartY - touch.clientY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            setIsSwiping(true);
        }
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchStartY || !isSwiping) return;

        const diffX = touchStartX - (touchStartX || 0);

        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - go to next tab
                const tabs = ['info', 'maintenance', 'attachments', 'reservations'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                }
            } else {
                // Swipe right - go to previous tab
                const tabs = ['info', 'maintenance', 'attachments', 'reservations'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                }
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
        setIsSwiping(false);
    };

    // File upload handlers
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileError(null);

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setFileError(t('attachment.fileTooLarge') || 'File size must be less than 10MB');
            return;
        }

        setFileToUpload(file);
        setShowAttachmentModal(true);
    };

    const handleUploadConfirm = async () => {
        if (!fileToUpload) return;

        setUploadingFile(true);
        setFileError(null);

        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('carId', id);

            await carAttachmentService.uploadFile(id , formData);

            // Refresh attachments
            const attachmentData = await carAttachmentService.getByCarId(id);
            setAttachments(attachmentData || []);

            setShowAttachmentModal(false);
            setFileToUpload(null);
        } catch (err) {
            console.error('Upload error:', err);
            setFileError(t('attachment.uploadFailed') || 'Upload failed. Please try again.');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm(t('attachment.confirmDelete') || 'Are you sure you want to delete this attachment?')) {
            return;
        }

        try {
            await carAttachmentService.delete(attachmentId);

            // Refresh attachments
            const attachmentData = await carAttachmentService.getByCarId(id);
            setAttachments(attachmentData || []);
        } catch (err) {
            console.error('Delete error:', err);
            alert(t('attachment.deleteFailed') || 'Failed to delete attachment. Please try again.');
        }
    };

    // Render functions
    const renderCarInfo = () => (
        <div className="car-info-section">
            <div className="car-hero">
                <div className="car-placeholder">
                    {mainPicture === null ? (
                        <div className="car-placeholder-content">
                            <div className="car-placeholder-icon">🚗</div>
                            <p>{t('car.details.noImage') || 'No image available'}</p>
                        </div>
                    ) : (
                        // pick the right field name for the URL:
                        <img src={apiUrl + mainPicture.path} alt="Car" />
                    )}
                </div>
                <div className="car-hero-content">
                    <h2 className="car-title">
                        {car?.fields?.manufacturer} {car?.fields?.model}
                    </h2>
                    <p className="car-year">{car?.fields?.year}</p>
                    <div className="car-status-badge-container">
                        <span className={`status-badge ${car?.status?.toLowerCase() || 'unknown'}`}>
                            {t(`car.status.${car?.status?.toLowerCase() || 'unknown'}`) || car?.status || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="car-details-grid">
                <div className="detail-card">
                    <h3>{t('car.details.basic') || 'Basic Information'}</h3>
                    <div className="detail-row">
                        <span className="label">{t('car.licensePlate') || 'License Plate'}</span>
                        <span className="value">{car?.licensePlate || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">{t('car.currentKm') || 'Current Km'}</span>
                        <span className="value">{car?.currentKM || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">{t('car.color') || 'Color'}</span>
                        <span className="value color-value">
                            <div
                                className="color-dot"
                                style={{ backgroundColor: car?.color || '#ccc' }}
                            ></div>
                            {car?.color || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="detail-card">
                    <h3>{t('car.details.pricing') || 'Pricing'}</h3>
                    <div className="detail-row">
                        <span className="label">{t('car.dailyRate') || 'Daily Rate'}</span>
                        <span className="value price">
                            {car?.dailyRate?.toFixed(2) || 'N/A'}
                        </span>
                    </div>
                    {car?.hourlyRate && (
                        <div className="detail-row">
                            <span className="label">{t('car.hourlyRate') || 'Hourly Rate'}</span>
                            <span className="value price">
                                {car.hourlyRate.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="detail-card">
                    <h3>{t('car.details.tracking') || 'Tracking'}</h3>
                    <div className="detail-row">
                        <span className="label">{t('car.deviceSerial') || 'Device Serial'}</span>
                        <span className="value">
                            {car?.deviceSerialNumber || t('car.noDevice') || 'No device'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">{t('car.detail.tracking') || 'Tracking Status'}</span>
                        <span className={`value tracking ${car?.isTrackingActive ? 'active' : 'inactive'}`}>
                            {car?.isTrackingActive
                                ? t('car.trackingActive') || 'Active'
                                : t('car.trackingInactive') || 'Inactive'
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <Link
                    to={`/cars/edit/${id}`}
                    className="btn-primary"
                >
                    {t('common.edit') || 'Edit Car'}
                </Link>
                <Link
                    to={`/reservations/add?carId=${id}`}
                    className="btn-secondary"
                >
                    {t('reservation.list.addNew') || 'Create Reservation'}
                </Link>
            </div>
        </div>
    );

    const renderMaintenanceTab = () => (
        <div className="maintenance-section">
            <div className="tab-header">
                <h3>{t('maintenance.list.title') || 'Maintenance Records'}</h3>
                <Link
                    to={`/maintenances/add?carId=${id}`}
                    className="add-button"
                >
                    {t('maintenance.add.title') || 'Add Maintenance'}
                </Link>
            </div>

            {maintenanceRecords.length === 0 ? (
                <div className="empty-state">
                    <p>{t('maintenance.list.noRecords') || 'No maintenance records found'}</p>
                </div>
            ) : (
                <div className="maintenance-list">
                    {maintenanceRecords.map((record) => (
                        <div key={record.id} className="maintenance-card">
                            <div className="maintenance-header">
                                <h4>{record.type || t('maintenance.general') || 'General'}</h4>
                                <span className="maintenance-date">
                                    {new Date(record.date).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="maintenance-description">
                                {record.description || t('maintenance.noDescription') || 'No description'}
                            </p>
                            {record.cost && (
                                <div className="maintenance-cost">
                                    <span>{t('maintenance.cost') || 'Cost'}: ${record.cost}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAttachmentsTab = () => (
        <div className="attachments-section">
            <div className="tab-header">
                <h3>{t('attachment.title') || 'Attachments'}</h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="add-button"
                    disabled={uploadingFile}
                >
                    {uploadingFile ? t('attachment.uploading') || 'Uploading...' : t('attachment.add') || 'Add Attachment'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
            </div>

            {attachments.length === 0 ? (
                <div className="empty-state">
                    <p>{t('attachment.noFiles') || 'No attachments found'}</p>
                </div>
            ) : (
                <div className="attachments-list">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-card">
                            <div className="attachment-info">
                                <h4 className="attachment-name">{attachment.fileName}</h4>
                                <p className="attachment-date">
                                    {t('attachment.uploadedOn') || 'Uploaded on'} {' '}
                                    {new Date(attachment.uploadedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="attachment-actions">
                                <a
                                    href={attachment.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="download-link"
                                    title={t('attachment.download') || 'Download'}
                                >
                                    ⬇
                                </a>
                                <button
                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                    className="delete-button"
                                    title={t('attachment.delete') || 'Delete'}
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReservationsTab = () => (
        <div className="reservations-section">
            <h3>{t('reservation.current') || 'Current Reservation'}</h3>
            {currentReservation ? (
                <div className="reservation-card current">
                    <div className="reservation-header">
                        <span className="reservation-dates">
                            {new Date(currentReservation.startDate).toLocaleDateString()} - {' '}
                            {new Date(currentReservation.endDate).toLocaleDateString()}
                        </span>
                        <span className="reservation-status current">
                            {t('reservation.status.current') || 'Current'}
                        </span>
                    </div>
                    {currentReservation.reservation_Customers?.map((customer, index) => (
                        <p key={index} className="reservation-customer">
                            {t('reservation.customer') || 'Customer'}: {customer.customer.name || 'N/A'}
                        </p>
                    ))}
                    <p className="reservation-total">
                        {t('reservation.fields.price') || 'Total'}: {currentReservation.totalAmount || 'N/A'}
                    </p>
                </div>
            ) : (
                <div className="empty-state">
                    <p>{t('reservation.noCurrent') || 'No current reservation'}</p>
                </div>
            )}

            <h3>{t('reservation.upcoming') || 'Upcoming Reservations'}</h3>
            {upcomingReservations.length === 0 ? (
                <div className="empty-state">
                    <p>{t('reservation.noUpcoming') || 'No upcoming reservations'}</p>
                </div>
            ) : (
                <div className="reservations-list">
                    {upcomingReservations.map((reservation) => (
                        <div key={reservation.id} className="reservation-card upcoming">
                            <div className="reservation-header">
                                <span className="reservation-dates">
                                    {new Date(reservation.startDate).toLocaleDateString()} - {' '}
                                    {new Date(reservation.endDate).toLocaleDateString()}
                                </span>
                                <span className="reservation-status upcoming">
                                    {t('reservation.status.upcoming') || 'Upcoming'}
                                </span>
                            </div>
                            {reservation.reservation_Customers?.map((customer, index) => (
                                <p key={index} className="reservation-customer">
                                    {t('reservation.customer') || 'Customer'}: {customer.customer.name || 'N/A'}
                                </p>
                            ))}
                            <p className="reservation-total">
                                {t('reservation.fields.price') || 'Total'}: {reservation.agreedPrice || 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Loading state
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

    // Error state
    if (error) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <p>{error}</p>
                    <button className="btn-primary" onClick={handleBack}>
                        {t('common.backToList') || 'Back to List'}
                    </button>
                </div>
            </div>
        );
    }

    // Car not found
    if (!car) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <p>{t('car.details.notFound') || 'Car not found.'}</p>
                    <button className="btn-primary" onClick={handleBack}>
                        {t('common.backToList') || 'Back to List'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`car-details-container ${isDarkMode ? 'dark' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={handleBack}>
                    ← {t('common.back') || 'Back'}
                </button>
                <h1 className="page-title">
                    {car.fields?.manufacturer} {car.fields?.model} ({car.fields?.year})
                </h1>
                <button className="edit-button" onClick={handleEdit}>
                    {t('common.edit') || 'Edit'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <div className="tab-nav-container">
                    {[
                        { key: 'info', label: t('car.details.info') || 'Info' },
                        { key: 'maintenance', label: t('car.details.maintenance') || 'Maintenance' },
                        { key: 'attachments', label: t('car.details.attachments') || 'Attachments' },
                        { key: 'reservations', label: t('car.details.reservations') || 'Reservations' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'info' && renderCarInfo()}
                {activeTab === 'maintenance' && renderMaintenanceTab()}
                {activeTab === 'attachments' && renderAttachmentsTab()}
                {activeTab === 'reservations' && renderReservationsTab()}
            </div>

            {/* Upload Modal */}
            {showAttachmentModal && (
                <div className="modal-overlay" onClick={() => setShowAttachmentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('attachment.upload') || 'Upload Attachment'}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowAttachmentModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {fileToUpload && (
                                <div className="selected-file">
                                    <span>📄</span>
                                    <div>
                                        <p className="file-name">{fileToUpload.name}</p>
                                        <p className="file-size">
                                            {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            )}
                            {fileError && (
                                <div className="file-error">
                                    <p>{fileError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowAttachmentModal(false)}
                                disabled={uploadingFile}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleUploadConfirm}
                                disabled={uploadingFile || !fileToUpload}
                            >
                                {uploadingFile ? t('attachment.uploading') || 'Uploading...' : t('attachment.upload') || 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarDetails;