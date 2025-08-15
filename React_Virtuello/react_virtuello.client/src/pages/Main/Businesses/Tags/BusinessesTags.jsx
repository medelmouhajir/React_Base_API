import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { tagService } from '../../../../services/tagService';
import './BusinessesTags.css';

const BusinessesTags = () => {
    const { t } = useTranslation();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedTag, setSelectedTag] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);

    const apiBaseUrl = import.meta.env.VITE_API_URL + '/' || '';

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        iconFile: null
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    // Handle resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load tags on component mount
    useEffect(() => {
        loadTags();
    }, []);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                closeDeleteConfirm();
            }
        };

        if (showModal || showDeleteConfirm) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [showModal, showDeleteConfirm]);

    // Load tags from API
    const loadTags = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await tagService.getAll();
            setTags(response.data || []);
        } catch (err) {
            setError(err.message || t('tags.errors.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Filter tags based on search term
    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Form handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            iconFile: file
        }));

        if (formErrors.iconFile) {
            setFormErrors(prev => ({
                ...prev,
                iconFile: ''
            }));
        }
    };

    // Modal handlers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedTag(null);
        setFormData({
            name: '',
            iconFile: null
        });
        setFormErrors({});
        setShowModal(true);
    };

    const openEditModal = (tag) => {
        setModalMode('edit');
        setSelectedTag(tag);
        setFormData({
            name: tag.name,
            iconFile: null
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedTag(null);
        setFormData({
            name: '',
            iconFile: null
        });
        setFormErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Delete handlers
    const openDeleteConfirm = (tag) => {
        setTagToDelete(tag);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setTagToDelete(null);
    };

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = t('tags.validation.name_required');
        } else if (formData.name.trim().length < 2) {
            errors.name = t('tags.validation.name_min_length');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const submitData = {
                name: formData.name.trim(),
                iconFile: formData.iconFile,
                keepExistingIcon: modalMode === 'edit' && !formData.iconFile
            };

            console.log(submitData);
            console.log(modalMode);

            if (modalMode === 'create') {
                await tagService.create(submitData);
            } else {
                await tagService.update(selectedTag.id, submitData);
            }

            await loadTags();
            closeModal();

            // Show success message (you can implement a toast system)
            console.log(modalMode === 'create' ? t('tags.success.created') : t('tags.success.updated'));
        } catch (err) {
            setError(err.message || t('tags.errors.submit_failed'));
        } finally {
            setSubmitting(false);
        }
    };

    // Delete tag
    const handleDelete = async () => {
        if (!tagToDelete) return;

        try {
            setSubmitting(true);
            setError('');

            await tagService.delete(tagToDelete.id);
            await loadTags();
            closeDeleteConfirm();

            // Show success message
            console.log(t('tags.success.deleted'));
        } catch (err) {
            setError(err.message || t('tags.errors.delete_failed'));
        } finally {
            setSubmitting(false);
        }
    };

    // Get display icon
    const getTagIcon = (tag) => {
        if (tag.iconPath) {
            return (
                <img
                    src={apiBaseUrl + tag.iconPath}
                    alt={tag.name}
                    className="businesses-tags__tag-icon-image"
                />
            );
        }

        return (
            <svg className="businesses-tags__tag-icon-default" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
        );
    };

    return (
        <div className={`businesses-tags ${isMobile ? 'businesses-tags--mobile' : 'businesses-tags--desktop'}`}>
            {/* Header */}
            <div className="businesses-tags__header">
                <div className="businesses-tags__title">
                    <h1>{t('tags.title')}</h1>
                    <p className="businesses-tags__subtitle">
                        {t('tags.subtitle')}
                    </p>
                </div>

                <button
                    className="businesses-tags__add-btn btn-primary"
                    onClick={openCreateModal}
                    disabled={loading}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    {t('tags.add_tag')}
                </button>
            </div>

            {/* Search */}
            <div className="businesses-tags__search">
                <div className="businesses-tags__search-input">
                    <svg className="businesses-tags__search-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t('tags.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="businesses-tags__search-field"
                    />
                    {searchTerm && (
                        <button
                            className="businesses-tags__search-clear"
                            onClick={() => setSearchTerm('')}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="businesses-tags__error">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Tags Grid */}
            <div className="businesses-tags__content">
                {loading ? (
                    <div className="businesses-tags__loading">
                        <div className="businesses-tags__spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                ) : filteredTags.length === 0 ? (
                    <div className="businesses-tags__empty">
                        <svg className="businesses-tags__empty-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
                        </svg>
                        <h3>{searchTerm ? t('tags.no_results') : t('tags.no_tags')}</h3>
                        <p>{searchTerm ? t('tags.no_results_desc') : t('tags.no_tags_desc')}</p>
                        {!searchTerm && (
                            <button
                                className="businesses-tags__add-first-btn btn-primary"
                                onClick={openCreateModal}
                            >
                                {t('tags.add_first_tag')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="businesses-tags__grid">
                        {filteredTags.map((tag) => (
                            <div key={tag.id} className="businesses-tags__tag-card">
                                <div className="businesses-tags__tag-icon">
                                    {getTagIcon(tag)}
                                </div>

                                <div className="businesses-tags__tag-info">
                                    <h3 className="businesses-tags__tag-name">{tag.name}</h3>
                                </div>

                                <div className="businesses-tags__tag-actions">
                                    <button
                                        className="businesses-tags__action-btn businesses-tags__action-btn--edit"
                                        onClick={() => openEditModal(tag)}
                                        title={t('common.edit')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                        </svg>
                                    </button>

                                    <button
                                        className="businesses-tags__action-btn businesses-tags__action-btn--delete"
                                        onClick={() => openDeleteConfirm(tag)}
                                        title={t('common.delete')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="businesses-tags__modal-overlay" onClick={closeModal}>
                    <div
                        className="businesses-tags__modal"
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="businesses-tags__modal-header">
                            <h2>
                                {modalMode === 'create' ? t('tags.create_tag') : t('tags.edit_tag')}
                            </h2>
                            <button
                                className="businesses-tags__modal-close"
                                onClick={closeModal}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="businesses-tags__form">
                            <div className="businesses-tags__form-group">
                                <label className="businesses-tags__form-label required">
                                    {t('tags.form.name')}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t('tags.form.name_placeholder')}
                                    className={`businesses-tags__form-input ${formErrors.name ? 'error' : ''}`}
                                    disabled={submitting}
                                />
                                {formErrors.name && (
                                    <div className="businesses-tags__form-error">
                                        {formErrors.name}
                                    </div>
                                )}
                            </div>

                            <div className="businesses-tags__form-group">
                                <label className="businesses-tags__form-label">
                                    {t('tags.form.icon')}
                                </label>
                                <div className="businesses-tags__file-input">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="businesses-tags__file-input-hidden"
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        className="businesses-tags__file-input-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={submitting}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                        </svg>
                                        {formData.iconFile ? formData.iconFile.name : t('tags.form.choose_icon')}
                                    </button>
                                </div>
                                {modalMode === 'edit' && selectedTag?.iconPath && !formData.iconFile && (
                                    <div className="businesses-tags__current-icon">
                                        <img
                                            src={apiBaseUrl + selectedTag.iconPath}
                                            alt={t('tags.form.current_icon')}
                                            className="businesses-tags__current-icon-image"
                                        />
                                        <span>{t('tags.form.current_icon')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="businesses-tags__form-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="businesses-tags__form-btn businesses-tags__form-btn--cancel"
                                    disabled={submitting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="businesses-tags__form-btn businesses-tags__form-btn--submit"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="businesses-tags__spinner businesses-tags__spinner--small"></div>
                                            {t('common.saving')}
                                        </>
                                    ) : (
                                        modalMode === 'create' ? t('common.create') : t('common.save')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="businesses-tags__modal-overlay" onClick={closeDeleteConfirm}>
                    <div
                        className="businesses-tags__modal businesses-tags__modal--confirm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="businesses-tags__modal-header">
                            <h2>{t('tags.confirm_delete')}</h2>
                        </div>

                        <div className="businesses-tags__confirm-content">
                            <p>
                                {t('tags.confirm_delete_message', { name: tagToDelete?.name })}
                            </p>
                        </div>

                        <div className="businesses-tags__form-actions">
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="businesses-tags__form-btn businesses-tags__form-btn--cancel"
                                disabled={submitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="businesses-tags__form-btn businesses-tags__form-btn--danger"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <div className="businesses-tags__spinner businesses-tags__spinner--small"></div>
                                        {t('common.deleting')}
                                    </>
                                ) : (
                                    t('common.delete')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessesTags;