// src/pages/Filters/Upload/UploadFilters.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { carFiltersService } from '../../../services/carFiltersService';
import './UploadFilters.css';

const UploadFilters = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    // Validate file
    const validateAndSetFile = (file) => {
        setError(null);
        setUploadResult(null);

        // Check file type
        if (!file.name.endsWith('.json')) {
            setError(t('filters.upload.invalidFileType'));
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t('filters.upload.fileTooLarge'));
            return;
        }

        setSelectedFile(file);
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile) {
            setError(t('filters.upload.noFileSelected'));
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            // Read file content
            const fileContent = await readFileAsText(selectedFile);

            // Parse JSON
            let jsonData;
            try {
                jsonData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error(t('filters.upload.invalidJson'));
            }

            // Validate JSON structure
            if (!Array.isArray(jsonData)) {
                throw new Error(t('filters.upload.invalidJsonStructure'));
            }

            // Upload to server
            const result = await carFiltersService.uploadFilters(jsonData);

            setUploadResult(result);
            setSelectedFile(null);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || t('filters.upload.uploadFailed'));
        } finally {
            setIsUploading(false);
        }
    };

    // Read file as text
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error(t('filters.upload.fileReadError')));
            reader.readAsText(file);
        });
    };

    // Clear file
    const handleClearFile = () => {
        setSelectedFile(null);
        setError(null);
        setUploadResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`upload-filters-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="upload-filters-header">
                <div className="header-content">
                    <button
                        onClick={() => navigate('/filters')}
                        className="back-button"
                        aria-label={t('common.back')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="header-title-section">
                        <h1 className="page-title">{t('filters.upload.title')}</h1>
                        <p className="page-subtitle">{t('filters.upload.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="upload-filters-content">
                {/* Instructions Card */}
                <div className="upload-instructions-card card">
                    <h3 className="card-title">{t('filters.upload.instructionsTitle')}</h3>
                    <div className="instructions-content">
                        <p>{t('filters.upload.instructionsIntro')}</p>
                        <div className="json-example">
                            <code>
                                {`[
  {
    "id": "dacia",
    "name": "Dacia",
    "models": [
      { "id": "logan", "name": "Logan" },
      { "id": "duster", "name": "Duster" }
    ]
  }
]`}
                            </code>
                        </div>
                        <ul className="instructions-list">
                            <li>{t('filters.upload.instruction1')}</li>
                            <li>{t('filters.upload.instruction2')}</li>
                            <li>{t('filters.upload.instruction3')}</li>
                            <li>{t('filters.upload.instruction4')}</li>
                        </ul>
                    </div>
                </div>

                {/* Upload Card */}
                <div className="upload-card card">
                    <h3 className="card-title">{t('filters.upload.uploadTitle')}</h3>

                    {/* Drag and Drop Area */}
                    <div
                        className={`upload-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="file-input-hidden"
                            disabled={isUploading}
                        />

                        {!selectedFile ? (
                            <div className="drop-zone-content">
                                <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                                <p className="drop-zone-text">{t('filters.upload.dragDropText')}</p>
                                <p className="drop-zone-subtext">{t('filters.upload.orClickToSelect')}</p>
                                <p className="drop-zone-format">{t('filters.upload.jsonOnly')}</p>
                            </div>
                        ) : (
                            <div className="selected-file-info">
                                <svg className="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <div className="file-details">
                                    <p className="file-name">{selectedFile.name}</p>
                                    <p className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearFile();
                                    }}
                                    className="clear-file-btn"
                                    disabled={isUploading}
                                    aria-label={t('common.clear')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="upload-message error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {uploadResult && (
                        <div className="upload-message success-message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                            <div className="result-details">
                                <p className="result-title">{t('filters.upload.uploadSuccess')}</p>
                                <div className="result-stats">
                                    <span>{t('filters.upload.manufacturersAdded')}: {uploadResult.manufacturersAdded || 0}</span>
                                    <span>{t('filters.upload.modelsAdded')}: {uploadResult.modelsAdded || 0}</span>
                                    <span>{t('filters.upload.skipped')}: {uploadResult.skipped || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <div className="upload-actions">
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="btn btn-primary upload-btn"
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner" />
                                    <span>{t('filters.upload.uploading')}</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                    </svg>
                                    <span>{t('filters.upload.uploadButton')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadFilters;