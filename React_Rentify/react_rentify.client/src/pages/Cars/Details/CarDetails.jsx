// src/pages/Cars/Details/CarDetails.jsx
import { useState, useEffect, useRef } from 'react';
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
                setMaintenanceRecords(maintenanceData);
                setAttachments(carData.attachments || []);

                // Process reservations
                const now = new Date();

                // Find current reservation
                const current = reservationsData.find(res => {
                    const startDate = new Date(res.startDate);
                    const endDate = new Date(res.endDate);
                    return startDate <= now && endDate >= now && res.status === 'Ongoing';
                });

                // Find upcoming reservations
                const upcoming = reservationsData
                    .filter(res => {
                        const startDate = new Date(res.startDate);
                        return startDate > now && res.status === 'Reserved';
                    })
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                setCurrentReservation(current || null);
                setUpcomingReservations(upcoming);
            } catch (err) {
                console.error('❌ Error fetching car details:', err);
                setError(t('car.details.error') || 'Error loading car details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id && agencyId) {
            fetchCarData();
        }
    }, [id, agencyId, t]);

    // Handle tab switching
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Navigate back to cars list
    const handleBack = () => {
        navigate('/cars');
    };

    // Navigate to edit car page
    const handleEdit = () => {
        navigate(`/cars/${id}/edit`);
    };

    // Handle attachment upload modal
    const openAttachmentModal = () => {
        setShowAttachmentModal(true);
        setFileError(null);
    };

    const closeAttachmentModal = () => {
        setShowAttachmentModal(false);
        setFileToUpload(null);
        setFileError(null);
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setFileError(t('car.details.fileSizeError') || 'File size exceeds 10MB limit.');
                return;
            }
            setFileToUpload(file);
            setFileError(null);
        }
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!fileToUpload) return;

        setUploadingFile(true);
        setFileError(null);

        try {
            // In a real implementation, you would upload to a server
            // Here we're simulating the file path for demonstration
            const filePath = `/uploads/cars/${id}/${fileToUpload.name}`;

            const newAttachment = await carAttachmentService.addAttachment(id, {
                fileName: fileToUpload.name,
                filePath: filePath
            });

            // Add the new attachment to the list
            setAttachments(prev => [...prev, newAttachment]);
            closeAttachmentModal();
        } catch (err) {
            console.error('❌ Error uploading file:', err);
            setFileError(t('car.details.uploadError') || 'Error uploading file.');
        } finally {
            setUploadingFile(false);
        }
    };

    // Handle attachment deletion
    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm(t('car.details.confirmDeleteAttachment') || 'Are you sure you want to delete this attachment?')) return;

        try {
            await carAttachmentService.deleteAttachment(id, attachmentId);
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        } catch (err) {
            console.error('❌ Error deleting attachment:', err);
            alert(t('car.details.deleteAttachmentError') || 'Error deleting attachment.');
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const handleAddReservation = () => {
        navigate(`/reservations/add?carId=${id}`);
    };

    // Touch event handlers for swipe gestures on mobile
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        if (!touchStartX || !touchStartY) return;

        const xDiff = touchStartX - e.touches[0].clientX;
        const yDiff = touchStartY - e.touches[0].clientY;

        // Only consider horizontal swipes that are more horizontal than vertical
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
            setIsSwiping(true);
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartX || !isSwiping) return;

        const xDiff = touchStartX - e.changedTouches[0].clientX;

        // Swipe threshold
        if (Math.abs(xDiff) > 100) {
            // Swipe left (next tab)
            if (xDiff > 0) {
                if (activeTab === 'info') setActiveTab('maintenance');
                else if (activeTab === 'maintenance') setActiveTab('attachments');
                else if (activeTab === 'attachments') setActiveTab('reservations');
            }
            // Swipe right (previous tab)
            else {
                if (activeTab === 'reservations') setActiveTab('attachments');
                else if (activeTab === 'attachments') setActiveTab('maintenance');
                else if (activeTab === 'maintenance') setActiveTab('info');
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
        setIsSwiping(false);
    };

    // Current car reservation checker
    const isCurrentlyReserved = () => {
        return currentReservation !== null;
    };

    if (isLoading) {
        return (
            <div className={`carDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`carDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-message">
                    <p>{error}</p>
                    <button
                        className="primary-button"
                        onClick={handleBack}
                    >
                        {t('common.backToList') || 'Back to List'}
                    </button>
                </div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className={`carDetails-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-message">
                    <p>{t('car.details.notFound') || 'Car not found.'}</p>
                    <button
                        className="primary-button"
                        onClick={handleBack}
                    >
                        {t('common.backToList') || 'Back to List'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`carDetails-container ${isDarkMode ? 'dark' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header Section */}
            <div className="carDetails-header">
                <button
                    className="back-button"
                    onClick={handleBack}
                    aria-label={t('common.back') || 'Back'}
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="carDetails-title">
                    {car.fields?.manufacturer} {car.fields?.model} ({car.fields?.year})
                </h1>
                <button
                    className="edit-button"
                    onClick={handleEdit}
                    aria-label={t('common.edit') || 'Edit'}
                >
                    <i className="fas fa-edit"></i>
                </button>
            </div>

            {/* Status Badge */}
            <div className="car-status-container">
                <span
                    className={`status-badge ${car.status?.toLowerCase() || 'unknown'}`}
                >
                    {t('car.status.' + car.status.toLowerCase()) || t('car.status.unknown') || 'Unknown'}
                </span>
                {isCurrentlyReserved() && (
                    <span className="status-badge rented">
                        {t('car.status.currentlyRented') || 'Currently Rented'}
                    </span>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => handleTabChange('info')}
                >
                    {t('car.tabs.info') || 'Info'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => handleTabChange('maintenance')}
                >
                    {t('car.tabs.maintenance') || 'Maintenance'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => handleTabChange('attachments')}
                >
                    {t('car.tabs.attachments') || 'Attachments'}
                </button>
                <button
                    className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
                    onClick={() => handleTabChange('reservations')}
                >
                    {t('car.tabs.reservations') || 'Reservations'}
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Car Info Tab */}
                {activeTab === 'info' && (
                    <div className="info-tab">
                        <div className="car-card">

                            <div className="car-info-container">
                                <h2 className="car-model-name">
                                    {car.car_Model?.manufacturer?.name} {car.car_Model?.name}
                                </h2>
                                <p className="car-year">{car.car_Year?.yearValue}</p>

                                <div className="car-details-grid">
                                    <div className="detail-row">
                                        <span className="detail-label">{t('car.fields.licensePlate') || 'License Plate'}:</span>
                                        <span className="detail-value">{car.licensePlate}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">{t('car.fields.color') || 'Color'}:</span>
                                        <div className="color-display">
                                            <span
                                                className="color-dot"
                                                style={{ backgroundColor: car.color }}
                                            ></span>
                                            <span>{car.color}</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">{t('car.fields.dailyRate') || 'Daily Rate'}:</span>
                                        <span className="detail-value">${car.dailyRate.toFixed(2)}</span>
                                    </div>
                                    {car.hourlyRate && (
                                        <div className="detail-row">
                                            <span className="detail-label">{t('car.fields.hourlyRate') || 'Hourly Rate'}:</span>
                                            <span className="detail-value">${car.hourlyRate.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">{t('car.fields.availability') || 'Availability'}:</span>
                                        <span className={`detail-value availability ${car.isAvailable ? 'available' : 'unavailable'}`}>
                                            {car.isAvailable
                                                ? (t('car.status.available') || 'Available')
                                                : (t('car.status.unavailable') || 'Unavailable')}
                                        </span>
                                    </div>
                                    {car.deviceSerialNumber && (
                                        <div className="detail-row">
                                            <span className="detail-label">{t('car.fields.deviceSerialNumber') || 'GPS Device'}:</span>
                                            <span className="detail-value">{car.deviceSerialNumber}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">{t('car.fields.trackingActive') || 'Tracking'}:</span>
                                        <span className={`detail-value ${car.isTrackingActive ? 'tracking-on' : 'tracking-off'}`}>
                                            {car.isTrackingActive
                                                ? (t('car.tracking.active') || 'Active')
                                                : (t('car.tracking.inactive') || 'Inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button
                                className="primary-button"
                                onClick={handleAddReservation}
                                disabled={!car.isAvailable}
                            >
                                {t('car.actions.addReservation') || 'Create Reservation'}
                            </button>
                            <Link to={`/cars/${id}/edit`} className="secondary-button">
                                {t('common.edit') || 'Edit'}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Maintenance Tab */}
                {activeTab === 'maintenance' && (
                    <div className="maintenance-tab">
                        <div className="tab-header">
                            <h2>{t('car.maintenance.title') || 'Maintenance Records'}</h2>
                            <Link to={`/maintenances/add`} state={{ preSelectedCarId: id }} className="add-button">
                                <i className="fas fa-plus"></i>
                                {t('car.maintenance.addRecord') || 'Add Record'}
                            </Link>
                        </div>

                        {maintenanceRecords.length > 0 ? (
                            <div className="maintenance-records-list">
                                {maintenanceRecords.map(record => (
                                    <div
                                        key={record.id}
                                        className={`maintenance-card ${record.isCompleted ? 'completed' : 'scheduled'}`}
                                        onClick={() => navigate(`/maintenances/${record.id}`)}
                                    >
                                        <div className="maintenance-header">
                                            <span className="maintenance-date">
                                                {formatDate(record.scheduledDate)}
                                            </span>
                                            <span className={`maintenance-status ${record.isCompleted ? 'completed' : 'pending'}`}>
                                                {record.isCompleted
                                                    ? (t('maintenance.status.completed') || 'Completed')
                                                    : (t('maintenance.status.scheduled') || 'Scheduled')}
                                            </span>
                                        </div>
                                        <div className="maintenance-body">
                                            <p className="maintenance-description">{record.description}</p>
                                            {record.cost && (
                                                <p className="maintenance-cost">
                                                    {t('maintenance.cost') || 'Cost'}: ${parseFloat(record.cost).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="maintenance-footer">
                                            <Link
                                                to={`/maintenances/${record.id}/edit`}
                                                className="edit-link"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-records-message">
                                <p>{t('car.maintenance.noRecords') || 'No maintenance records found.'}</p>
                                <Link to={`/maintenances/add`} state={{ preSelectedCarId: id }} className="primary-button">
                                    {t('car.maintenance.addFirstRecord') || 'Add First Record'}
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                    <div className="attachments-tab">
                        <div className="tab-header">
                            <h2>{t('car.attachments.title') || 'Attachments'}</h2>
                            <button
                                className="add-button"
                                onClick={openAttachmentModal}
                            >
                                <i className="fas fa-plus"></i>
                                {t('car.attachments.addFile') || 'Add File'}
                            </button>
                        </div>

                        {attachments.length > 0 ? (
                            <div className="attachments-list">
                                {attachments.map(attachment => (
                                    <div key={attachment.id} className="attachment-card">
                                        <div className="attachment-icon">
                                            <i className={`fas ${getFileIcon(attachment.fileName)}`}></i>
                                        </div>
                                        <div className="attachment-details">
                                            <p className="attachment-name">{attachment.fileName}</p>
                                            <p className="attachment-date">
                                                {formatDate(attachment.uploadedAt)}
                                            </p>
                                        </div>
                                        <div className="attachment-actions">
                                            <a
                                                href={attachment.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="download-link"
                                            >
                                                <i className="fas fa-download"></i>
                                            </a>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteAttachment(attachment.id)}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-records-message">
                                <p>{t('car.attachments.noFiles') || 'No attachments found.'}</p>
                                <button
                                    className="primary-button"
                                    onClick={openAttachmentModal}
                                >
                                    {t('car.attachments.addFirstFile') || 'Add First File'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reservations Tab */}
                {activeTab === 'reservations' && (
                    <div className="reservations-tab">
                        <div className="tab-header">
                            <h2>{t('car.reservations.title') || 'Reservations'}</h2>
                            <button
                                className="add-button"
                                onClick={handleAddReservation}
                                disabled={!car.isAvailable}
                            >
                                <i className="fas fa-plus"></i>
                                {t('car.reservations.createNew') || 'Create New'}
                            </button>
                        </div>

                        {/* Current Reservation */}
                        <div className="reservation-section">
                            <h3>{t('car.reservations.current') || 'Current Reservation'}</h3>
                            {currentReservation ? (
                                <div className="reservation-card current">
                                    <div className="reservation-header">
                                        <span className="reservation-dates">
                                            {formatDate(currentReservation.startDate)} - {formatDate(currentReservation.endDate)}
                                        </span>
                                        <span className="reservation-status">
                                            {currentReservation.status}
                                        </span>
                                    </div>
                                    <div className="reservation-details">
                                        <p className="reservation-customer">
                                            {t('reservation.customer') || 'Customer'}: {
                                                currentReservation.reservation_Customers &&
                                                currentReservation.reservation_Customers[0]?.customer?.name ||
                                                t('reservation.noCustomer') || 'No customer'
                                            }
                                        </p>
                                        <p className="reservation-price">
                                            {t('reservation.price') || 'Price'}: ${parseFloat(currentReservation.agreedPrice).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="reservation-actions">
                                        <Link
                                            to={`/reservations/${currentReservation.id}`}
                                            className="view-details-link"
                                        >
                                            {t('common.viewDetails') || 'View Details'}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="no-reservation-message">
                                    {t('car.reservations.noCurrent') || 'No current reservation.'}
                                </p>
                            )}
                        </div>

                        {/* Upcoming Reservations */}
                        <div className="reservation-section">
                            <h3>{t('car.reservations.upcoming') || 'Upcoming Reservations'}</h3>
                            {upcomingReservations.length > 0 ? (
                                <div className="reservations-list">
                                    {upcomingReservations.map(reservation => (
                                        <div key={reservation.id} className="reservation-card upcoming">
                                            <div className="reservation-header">
                                                <span className="reservation-dates">
                                                    {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                                                </span>
                                                <span className="reservation-status">
                                                    {reservation.status}
                                                </span>
                                            </div>
                                            <div className="reservation-details">
                                                <p className="reservation-customer">
                                                    {t('reservation.customer') || 'Customer'}: {
                                                        reservation.reservation_Customers &&
                                                        reservation.reservation_Customers[0]?.customer?.name ||
                                                        t('reservation.noCustomer') || 'No customer'
                                                    }
                                                </p>
                                                <p className="reservation-price">
                                                    {t('reservation.price') || 'Price'}: ${parseFloat(reservation.agreedPrice).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="reservation-actions">
                                                <Link
                                                    to={`/reservations/${reservation.id}`}
                                                    className="view-details-link"
                                                >
                                                    {t('common.viewDetails') || 'View Details'}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-reservation-message">
                                    {t('car.reservations.noUpcoming') || 'No upcoming reservations.'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* File Upload Modal */}
            {showAttachmentModal && (
                <div className="modal-overlay">
                    <div className={`modal-container ${isDarkMode ? 'dark' : ''}`}>
                        <div className="modal-header">
                            <h3>{t('car.attachments.uploadTitle') || 'Upload Attachment'}</h3>
                            <button
                                className="close-button"
                                onClick={closeAttachmentModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="file-upload-container">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div
                                    className="file-drop-area"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {fileToUpload ? (
                                        <div className="selected-file">
                                            <i className={`fas ${getFileIcon(fileToUpload.name)}`}></i>
                                            <span className="file-name">{fileToUpload.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <p>{t('car.attachments.dragDrop') || 'Drag & drop a file or click to browse'}</p>
                                            <p className="file-hint">{t('car.attachments.maxSize') || 'Maximum file size: 10MB'}</p>
                                        </>
                                    )}
                                </div>
                                {fileError && (
                                    <p className="file-error">{fileError}</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="secondary-button"
                                onClick={closeAttachmentModal}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="primary-button"
                                onClick={handleFileUpload}
                                disabled={!fileToUpload || uploadingFile}
                            >
                                {uploadingFile
                                    ? (t('common.uploading') || 'Uploading...')
                                    : (t('common.upload') || 'Upload')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to determine file icon based on extension
const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    switch (extension) {
        case 'pdf':
            return 'fa-file-pdf';
        case 'doc':
        case 'docx':
            return 'fa-file-word';
        case 'xls':
        case 'xlsx':
            return 'fa-file-excel';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'fa-file-image';
        default:
            return 'fa-file';
    }
};

export default CarDetails;