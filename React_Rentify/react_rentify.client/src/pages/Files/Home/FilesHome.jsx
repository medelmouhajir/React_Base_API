// src/pages/Files/Home/FilesHome.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
import agencyService from '../../../services/agencyService';
import customerAttachmentService from '../../../services/customerAttachmentService';
import carAttachmentService from '../../../services/carAttachmentService';
import { carService } from '../../../services/carService';
import { customerService } from '../../../services/customerService';
import { toast } from 'react-toastify';
import './FilesHome.css';

const FilesHome = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    useRtlDirection();

    const agencyId = user?.agencyId;
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    // State
    const [activeTab, setActiveTab] = useState('agency'); // agency, customers, cars
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', file: null });

    // Data states
    const [agencyFiles, setAgencyFiles] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Fetch agency files
    useEffect(() => {
        if (agencyId && activeTab === 'agency') {
            fetchAgencyFiles();
        }
    }, [agencyId, activeTab]);

    // Fetch customers list
    useEffect(() => {
        if (agencyId && activeTab === 'customers') {
            fetchCustomers();
        }
    }, [agencyId, activeTab]);

    // Fetch cars list
    useEffect(() => {
        if (agencyId && activeTab === 'cars') {
            fetchCars();
        }
    }, [agencyId, activeTab]);

    // Fetch agency files
    const fetchAgencyFiles = async () => {
        try {
            setIsLoading(true);
            const files = await agencyService.getAttachments(agencyId);
            setAgencyFiles(files || []);
        } catch (error) {
            console.error('Error fetching agency files:', error);
            toast.error(t('filesHome.errors.fetchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch customers
    const fetchCustomers = async () => {
        try {
            setIsLoading(true);
            const customersData = await customerService.getByAgencyId(agencyId);
            setCustomers(customersData || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error(t('filesHome.errors.fetchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch cars
    const fetchCars = async () => {
        try {
            setIsLoading(true);
            const carsData = await carService.getByAgencyId(agencyId);
            setCars(carsData || []);
        } catch (error) {
            console.error('Error fetching cars:', error);
            toast.error(t('filesHome.errors.fetchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch entity files (customer or car)
    const fetchEntityFiles = async (entityId, type) => {
        try {
            if (type === 'customer') {
                const files = await customerAttachmentService.getByCustomerId(entityId);
                return files || [];
            } else if (type === 'car') {
                const files = await carAttachmentService.getByCarId(entityId);
                return files || [];
            }
        } catch (error) {
            console.error(`Error fetching ${type} files:`, error);
            return [];
        }
    };

    // Handle entity selection
    const handleEntitySelect = async (entity, type) => {
        setIsLoading(true);
        const files = await fetchEntityFiles(entity.id, type);
        setSelectedEntity({ ...entity, type, files });
        setIsLoading(false);
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadForm({ title: file.name.split('.')[0], file });
            setShowUploadModal(true);
        }
        event.target.value = '';
    };

    // Handle file upload with title
    const handleFileUpload = async () => {
        if (!uploadForm.file || !uploadForm.title.trim()) {
            toast.error(t('filesHome.errors.titleRequired'));
            return;
        }

        setUploadingFiles({ uploading: true });

        try {
            const fileName = uploadForm.title.trim() + '.' + uploadForm.file.name.split('.').pop();

            if (activeTab === 'agency') {
                await agencyService.addAttachment(agencyId, fileName, uploadForm.file);
            } else if (activeTab === 'customers' && selectedEntity) {
                await customerAttachmentService.uploadFile(selectedEntity.id, uploadForm.file, uploadForm.title);
            } else if (activeTab === 'cars' && selectedEntity) {
                await carAttachmentService.uploadFile(selectedEntity.id, uploadForm.file);
            }

            toast.success(t('filesHome.uploadSuccess'));

            // Refresh files
            if (activeTab === 'agency') {
                fetchAgencyFiles();
            } else if (selectedEntity) {
                const updatedFiles = await fetchEntityFiles(selectedEntity.id, selectedEntity.type);
                setSelectedEntity({ ...selectedEntity, files: updatedFiles });
            }

            // Close modal and reset form
            setShowUploadModal(false);
            setUploadForm({ title: '', file: null });
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(t('filesHome.errors.uploadFailed'));
        } finally {
            setUploadingFiles({});
        }
    };

    // Cancel upload
    const handleCancelUpload = () => {
        setShowUploadModal(false);
        setUploadForm({ title: '', file: null });
    };

    // Handle file download
    const handleFileDownload = (filePath, fileName) => {
        const fileUrl = `${apiBaseUrl}${filePath}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle file delete
    const handleFileDelete = async (fileId) => {
        if (!window.confirm(t('filesHome.confirmDelete'))) return;

        try {
            if (activeTab === 'agency') {
                await agencyService.removeAttachment(agencyId, fileId);
                fetchAgencyFiles();
            } else if (activeTab === 'customers' && selectedEntity) {
                await customerAttachmentService.deleteAttachment(selectedEntity.id, fileId);
                const updatedFiles = await fetchEntityFiles(selectedEntity.id, 'customer');
                setSelectedEntity({ ...selectedEntity, files: updatedFiles });
            } else if (activeTab === 'cars' && selectedEntity) {
                await carAttachmentService.deleteAttachment(selectedEntity.id, fileId);
                const updatedFiles = await fetchEntityFiles(selectedEntity.id, 'car');
                setSelectedEntity({ ...selectedEntity, files: updatedFiles });
            }
            toast.success(t('filesHome.deleteSuccess'));
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error(t('filesHome.errors.deleteFailed'));
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString(t('language.locale'), {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get file icon based on extension
    const getFileIcon = (fileName) => {
        if (!fileName) return '📄';
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            pdf: '📕',
            doc: '📘',
            docx: '📘',
            xls: '📗',
            xlsx: '📗',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            zip: '📦',
            rar: '📦'
        };
        return icons[ext] || '📄';
    };

    // Filter entities based on search
    const getFilteredEntities = () => {
        const query = searchQuery.toLowerCase();

        if (activeTab === 'customers') {
            return customers.filter(customer =>
                customer.fullName?.toLowerCase().includes(query) ||
                customer.phoneNumber?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query)
            );
        } else if (activeTab === 'cars') {
            return cars.filter(car =>
                car.licensePlate?.toLowerCase().includes(query) ||
                car.model?.toLowerCase().includes(query)
            );
        }
        return [];
    };

    // Render loading state
    if (isLoading && !selectedEntity && agencyFiles.length === 0) {
        return (
            <div className={`files-home-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`files-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="files-header">
                <div className="header-content">
                    <h1 className="page-title">{t('filesHome.title')}</h1>
                    <p className="page-subtitle">{t('filesHome.subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="files-tabs">
                <button
                    className={`tab-button ${activeTab === 'agency' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('agency');
                        setSelectedEntity(null);
                        setSearchQuery('');
                    }}
                >
                    <svg className="tab-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span>{t('filesHome.tabs.agency')}</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('customers');
                        setSelectedEntity(null);
                        setSearchQuery('');
                    }}
                >
                    <svg className="tab-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{t('filesHome.tabs.customers')}</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'cars' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('cars');
                        setSelectedEntity(null);
                        setSearchQuery('');
                    }}
                >
                    <svg className="tab-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <span>{t('filesHome.tabs.cars')}</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="files-content">
                {/* Agency Files View */}
                {activeTab === 'agency' && (
                    <div className="files-section">
                        <div className="section-header">
                            <h2 className="section-title">{t('filesHome.agencyFiles')}</h2>
                            <label className="upload-button">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{t('filesHome.uploadFile')}</span>
                            </label>
                        </div>

                        {agencyFiles.length === 0 ? (
                            <div className="empty-state">
                                <svg className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <p>{t('filesHome.noFiles')}</p>
                            </div>
                        ) : (
                            <div className="files-grid">
                                {agencyFiles.map((file) => (
                                    <div key={file.id} className="file-card">
                                        <div className="file-icon-wrapper">
                                            <span className="file-icon">{getFileIcon(file.fileName)}</span>
                                        </div>
                                        <div className="file-info">
                                            <h3 className="file-name" title={file.fileName}>
                                                {file.fileName}
                                            </h3>
                                            <p className="file-meta">
                                                {formatDate(file.uploadedAt)}
                                            </p>
                                        </div>
                                        <div className="file-actions">
                                            <button
                                                className="action-button download"
                                                onClick={() => handleFileDownload(file.filePath, file.fileName)}
                                                title={t('filesHome.download')}
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                className="action-button delete"
                                                onClick={() => handleFileDelete(file.id)}
                                                title={t('filesHome.delete')}
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Customers/Cars View */}
                {(activeTab === 'customers' || activeTab === 'cars') && (
                    <div className="entity-files-view">
                        {/* Entity List */}
                        <div className="entity-list-panel">
                            <div className="search-bar">
                                <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder={t(`filesHome.search${activeTab === 'customers' ? 'Customers' : 'Cars'}`)}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="entity-list">
                                {getFilteredEntities().map((entity) => (
                                    <button
                                        key={entity.id}
                                        className={`entity-item ${selectedEntity?.id === entity.id ? 'active' : ''}`}
                                        onClick={() => handleEntitySelect(entity, activeTab === 'customers' ? 'customer' : 'car')}
                                    >
                                        <div className="entity-avatar">
                                            {activeTab === 'customers' ? (
                                                <svg viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="entity-info">
                                            <span className="entity-name">
                                                {activeTab === 'customers' ? entity.fullName : `${entity.fields.manufacturer} ${entity.fields.model}`}
                                            </span>
                                            <span className="entity-detail">
                                                {activeTab === 'customers' ? entity.phoneNumber : entity.licensePlate}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {getFilteredEntities().length === 0 && (
                                    <div className="empty-list">
                                        <p>{t(`filesHome.no${activeTab === 'customers' ? 'Customers' : 'Cars'}`)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Files Panel */}
                        <div className="files-panel">
                            {selectedEntity ? (
                                <>
                                    <div className="panel-header">
                                        <div className="entity-header-info">
                                            <h2 className="entity-title">
                                                {activeTab === 'customers' ? selectedEntity.fullName : selectedEntity.licensePlate}
                                            </h2>
                                            <p className="entity-subtitle">
                                                {selectedEntity.files?.length || 0} {t('filesHome.files')}
                                            </p>
                                        </div>
                                        <label className="upload-button">
                                            <input
                                                type="file"
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                            />
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>{t('filesHome.uploadFile')}</span>
                                        </label>
                                    </div>

                                    {selectedEntity.files?.length === 0 ? (
                                        <div className="empty-state">
                                            <svg className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                            </svg>
                                            <p>{t('filesHome.noFiles')}</p>
                                        </div>
                                    ) : (
                                        <div className="files-grid">
                                            {selectedEntity.files?.map((file) => (
                                                <div key={file.id} className="file-card">
                                                    <div className="file-icon-wrapper">
                                                        <span className="file-icon">{getFileIcon(file.fileName)}</span>
                                                    </div>
                                                    <div className="file-info">
                                                        <h3 className="file-name" title={file.fileName}>
                                                            {file.fileName}
                                                        </h3>
                                                        <p className="file-meta">
                                                            {formatDate(file.uploadedAt)}
                                                        </p>
                                                    </div>
                                                    <div className="file-actions">
                                                        <button
                                                            className="action-button download"
                                                            onClick={() => handleFileDownload(file.filePath, file.fileName)}
                                                            title={t('filesHome.download')}
                                                        >
                                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="action-button delete"
                                                            onClick={() => handleFileDelete(file.id)}
                                                            title={t('filesHome.delete')}
                                                        >
                                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-selection">
                                    <svg className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                    </svg>
                                    <p>{t('filesHome.selectEntity')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={handleCancelUpload}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('filesHome.uploadFile')}</h3>
                            <button className="modal-close" onClick={handleCancelUpload}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">{t('filesHome.fileTitle')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    placeholder={t('filesHome.fileTitlePlaceholder')}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('filesHome.selectedFile')}</label>
                                <div className="file-preview">
                                    <span className="file-preview-icon">{getFileIcon(uploadForm.file?.name)}</span>
                                    <span className="file-preview-name">{uploadForm.file?.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCancelUpload}>
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleFileUpload}
                                disabled={uploadingFiles.uploading || !uploadForm.title.trim()}
                            >
                                {uploadingFiles.uploading ? t('common.uploading') : t('filesHome.upload')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesHome;