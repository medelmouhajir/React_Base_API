// src/pages/Studio/Uploads/UploadsList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import studioAssetsService from '../../../services/studioAssetsService';
import './UploadsList.css';

const UploadsList = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // State
    const [uploads, setUploads] = useState([]);
    const [selectedUploads, setSelectedUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUploads, setFilteredUploads] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSerie, setSelectedSerie] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'type'
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

    // API URL for image paths
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    // Load selected series from localStorage
    useEffect(() => {
        const storedSerie = localStorage.getItem('studioSelectedSerie');
        if (storedSerie) {
            try {
                setSelectedSerie(JSON.parse(storedSerie));
            } catch (error) {
                console.error('Error loading selected serie:', error);
                setError(t('studio.uploads.errors.loadingSeries'));
            }
        } else {
            setError(t('studio.uploads.errors.noSeriesSelected'));
        }
    }, [t]);

    // Load uploads when series is set
    useEffect(() => {
        if (selectedSerie) {
            loadUploads();
        }
    }, [selectedSerie]);

    // Apply filters and sorting when uploads or search term changes
    useEffect(() => {
        let result = [...uploads];

        // Apply search filter
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(upload => {
                // Extract filename from path
                const filename = upload.path.split('/').pop().toLowerCase();
                return filename.includes(lowerSearchTerm);
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            let compareResult = 0;

            switch (sortBy) {
                case 'date':
                    compareResult = new Date(a.date_Uploaded) - new Date(b.date_Uploaded);
                    break;
                case 'name':
                    // Extract filenames from paths
                    const nameA = a.path.split('/').pop().toLowerCase();
                    const nameB = b.path.split('/').pop().toLowerCase();
                    compareResult = nameA.localeCompare(nameB);
                    break;
                case 'type':
                    // Extract file extensions from paths
                    const typeA = a.path.split('.').pop().toLowerCase();
                    const typeB = b.path.split('.').pop().toLowerCase();
                    compareResult = typeA.localeCompare(typeB);
                    break;
                default:
                    compareResult = 0;
            }

            return sortDirection === 'asc' ? compareResult : -compareResult;
        });

        setFilteredUploads(result);
    }, [uploads, searchTerm, sortBy, sortDirection]);

    // Load uploads from the server
    const loadUploads = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await studioAssetsService.getUploads(selectedSerie.id);
            setUploads(data);
        } catch (error) {
            console.error('Error loading uploads:', error);
            setError(t('studio.uploads.errors.loadingUploads'));
            toast.error(t('studio.uploads.errors.loadingUploads'));
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        let successCount = 0;

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('fileData', file);

                await studioAssetsService.createUpload(selectedSerie.id, formData);
                successCount++;
            }

            toast.success(t('studio.uploads.uploadSuccess', { count: successCount }));
            loadUploads(); // Refresh the list
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error(t('studio.uploads.errors.uploadFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Toggle selection of an upload
    const toggleSelection = (uploadId) => {
        setSelectedUploads(prev =>
            prev.includes(uploadId)
                ? prev.filter(id => id !== uploadId)
                : [...prev, uploadId]
        );
    };

    // Select or deselect all uploads
    const toggleSelectAll = () => {
        if (selectedUploads.length === filteredUploads.length) {
            setSelectedUploads([]);
        } else {
            setSelectedUploads(filteredUploads.map(upload => upload.id));
        }
    };

    // Delete selected uploads
    const deleteSelectedUploads = async () => {
        if (selectedUploads.length === 0) return;

        setLoading(true);
        let successCount = 0;

        try {
            for (const uploadId of selectedUploads) {
                await studioAssetsService.removeUpload(uploadId);
                successCount++;
            }

            toast.success(t('studio.uploads.deleteSuccess', { count: successCount }));
            setSelectedUploads([]);
            loadUploads(); // Refresh the list
        } catch (error) {
            console.error('Error deleting uploads:', error);
            toast.error(t('studio.uploads.errors.deleteFailed'));
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    // Get file extension
    const getFileExtension = (path) => {
        return path.split('.').pop().toLowerCase();
    };

    // Check if file is an image
    const isImage = (path) => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        return imageExtensions.includes(getFileExtension(path));
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Handle sort change
    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            // Toggle direction if same field
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field and default to descending
            setSortBy(newSortBy);
            setSortDirection('desc');
        }
    };

    // Render file icon based on type
    const renderFileIcon = (path) => {
        const ext = getFileExtension(path);

        if (isImage(path)) {
            return (
                <svg className="uploads-list__file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            );
        }

        switch (ext) {
            case 'pdf':
                return (
                    <svg className="uploads-list__file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                );
            case 'doc':
            case 'docx':
                return (
                    <svg className="uploads-list__file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="16" y1="9" x2="8" y2="9"></line>
                    </svg>
                );
            default:
                return (
                    <svg className="uploads-list__file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                );
        }
    };

    // Render delete confirmation modal
    const renderDeleteModal = () => (
        <div className={`uploads-list__modal ${showDeleteModal ? 'uploads-list__modal--visible' : ''}`}>
            <div className="uploads-list__modal-content">
                <div className="uploads-list__modal-header">
                    <h2>{t('studio.uploads.deleteConfirmation')}</h2>
                    <button
                        className="uploads-list__modal-close"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="uploads-list__modal-body">
                    <p>
                        {t('studio.uploads.deleteWarning', { count: selectedUploads.length })}
                    </p>
                    <p className="uploads-list__delete-warning">
                        {t('studio.uploads.deleteWarningPermanent')}
                    </p>
                </div>

                <div className="uploads-list__modal-footer">
                    <button
                        className="uploads-list__button uploads-list__button--secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className="uploads-list__button uploads-list__button--danger"
                        onClick={deleteSelectedUploads}
                    >
                        {t('studio.uploads.confirmDelete')}
                    </button>
                </div>
            </div>
        </div>
    );

    // Main content - loading state
    if (loading && uploads.length === 0) {
        return (
            <div className={`uploads-list uploads-list--${isDarkMode ? 'dark' : 'light'}`}>
                <div className="uploads-list__loading">
                    <div className="uploads-list__spinner"></div>
                    <p>{t('studio.uploads.loading')}</p>
                </div>
            </div>
        );
    }

    // Main content - error state
    if (error && !selectedSerie) {
        return (
            <div className={`uploads-list uploads-list--${isDarkMode ? 'dark' : 'light'}`}>
                <div className="uploads-list__error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Main content - uploads list
    return (
        <div className={`uploads-list uploads-list--${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="uploads-list__header">
                <h1 className="uploads-list__title">{t('studio.uploads.title')}</h1>

                <div className="uploads-list__controls">
                    {/* Search input */}
                    <div className="uploads-list__search-container">
                        <input
                            type="text"
                            className="uploads-list__search"
                            placeholder={t('studio.uploads.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="uploads-list__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>

                    {/* View mode toggle */}
                    <div className="uploads-list__view-toggle">
                        <button
                            className={`uploads-list__view-button ${viewMode === 'grid' ? 'uploads-list__view-button--active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title={t('studio.uploads.gridView')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </button>
                        <button
                            className={`uploads-list__view-button ${viewMode === 'list' ? 'uploads-list__view-button--active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title={t('studio.uploads.listView')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions toolbar */}
            <div className="uploads-list__toolbar">
                <div className="uploads-list__selection-info">
                    {selectedUploads.length > 0 ? (
                        <span>
                            {t('studio.uploads.selected', { count: selectedUploads.length })}
                        </span>
                    ) : (
                        <span>{t('studio.uploads.count', { count: filteredUploads.length })}</span>
                    )}
                </div>

                <div className="uploads-list__actions">
                    {/* Upload button */}
                    <label className="uploads-list__button uploads-list__button--primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        {t('studio.uploads.upload')}
                        <input
                            type="file"
                            className="uploads-list__file-input"
                            onChange={handleFileUpload}
                            multiple
                        />
                    </label>

                    {/* Delete button - only show when items are selected */}
                    {selectedUploads.length > 0 && (
                        <button
                            className="uploads-list__button uploads-list__button--danger"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            {t('studio.uploads.delete')}
                        </button>
                    )}

                    {/* Refresh button */}
                    <button
                        className="uploads-list__button uploads-list__button--secondary"
                        onClick={loadUploads}
                        disabled={loading}
                    >
                        <svg
                            className={`uploads-list__refresh-icon ${loading ? 'uploads-list__refresh-icon--spinning' : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        {loading ? t('studio.uploads.refreshing') : t('studio.uploads.refresh')}
                    </button>
                </div>
            </div>

            {/* Sort options */}
            <div className="uploads-list__sort-options">
                <span className="uploads-list__sort-label">{t('studio.uploads.sortBy')}:</span>
                <button
                    className={`uploads-list__sort-button ${sortBy === 'date' ? 'uploads-list__sort-button--active' : ''}`}
                    onClick={() => handleSortChange('date')}
                >
                    {t('studio.uploads.date')}
                    {sortBy === 'date' && (
                        <svg className="uploads-list__sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points={sortDirection === 'desc' ? "6 9 12 15 18 9" : "18 15 12 9 6 15"}></polyline>
                        </svg>
                    )}
                </button>
                <button
                    className={`uploads-list__sort-button ${sortBy === 'name' ? 'uploads-list__sort-button--active' : ''}`}
                    onClick={() => handleSortChange('name')}
                >
                    {t('studio.uploads.name')}
                    {sortBy === 'name' && (
                        <svg className="uploads-list__sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points={sortDirection === 'desc' ? "6 9 12 15 18 9" : "18 15 12 9 6 15"}></polyline>
                        </svg>
                    )}
                </button>
                <button
                    className={`uploads-list__sort-button ${sortBy === 'type' ? 'uploads-list__sort-button--active' : ''}`}
                    onClick={() => handleSortChange('type')}
                >
                    {t('studio.uploads.type')}
                    {sortBy === 'type' && (
                        <svg className="uploads-list__sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points={sortDirection === 'desc' ? "6 9 12 15 18 9" : "18 15 12 9 6 15"}></polyline>
                        </svg>
                    )}
                </button>
            </div>

            {/* Grid view */}
            {viewMode === 'grid' && (
                <div className="uploads-list__grid">
                    {filteredUploads.length === 0 ? (
                        <div className="uploads-list__empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <p>{searchTerm ? t('studio.uploads.noSearchResults') : t('studio.uploads.noUploads')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Select all option */}
                            <div className="uploads-list__select-all">
                                <label className="uploads-list__checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedUploads.length === filteredUploads.length && filteredUploads.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                    {t('studio.uploads.selectAll')}
                                </label>
                            </div>

                            {/* Grid items */}
                            <div className="uploads-list__grid-items">
                                {filteredUploads.map(upload => {
                                    const isSelected = selectedUploads.includes(upload.id);
                                    const filename = upload.path.split('/').pop();
                                    const isImageFile = isImage(upload.path);

                                    return (
                                        <div
                                            key={upload.id}
                                            className={`uploads-list__grid-item ${isSelected ? 'uploads-list__grid-item--selected' : ''}`}
                                            onClick={() => toggleSelection(upload.id)}
                                        >
                                            <div className="uploads-list__checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by the parent div click
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            <div className="uploads-list__thumbnail">
                                                {isImageFile ? (
                                                    <img
                                                        src={`${apiBaseUrl}${upload.path}`}
                                                        alt={filename}
                                                        className="uploads-list__image"
                                                    />
                                                ) : (
                                                    <div className="uploads-list__file-thumbnail">
                                                        {renderFileIcon(upload.path)}
                                                        <span className="uploads-list__file-ext">{getFileExtension(upload.path)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="uploads-list__item-info">
                                                <span className="uploads-list__filename" title={filename}>
                                                    {filename}
                                                </span>
                                                <span className="uploads-list__date">
                                                    {formatDate(upload.date_Uploaded)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* List view */}
            {viewMode === 'list' && (
                <div className="uploads-list__list">
                    {filteredUploads.length === 0 ? (
                        <div className="uploads-list__empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <p>{searchTerm ? t('studio.uploads.noSearchResults') : t('studio.uploads.noUploads')}</p>
                        </div>
                    ) : (
                        <table className="uploads-list__table">
                            <thead>
                                <tr>
                                    <th className="uploads-list__th-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedUploads.length === filteredUploads.length && filteredUploads.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="uploads-list__th-file">{t('studio.uploads.file')}</th>
                                    <th className="uploads-list__th-type">{t('studio.uploads.type')}</th>
                                    <th className="uploads-list__th-date">{t('studio.uploads.uploadDate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUploads.map(upload => {
                                    const isSelected = selectedUploads.includes(upload.id);
                                    const filename = upload.path.split('/').pop();
                                    const fileExt = getFileExtension(upload.path);
                                    const isImageFile = isImage(upload.path);

                                    return (
                                        <tr
                                            key={upload.id}
                                            className={`uploads-list__row ${isSelected ? 'uploads-list__row--selected' : ''}`}
                                            onClick={() => toggleSelection(upload.id)}
                                        >
                                            <td className="uploads-list__td-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by the row click
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className="uploads-list__td-file">
                                                <div className="uploads-list__file-info">
                                                    {isImageFile ? (
                                                        <div className="uploads-list__mini-thumb">
                                                            <img
                                                                src={`${apiBaseUrl}${upload.path}`}
                                                                alt={filename}
                                                                className="uploads-list__mini-image"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="uploads-list__file-icon-wrapper">
                                                            {renderFileIcon(upload.path)}
                                                        </div>
                                                    )}
                                                    <span className="uploads-list__filename-list" title={filename}>
                                                        {filename}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="uploads-list__td-type">
                                                <span className="uploads-list__file-type">
                                                    {fileExt.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="uploads-list__td-date">
                                                {formatDate(upload.date_Uploaded)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Delete confirmation modal */}
            {renderDeleteModal()}
        </div>
    );
};

export default UploadsList;