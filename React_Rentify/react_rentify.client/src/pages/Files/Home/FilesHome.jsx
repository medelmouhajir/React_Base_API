// src/pages/Files/Home/FilesHome.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Services
import agencyService from '../../../services/agencyService';
import carAttachmentService from '../../../services/carAttachmentService';
import customerService from '../../../services/customerService';

// Components
import LoadingScreen from '../../../components/ui/LoadingScreen';
import Modal from '../../../components/Modals/Modal';

// Styles
import './FilesHome.css';

const FilesHome = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();

    // States
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // File categories
    const categories = [
        { key: 'all', label: t('files.categories.all'), icon: '📁' },
        { key: 'agency', label: t('files.categories.agency'), icon: '🏢' },
        { key: 'customers', label: t('files.categories.customers'), icon: '👥' },
        { key: 'cars', label: t('files.categories.cars'), icon: '🚗' }
    ];

    // Sort options
    const sortOptions = [
        { key: 'date', label: t('files.sort.date') },
        { key: 'name', label: t('files.sort.name') },
        { key: 'size', label: t('files.sort.size') },
        { key: 'type', label: t('files.sort.type') }
    ];

    // Load all files
    const loadFiles = useCallback(async () => {
        if (!user?.agencyId) return;

        try {
            setLoading(true);
            const allFiles = [];

            // Load agency attachments
            try {
                const agencyAttachments = await agencyService.getAttachments(user.agencyId);
                agencyAttachments.forEach(file => {
                    allFiles.push({
                        ...file,
                        category: 'agency',
                        categoryLabel: t('files.categories.agency'),
                        entityType: 'agency',
                        entityId: user.agencyId,
                        entityName: t('files.myAgency'),
                        size: estimateFileSize(file.fileName),
                        type: getFileType(file.fileName),
                        icon: getFileIcon(file.fileName)
                    });
                });
            } catch (error) {
                console.warn('Failed to load agency attachments:', error);
            }

            // Load car attachments
            try {
                // First get all agency cars, then their attachments
                const cars = await carAttachmentService.getByCarId; // This will need to be updated to get all cars
                // Note: You might need to create a service method to get all cars for an agency
                // For now, this is a placeholder structure
            } catch (error) {
                console.warn('Failed to load car attachments:', error);
            }

            // Load customer attachments (similar pattern)
            try {
                // Similar implementation for customers
            } catch (error) {
                console.warn('Failed to load customer attachments:', error);
            }

            setFiles(allFiles);
        } catch (error) {
            console.error('Error loading files:', error);
            toast.error(t('files.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [user?.agencyId, t]);

    // Filter and sort files
    const processedFiles = useMemo(() => {
        let filtered = files;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(file => file.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(file =>
                file.fileName.toLowerCase().includes(term) ||
                file.entityName?.toLowerCase().includes(term)
            );
        }

        // Sort files
        filtered.sort((a, b) => {
            let compareValue = 0;

            switch (sortBy) {
                case 'name':
                    compareValue = a.fileName.localeCompare(b.fileName);
                    break;
                case 'date':
                    compareValue = new Date(a.uploadedAt) - new Date(b.uploadedAt);
                    break;
                case 'size':
                    compareValue = a.size - b.size;
                    break;
                case 'type':
                    compareValue = a.type.localeCompare(b.type);
                    break;
                default:
                    compareValue = 0;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return filtered;
    }, [files, selectedCategory, searchTerm, sortBy, sortOrder]);

    // Initialize
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // Helper functions
    const getFileType = (fileName) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
        if (['pdf'].includes(extension)) return 'pdf';
        if (['doc', 'docx'].includes(extension)) return 'document';
        if (['xls', 'xlsx'].includes(extension)) return 'spreadsheet';
        return 'file';
    };

    const getFileIcon = (fileName) => {
        const type = getFileType(fileName);
        const icons = {
            image: '🖼️',
            pdf: '📄',
            document: '📝',
            spreadsheet: '📊',
            file: '📁'
        };
        return icons[type] || '📁';
    };

    const estimateFileSize = (fileName) => {
        // This is a placeholder - in a real implementation, you'd get this from the server
        return Math.floor(Math.random() * 5000) + 100; // KB
    };

    const formatFileSize = (sizeInKB) => {
        if (sizeInKB < 1024) return `${sizeInKB} KB`;
        const sizeInMB = sizeInKB / 1024;
        return `${sizeInMB.toFixed(1)} MB`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // File selection handlers
    const toggleFileSelection = (fileId) => {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(fileId)) {
            newSelection.delete(fileId);
        } else {
            newSelection.add(fileId);
        }
        setSelectedFiles(newSelection);
    };

    const selectAllFiles = () => {
        if (selectedFiles.size === processedFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(processedFiles.map(file => file.id)));
        }
    };

    // File actions
    const downloadFile = (file) => {
        const link = document.createElement('a');
        link.href = file.filePath;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadSelectedFiles = () => {
        const selectedFilesList = processedFiles.filter(file => selectedFiles.has(file.id));
        selectedFilesList.forEach(file => downloadFile(file));
        toast.success(t('files.downloadStarted', { count: selectedFilesList.length }));
    };

    const deleteFile = async (file) => {
        try {
            // Delete based on category
            switch (file.category) {
                case 'agency':
                    await agencyService.removeAttachment(file.entityId, file.id);
                    break;
                case 'cars':
                    await carAttachmentService.deleteAttachment(file.entityId, file.id);
                    break;
                case 'customers':
                    // await customerService.removeAttachment(file.entityId, file.id);
                    // Note: This method might need to be implemented
                    break;
                default:
                    throw new Error('Unknown file category');
            }

            // Remove from state
            setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
            toast.success(t('files.deleteSuccess'));
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error(t('files.errors.deleteFailed'));
        }
    };

    const openFileDetails = (file) => {
        setSelectedFile(file);
        setShowDetailsModal(true);
    };

    // Upload handler
    const handleFileUpload = async (files, category, entityId) => {
        try {
            setUploadingFiles(true);
            const uploadPromises = Array.from(files).map(file => {
                switch (category) {
                    case 'agency':
                        return agencyService.addAttachment(entityId, file.name, file);
                    case 'cars':
                        return carAttachmentService.uploadFile(entityId, file);
                    case 'customers':
                        // return customerService.addAttachment(entityId, { fileName: file.name, file });
                        break;
                    default:
                        throw new Error('Unknown category');
                }
            });

            await Promise.all(uploadPromises);
            toast.success(t('files.uploadSuccess', { count: files.length }));
            setShowUploadModal(false);
            loadFiles(); // Reload files
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error(t('files.errors.uploadFailed'));
        } finally {
            setUploadingFiles(false);
        }
    };

    if (loading) {
        return <LoadingScreen message={t('files.loading')} />;
    }

    return (
        <div className={`files-home ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="files-header">
                <div className="files-header-main">
                    <h1 className="files-title">
                        📁 {t('files.title')}
                    </h1>
                    <p className="files-subtitle">
                        {t('files.subtitle')}
                    </p>
                </div>

                <div className="files-actions">
                    <button
                        className="btn-primary"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <span className="btn-icon">⬆️</span>
                        {t('files.upload')}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="files-stats">
                <div className="stat-card">
                    <div className="stat-icon">📄</div>
                    <div className="stat-content">
                        <div className="stat-number">{files.length}</div>
                        <div className="stat-label">{t('files.totalFiles')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💾</div>
                    <div className="stat-content">
                        <div className="stat-number">
                            {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
                        </div>
                        <div className="stat-label">{t('files.totalSize')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-number">{selectedFiles.size}</div>
                        <div className="stat-label">{t('files.selected')}</div>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="files-controls">
                <div className="files-controls-left">
                    {/* Search */}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder={t('files.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="filter-select"
                    >
                        {categories.map(category => (
                            <option key={category.key} value={category.key}>
                                {category.icon} {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="files-controls-right">
                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        {sortOptions.map(option => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        className="sort-order-btn"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={t(`files.sort.${sortOrder}`)}
                    >
                        {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                    </button>

                    {/* View Mode */}
                    <div className="view-mode-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title={t('files.viewMode.grid')}
                        >
                            ⊞
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title={t('files.viewMode.list')}
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
                <div className="bulk-actions">
                    <div className="bulk-actions-info">
                        <span>{t('files.selectedCount', { count: selectedFiles.size })}</span>
                    </div>
                    <div className="bulk-actions-buttons">
                        <button
                            className="btn-secondary"
                            onClick={downloadSelectedFiles}
                        >
                            ⬇️ {t('files.downloadSelected')}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => setSelectedFiles(new Set())}
                        >
                            ❌ {t('files.clearSelection')}
                        </button>
                    </div>
                </div>
            )}

            {/* Files Grid/List */}
            <div className={`files-container ${viewMode}`}>
                {processedFiles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3 className="empty-title">{t('files.empty.title')}</h3>
                        <p className="empty-description">{t('files.empty.description')}</p>
                        <button
                            className="btn-primary"
                            onClick={() => setShowUploadModal(true)}
                        >
                            {t('files.empty.uploadFirst')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Select All (only in list view) */}
                        {viewMode === 'list' && (
                            <div className="files-header-row">
                                <div className="file-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.size === processedFiles.length && processedFiles.length > 0}
                                        onChange={selectAllFiles}
                                    />
                                </div>
                                <div className="file-name-header">{t('files.columns.name')}</div>
                                <div className="file-category-header">{t('files.columns.category')}</div>
                                <div className="file-size-header">{t('files.columns.size')}</div>
                                <div className="file-date-header">{t('files.columns.date')}</div>
                                <div className="file-actions-header">{t('files.columns.actions')}</div>
                            </div>
                        )}

                        {/* Files */}
                        {processedFiles.map(file => (
                            <div
                                key={file.id}
                                className={`file-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                            >
                                <div className="file-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.has(file.id)}
                                        onChange={() => toggleFileSelection(file.id)}
                                    />
                                </div>

                                <div className="file-icon" onClick={() => openFileDetails(file)}>
                                    {file.icon}
                                </div>

                                <div className="file-info" onClick={() => openFileDetails(file)}>
                                    <div className="file-name" title={file.fileName}>
                                        {file.fileName}
                                    </div>
                                    <div className="file-meta">
                                        <span className="file-entity">
                                            {file.categoryLabel} • {file.entityName}
                                        </span>
                                        <span className="file-size">
                                            {formatFileSize(file.size)}
                                        </span>
                                        <span className="file-date">
                                            {formatDate(file.uploadedAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="file-actions">
                                    <button
                                        className="action-btn download"
                                        onClick={() => downloadFile(file)}
                                        title={t('files.actions.download')}
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        className="action-btn details"
                                        onClick={() => openFileDetails(file)}
                                        title={t('files.actions.details')}
                                    >
                                        ℹ️
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => deleteFile(file)}
                                        title={t('files.actions.delete')}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title={t('files.upload.title')}
                    size="medium"
                >
                    <UploadModal
                        onUpload={handleFileUpload}
                        onClose={() => setShowUploadModal(false)}
                        uploading={uploadingFiles}
                    />
                </Modal>
            )}

            {/* File Details Modal */}
            {showDetailsModal && selectedFile && (
                <Modal
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    title={selectedFile.fileName}
                    size="medium"
                >
                    <FileDetailsModal
                        file={selectedFile}
                        onClose={() => setShowDetailsModal(false)}
                        onDownload={() => downloadFile(selectedFile)}
                        onDelete={() => deleteFile(selectedFile)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Upload Modal Component
const UploadModal = ({ onUpload, onClose, uploading }) => {
    const { t } = useTranslation();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('agency');
    const [selectedEntityId, setSelectedEntityId] = useState('');

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) {
            toast.warning(t('files.upload.selectFiles'));
            return;
        }
        if (!selectedEntityId) {
            toast.warning(t('files.upload.selectEntity'));
            return;
        }
        onUpload(selectedFiles, selectedCategory, selectedEntityId);
    };

    return (
        <div className="upload-modal">
            <div className="upload-section">
                <label className="upload-label">
                    {t('files.upload.category')}
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="upload-select"
                >
                    <option value="agency">{t('files.categories.agency')}</option>
                    <option value="cars">{t('files.categories.cars')}</option>
                    <option value="customers">{t('files.categories.customers')}</option>
                </select>
            </div>

            <div className="upload-section">
                <label className="upload-label">
                    {t('files.upload.selectFiles')}
                </label>
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="upload-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                {selectedFiles.length > 0 && (
                    <div className="selected-files">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="selected-file">
                                {file.name} ({formatFileSize(file.size / 1024)})
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="upload-actions">
                <button
                    className="btn-secondary"
                    onClick={onClose}
                    disabled={uploading}
                >
                    {t('common.cancel')}
                </button>
                <button
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0}
                >
                    {uploading ? t('files.uploading') : t('files.upload.start')}
                </button>
            </div>
        </div>
    );
};

// File Details Modal Component
const FileDetailsModal = ({ file, onClose, onDownload, onDelete }) => {
    const { t } = useTranslation();

    return (
        <div className="file-details-modal">
            <div className="file-details-header">
                <div className="file-details-icon">{file.icon}</div>
                <div className="file-details-info">
                    <h3 className="file-details-name">{file.fileName}</h3>
                    <p className="file-details-meta">
                        {file.categoryLabel} • {file.entityName}
                    </p>
                </div>
            </div>

            <div className="file-details-body">
                <div className="detail-row">
                    <span className="detail-label">{t('files.details.size')}</span>
                    <span className="detail-value">{formatFileSize(file.size)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">{t('files.details.type')}</span>
                    <span className="detail-value">{file.type}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">{t('files.details.uploaded')}</span>
                    <span className="detail-value">{formatDate(file.uploadedAt)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">{t('files.details.category')}</span>
                    <span className="detail-value">{file.categoryLabel}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">{t('files.details.entity')}</span>
                    <span className="detail-value">{file.entityName}</span>
                </div>
            </div>

            <div className="file-details-actions">
                <button className="btn-primary" onClick={onDownload}>
                    ⬇️ {t('files.actions.download')}
                </button>
                <button className="btn-danger" onClick={onDelete}>
                    🗑️ {t('files.actions.delete')}
                </button>
            </div>
        </div>
    );
};

export default FilesHome;