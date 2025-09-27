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
                // Fetch car details
                const carData = await carService.getById(id);
                setCar(carData);

                // Set main picture from images array
                const mainPicture = carData.images && carData.images.length > 0
                    ? carData.images.find(img => img.isMainImage) || carData.images[0]
                    : null;

                // Set attachments
                setAttachments(carData.attachments || []);

                console.log('Car data loaded:', carData);

            } catch (err) {
                console.error('Error fetching car data:', err);
                setError(t('car.details.loadError') || 'Failed to load car details');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCarData();
        }
    }, [id, t]);

    // Handle tab switching with swipe support
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Touch handlers for mobile swipe navigation
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        if (!touchStartX || !touchStartY) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            setIsSwiping(true);
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartX || !isSwiping) return;

        const endX = e.changedTouches[0].clientX;
        const diffX = touchStartX - endX;

        const tabs = ['info', 'attachments'];
        const currentIndex = tabs.indexOf(activeTab);

        if (diffX > 50 && currentIndex < tabs.length - 1) {
            // Swipe left - next tab
            setActiveTab(tabs[currentIndex + 1]);
        } else if (diffX < -50 && currentIndex > 0) {
            // Swipe right - previous tab
            setActiveTab(tabs[currentIndex - 1]);
        }

        setTouchStartX(null);
        setTouchStartY(null);
        setIsSwiping(false);
    };

    // File upload handlers
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileToUpload(file);
            setShowAttachmentModal(true);
        }
    };

    const handleFileUpload = async () => {
        if (!fileToUpload) return;

        setUploadingFile(true);
        setFileError(null);

        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('fileName', fileToUpload.name);

            await carAttachmentService.uploadAttachment(id, formData);

            // Refresh attachments
            const updatedCar = await carService.getById(id);
            setAttachments(updatedCar.attachments || []);

            setShowAttachmentModal(false);
            setFileToUpload(null);
        } catch (err) {
            console.error('Error uploading file:', err);
            setFileError(t('attachment.uploadError') || 'Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    // Navigation functions
    const handleCreateReservation = () => {
        navigate(`/reservations/add?carId=${id}`);
    };

    const handleDummyAction1 = () => {
        console.log('Dummy action 1');
        // Placeholder for future functionality
    };

    const handleDummyAction2 = () => {
        console.log('Dummy action 2');
        // Placeholder for future functionality
    };

    // Render functions
    const renderCarInfo = () => {
        const mainPicture = car?.images?.find(img => img.isMainImage) || car?.images?.[0];

        return (
            <div className="car-info-section">
                <div className="car-hero">
                    <div className="car-image-container">
                        {!mainPicture ? (
                            <div className="car-placeholder">
                                <div className="car-placeholder-content">
                                    <div className="car-placeholder-icon">🚗</div>
                                    <p>{t('car.details.noImage') || 'No image available'}</p>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={apiUrl + mainPicture.path}
                                alt={`${car?.fields?.manufacturer} ${car?.fields?.model}`}
                                className="car-image"
                            />
                        )}
                    </div>
                    <div className="car-hero-content">
                        <h1 className="car-title">
                            {car?.fields?.manufacturer} {car?.fields?.model}
                        </h1>
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
                        <div className="detail-row">
                            <span className="label">{t('car.fields.engineType') || 'Engine'}</span>
                            <span className="value">{car?.engine || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('car.fields.gearType') || 'Transmission'}</span>
                            <span className="value">{car?.gear || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3>{t('car.details.pricing') || 'Pricing & Availability'}</h3>
                        <div className="detail-row">
                            <span className="label">{t('car.dailyRate') || 'Daily Rate'}</span>
                            <span className="value price">${car?.dailyRate || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('car.hourlyRate') || 'Hourly Rate'}</span>
                            <span className="value price">${car?.hourlyRate || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('car.availability') || 'Availability'}</span>
                            <span className={`availability-badge ${car?.isAvailable ? 'available' : 'unavailable'}`}>
                                {car?.isAvailable
                                    ? (t('car.available') || 'Available')
                                    : (t('car.unavailable') || 'Unavailable')
                                }
                            </span>
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3>{t('car.details.tracking') || 'Tracking & Device'}</h3>
                        <div className="detail-row">
                            <span className="label">{t('car.deviceSerial') || 'Device Serial'}</span>
                            <span className="value">{car?.deviceSerialNumber || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('car.trackingStatus') || 'Tracking Status'}</span>
                            <span className={`value tracking ${car?.isTrackingActive ? 'active' : 'inactive'}`}>
                                {car?.isTrackingActive
                                    ? (t('car.tracking.active') || 'Active')
                                    : (t('car.tracking.inactive') || 'Inactive')
                                }
                            </span>
                        </div>
                        {car?.lastKmUpdate && (
                            <div className="detail-row">
                                <span className="label">{t('car.lastKmUpdate') || 'Last KM Update'}</span>
                                <span className="value">
                                    {new Date(car.lastKmUpdate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAttachments = () => (
        <div className="attachments-section">
            <div className="attachments-header">
                <h3>{t('car.tabs.attachments') || 'Attachments'}</h3>
                <button
                    className="add-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                >
                    {t('attachment.add') || 'Add Attachment'}
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
                <div className="no-attachments">
                    <p>{t('car.noAttachments') || 'No attachments available'}</p>
                </div>
            ) : (
                <div className="attachments-list">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-card">
                            <div className="attachment-info">
                                <h4 className="attachment-name">{attachment.fileName}</h4>
                                <p className="attachment-date">
                                    {t('attachment.uploadedOn') || 'Uploaded on'}: {' '}
                                    {new Date(attachment.uploadedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="attachment-actions">
                                <a
                                    href={`${apiUrl}${attachment.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="attachment-download"
                                >
                                    {t('attachment.download') || 'Download'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <h2>{t('common.error') || 'Error'}</h2>
                    <p>{error}</p>
                    <button
                        className="retry-button"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="not-found-state">
                    <h2>{t('car.notFound') || 'Car not found'}</h2>
                    <Link to="/cars" className="back-link">
                        {t('common.goBack') || 'Go back to cars list'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-details-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Page Header */}
            <div className="page-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/cars')}
                    aria-label={t('common.goBack') || 'Go back'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    {t('common.back') || 'Back'}
                </button>

                <Link
                    to={`/cars/edit/${id}`}
                    className="edit-button"
                    aria-label={t('car.edit') || 'Edit car'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    {t('common.edit') || 'Edit'}
                </Link>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="mobile-tabs">
                <button
                    className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => handleTabChange('info')}
                >
                    {t('car.details.info') || 'Information'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => handleTabChange('attachments')}
                >
                    {t('car.details.attachments') || 'Attachments'}
                </button>
            </div>

            {/* Content with touch support */}
            <div
                className="tab-content"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {activeTab === 'info' && renderCarInfo()}
                {activeTab === 'attachments' && renderAttachments()}
            </div>

            {/* Action Buttons Panel */}
            <div className="actions-panel">
                <button
                    className="action-button primary"
                    onClick={handleCreateReservation}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    {t('car.actions.addReservation') || 'Create Reservation'}
                </button>

                <button
                    className="action-button secondary"
                    onClick={handleDummyAction1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20m9-9H3" />
                    </svg>
                    {t('action.pl1') || 'Action 1'}
                </button>
            </div>

            {/* Upload Modal */}
            {showAttachmentModal && (
                <div className="upload-modal-overlay" onClick={() => setShowAttachmentModal(false)}>
                    <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="upload-modal-header">
                            <h3>{t('attachment.upload') || 'Upload Attachment'}</h3>
                            <button
                                className="upload-modal-close"
                                onClick={() => setShowAttachmentModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="upload-modal-content">
                            {fileToUpload && (
                                <div className="upload-file-info">
                                    <p><strong>{t('attachment.selectedFile') || 'Selected file'}:</strong> {fileToUpload.name}</p>
                                    <p><strong>{t('attachment.fileSize') || 'Size'}:</strong> {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            )}
                            {fileError && (
                                <div className="upload-error">
                                    {fileError}
                                </div>
                            )}
                            <div className="upload-modal-actions">
                                <button
                                    className="upload-cancel-button"
                                    onClick={() => setShowAttachmentModal(false)}
                                    disabled={uploadingFile}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    className="upload-confirm-button"
                                    onClick={handleFileUpload}
                                    disabled={uploadingFile || !fileToUpload}
                                >
                                    {uploadingFile
                                        ? (t('attachment.uploading') || 'Uploading...')
                                        : (t('attachment.upload') || 'Upload')
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