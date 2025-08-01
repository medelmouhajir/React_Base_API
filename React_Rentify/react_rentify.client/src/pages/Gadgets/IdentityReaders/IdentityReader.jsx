// src/pages/Gadgets/IdentityReaders/IdentityReader.jsx
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import identityService from '../../../services/identityService';
import customerService from '../../../services/customerService';
import { blacklistService } from '../../../services/blacklistService';
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
    const [showImages, setShowImages] = useState(true);
    const [isCheckingBlacklist, setIsCheckingBlacklist] = useState(false);
    const [blacklistResults, setBlacklistResults] = useState([]);
    const [showBlacklistWarning, setShowBlacklistWarning] = useState(false);
    const [manualData, setManualData] = useState({});

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
        setShowImages(true);
        setBlacklistResults([]);
        setShowBlacklistWarning(false);
        setManualData({});
    };

    // Handle manual data input
    const handleManualDataChange = (field, value) => {
        setManualData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Check blacklist for extracted data
    const checkBlacklist = async (data) => {
        setIsCheckingBlacklist(true);
        try {
            const searchParams = {
                nationalId: data.nationalId || '',
                passportId: data.passportId || '',
                licenseNumber: data.licenseNumber || '',
            };

            const results = await blacklistService.search(searchParams);
            setBlacklistResults(results || []);

            if (results && results.length > 0) {
                setShowBlacklistWarning(true);
                return true; // Blacklisted
            }

            return false; // Not blacklisted
        } catch (err) {
            console.error('❌ Error checking blacklist:', err);
            return false; // Error treated as not blacklisted
        } finally {
            setIsCheckingBlacklist(false);
        }
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

            // Hide images section after processing
            setShowImages(false);

            // Check blacklist before showing data
            const isBlacklisted = await checkBlacklist(result);

            // Set extracted data and initialize manual data for missing fields
            setExtractedData(result);

            // Initialize manual data for missing fields
            const initialManualData = {};
            const fields = ['email', 'phoneNumber', 'address', 'fullName', 'nationalId', 'passportId', 'licenseNumber', 'dateOfBirth'];
            fields.forEach(field => {
                if (!result[field]) {
                    initialManualData[field] = '';
                } else
                    initialManualData[field] = result[field];
            });
            setManualData(initialManualData);

            if (!isBlacklisted) {
                setSuccess(t('identityReader.extractionSuccess'));
            }
        } catch (err) {
            console.error('❌ Error processing images:', err);
            setError(err.response?.data?.message || err.message || t('identityReader.extractionError'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Create customer with extracted and manual data
    const createCustomer = async () => {
        if (!extractedData || !user?.agencyId) return;

        setIsCreatingCustomer(true);
        setError(null);

        try {
            const customerData = {
                agencyId: user.agencyId,
                fullName: manualData.fullName || extractedData.fullName || '',
                email: manualData.email || extractedData.email || '',
                phoneNumber: manualData.phoneNumber || extractedData.phoneNumber || '',
                nationalId: manualData.nationalId || extractedData.nationalId || '',
                passportId: manualData.passportId || extractedData.passportId || '',
                licenseNumber: manualData.licenseNumber || extractedData.licenseNumber || '',
                address: manualData.address || extractedData.address || '',
                dateOfBirth: (manualData.dateOfBirth || extractedData.dateOfBirth)
                    ? new Date(manualData.dateOfBirth || extractedData.dateOfBirth).toISOString()
                    : null
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

    // Get combined data (extracted + manual)
    const getCombinedData = () => {
        if (!extractedData) return {};

        return {
            fullName: extractedData.fullName || manualData.fullName || '',
            email: extractedData.email || manualData.email || '',
            phoneNumber: extractedData.phoneNumber || manualData.phoneNumber || '',
            nationalId: extractedData.nationalId || manualData.nationalId || '',
            passportId: extractedData.passportId || manualData.passportId || '',
            licenseNumber: extractedData.licenseNumber || manualData.licenseNumber || '',
            address: extractedData.address || manualData.address || '',
            dateOfBirth: extractedData.dateOfBirth || manualData.dateOfBirth || ''
        };
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

            {/* Blacklist Warning */}
            {showBlacklistWarning && blacklistResults.length > 0 && (
                <div className="identity-reader-alert blacklist-warning">
                    <span className="alert-icon">⚠️</span>
                    <div>
                        <strong>{t('identityReader.blacklistWarning')}</strong>
                        <ul className="blacklist-reasons">
                            {blacklistResults.map((entry, index) => (
                                <li key={index}>
                                    {entry.reason} - {entry.reportedByAgencyName}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Upload Section - Hidden after processing */}
            {showImages && (
                <>
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
                            <h3>{t('identityReader.previewTitle')}</h3>
                            <div className="image-preview-grid">
                                {images.map((image) => (
                                    <div key={image.id} className="image-preview-item">
                                        <img
                                            src={image.preview}
                                            alt={image.name}
                                            className="preview-image"
                                        />
                                        <div className="image-info">
                                            <span className="image-name" title={image.name}>
                                                {image.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => removeImage(image.id)}
                                                disabled={isProcessing || isCreatingCustomer}
                                                title={t('identityReader.removeImage')}
                                            >
                                                ❌
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
                                    disabled={isProcessing || images.length === 0 || isCreatingCustomer}
                                >
                                    {isProcessing && <span className="spinner"></span>}
                                    {isProcessing ? t('identityReader.processing') : t('identityReader.processImages')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Extracted Data Section with Manual Input Fields */}
            {extractedData && !showImages && (
                <div className="extracted-data-section">
                    {isCheckingBlacklist && (
                        <div className="checking-blacklist">
                            <span className="spinner"></span>
                            {t('identityReader.checkingBlacklist')}
                        </div>
                    )}

                    <div className="extracted-data-card">
                        <h3>{t('identityReader.extractedDataTitle')}</h3>

                        <div className="data-grid">
                            {/* Full Name */}
                            <div className="data-item">
                                <strong>{t('identityReader.fullName')}:</strong>
                                <input
                                    type="text"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.fullName || ''}
                                    onChange={(e) => handleManualDataChange('fullName', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* Email */}
                            <div className="data-item">
                                <strong>{t('identityReader.email')}:</strong>
                                <input
                                    type="email"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.email || ''}
                                    onChange={(e) => handleManualDataChange('email', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="data-item">
                                <strong>{t('identityReader.phoneNumber')}:</strong>
                                <input
                                    type="tel"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.phoneNumber || ''}
                                    onChange={(e) => handleManualDataChange('phoneNumber', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* National ID */}
                            <div className="data-item">
                                <strong>{t('identityReader.nationalId')}:</strong>
                                <input
                                    type="text"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.nationalId || ''}
                                    onChange={(e) => handleManualDataChange('nationalId', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* Passport ID */}
                            <div className="data-item">
                                <strong>{t('identityReader.passportId')}:</strong>
                                <input
                                    type="text"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.passportId || ''}
                                    onChange={(e) => handleManualDataChange('passportId', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* License Number */}
                            <div className="data-item">
                                <strong>{t('identityReader.licenseNumber')}:</strong>
                                <input
                                    type="text"
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.licenseNumber || ''}
                                    onChange={(e) => handleManualDataChange('licenseNumber', e.target.value)}
                                    className="manual-input"
                                />
                            </div>

                            {/* Address */}
                            <div className="data-item">
                                <strong>{t('identityReader.address')}:</strong>
                                <textarea
                                    placeholder={t('identityReader.enterManually')}
                                    value={manualData.address || ''}
                                    onChange={(e) => handleManualDataChange('address', e.target.value)}
                                    className="manual-input manual-textarea"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div className="data-item">
                                <strong>{t('identityReader.dateOfBirth')}:</strong>
                                <input
                                    type="date"
                                    value={manualData.dateOfBirth || ''}
                                    onChange={(e) => handleManualDataChange('dateOfBirth', e.target.value)}
                                    className="manual-input"
                                />
                            </div>
                        </div>

                        <div className="create-customer-section">
                            <button
                                type="button"
                                className="create-customer-btn"
                                onClick={handleConfirmAndCreate}
                                disabled={isCreatingCustomer || isCheckingBlacklist}
                            >
                                {isCreatingCustomer && <span className="spinner"></span>}
                                {isCreatingCustomer ? t('identityReader.creating') : t('identityReader.createCustomer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IdentityReader;