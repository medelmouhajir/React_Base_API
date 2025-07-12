// src/pages/Gadgets/IdentityReaders/IdentityReader.jsx
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import identityService from '../../../services/identityService';
import customerService from '../../../services/customerService';
import './IdentityReader.css';

const IdentityReader = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // State management
    const [images, setImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Handle file upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file count (max 6 total)
        if (images.length + files.length > 6) {
            setError(t('identityReader.maxFilesError'));
            return;
        }

        // Validate file types
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const invalidFiles = files.filter(file => !validTypes.includes(file.type));

        if (invalidFiles.length > 0) {
            setError(t('identityReader.invalidFileType'));
            return;
        }

        // Add files to state
        const newImages = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));

        setImages(prev => [...prev, ...newImages]);
        setError(null);
    };

    // Handle camera capture
    const handleCameraCapture = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        handleFileUpload(e);
    };

    // Remove image
    const removeImage = (imageId) => {
        setImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            // Clean up object URLs
            const toRemove = prev.find(img => img.id === imageId);
            if (toRemove?.preview) {
                URL.revokeObjectURL(toRemove.preview);
            }
            return updated;
        });
    };

    // Clear all images
    const clearAllImages = () => {
        images.forEach(img => {
            if (img.preview) URL.revokeObjectURL(img.preview);
        });
        setImages([]);
        setExtractedData(null);
        setError(null);
        setSuccess(null);
    };

    // Process images using identity service
    const processImages = async () => {
        if (images.length === 0) {
            setError(t('identityReader.noImagesError'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const files = images.map(img => img.file);
            const result = await identityService.extract(files);
            setExtractedData(result);
            setSuccess(t('identityReader.extractionSuccess'));
        } catch (err) {
            console.error('❌ Error processing images:', err);
            setError(err.response?.data?.message || err.message || t('identityReader.extractionError'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Create customer with extracted data
    const createCustomer = async () => {
        if (!extractedData || !user?.agencyId) return;

        setIsCreatingCustomer(true);
        setError(null);

        try {
            const customerData = {
                agencyId: user.agencyId,
                fullName: extractedData.fullName || '',
                email: extractedData.email || '',
                phoneNumber: extractedData.phoneNumber || '',
                nationalId: extractedData.nationalId || '',
                passportId: extractedData.passportId || '',
                licenseNumber: extractedData.licenseNumber || '',
                address: extractedData.address || '',
                dateOfBirth: extractedData.dateOfBirth ? new Date(extractedData.dateOfBirth).toISOString() : null
            };

            await customerService.create(customerData);
            setSuccess(t('identityReader.customerCreated'));

            // Reset form
            clearAllImages();
        } catch (err) {
            console.error('❌ Error creating customer:', err);
            setError(err.response?.data?.message || err.message || t('identityReader.customerCreationError'));
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Confirm and create customer
    const handleConfirmAndCreate = () => {
        if (window.confirm(t('identityReader.confirmCreateCustomer'))) {
            createCustomer();
        }
    };

    return (
        <div className={`identity-reader-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="identity-reader-header">
                <h1 className="identity-reader-title">{t('identityReader.title')}</h1>
                <p className="identity-reader-description">{t('identityReader.description')}</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="identity-reader-alert error">
                    <span className="alert-icon">⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="identity-reader-alert success">
                    <span className="alert-icon">✅</span>
                    {success}
                </div>
            )}

            {/* Upload Section */}
            <div className="identity-reader-upload-section">
                <div className="upload-buttons">
                    <button
                        type="button"
                        className="upload-btn file-upload"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing || isCreatingCustomer}
                    >
                        <span className="btn-icon">📁</span>
                        {t('identityReader.uploadFiles')}
                    </button>

                    <button
                        type="button"
                        className="upload-btn camera-capture"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isProcessing || isCreatingCustomer}
                    >
                        <span className="btn-icon">📷</span>
                        {t('identityReader.takePhoto')}
                    </button>

                    {images.length > 0 && (
                        <button
                            type="button"
                            className="upload-btn clear-all"
                            onClick={clearAllImages}
                            disabled={isProcessing || isCreatingCustomer}
                        >
                            <span className="btn-icon">🗑️</span>
                            {t('identityReader.clearAll')}
                        </button>
                    )}
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    style={{ display: 'none' }}
                />

                <div className="upload-info">
                    <p>{t('identityReader.uploadInfo')}</p>
                    <p className="file-count">{t('identityReader.fileCount', { count: images.length, max: 6 })}</p>
                </div>
            </div>

            {/* Image Preview Section */}
            {images.length > 0 && (
                <div className="identity-reader-preview-section">
                    <h3>{t('identityReader.selectedImages')}</h3>
                    <div className="image-preview-grid">
                        {images.map((image) => (
                            <div key={image.id} className="image-preview-item">
                                <img
                                    src={image.preview}
                                    alt={image.name}
                                    className="preview-image"
                                />
                                <div className="image-overlay">
                                    <span className="image-name">{image.name}</span>
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={() => removeImage(image.id)}
                                        disabled={isProcessing || isCreatingCustomer}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="process-section">
                        <button
                            type="button"
                            className="process-btn"
                            onClick={processImages}
                            disabled={isProcessing || isCreatingCustomer || images.length === 0}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="spinner"></span>
                                    {t('identityReader.processing')}
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">🔍</span>
                                    {t('identityReader.extractIdentity')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {extractedData && (
                <div className="identity-reader-results-section">
                    <h3>{t('identityReader.extractedData')}</h3>
                    <div className="extracted-data-card">
                        <div className="data-grid">
                            {extractedData.fullName && (
                                <div className="data-field">
                                    <label>{t('customer.fields.fullName')}</label>
                                    <span>{extractedData.fullName}</span>
                                </div>
                            )}
                            {extractedData.email && (
                                <div className="data-field">
                                    <label>{t('customer.fields.email')}</label>
                                    <span>{extractedData.email}</span>
                                </div>
                            )}
                            {extractedData.phoneNumber && (
                                <div className="data-field">
                                    <label>{t('customer.fields.phoneNumber')}</label>
                                    <span>{extractedData.phoneNumber}</span>
                                </div>
                            )}
                            {extractedData.nationalId && (
                                <div className="data-field">
                                    <label>{t('customer.fields.nationalId')}</label>
                                    <span>{extractedData.nationalId}</span>
                                </div>
                            )}
                            {extractedData.passportId && (
                                <div className="data-field">
                                    <label>{t('customer.fields.passportId')}</label>
                                    <span>{extractedData.passportId}</span>
                                </div>
                            )}
                            {extractedData.licenseNumber && (
                                <div className="data-field">
                                    <label>{t('customer.fields.licenseNumber')}</label>
                                    <span>{extractedData.licenseNumber}</span>
                                </div>
                            )}
                            {extractedData.address && (
                                <div className="data-field">
                                    <label>{t('customer.fields.address')}</label>
                                    <span>{extractedData.address}</span>
                                </div>
                            )}
                            {extractedData.dateOfBirth && (
                                <div className="data-field">
                                    <label>{t('customer.fields.dateOfBirth')}</label>
                                    <span>{new Date(extractedData.dateOfBirth).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="confirmation-section">
                            <p className="confirmation-text">{t('identityReader.confirmationText')}</p>
                            <button
                                type="button"
                                className="create-customer-btn"
                                onClick={handleConfirmAndCreate}
                                disabled={isCreatingCustomer}
                            >
                                {isCreatingCustomer ? (
                                    <>
                                        <span className="spinner"></span>
                                        {t('identityReader.creatingCustomer')}
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">👤</span>
                                        {t('identityReader.createCustomer')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IdentityReader;