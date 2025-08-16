import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { eventCategoriesService } from '../../../../services/eventCategoriesService';
import './EventsCategories.css';

const EventsCategories = ({ className = '' }) => {
    const { t } = useTranslation();
    const { user, isAdmin, isManager } = useAuth();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'eventCount'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [isMobile, setIsMobile] = useState(false);

    const modalRef = useRef(null);
    const deleteConfirmRef = useRef(null);
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        name: ''
    });

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load categories on component mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Filter and sort categories when search term or sort options change
    useEffect(() => {
        let filtered = categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort categories
        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'eventCount') {
                comparison = (a.eventCount || 0) - (b.eventCount || 0);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredCategories(filtered);
    }, [categories, searchTerm, sortBy, sortOrder]);

    // Handle click outside to close modals
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
            if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(event.target)) {
                closeDeleteConfirm();
            }
        };

        if (showModal || showDeleteConfirm) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showModal, showDeleteConfirm]);

    // Handle escape key to close modals
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (showDeleteConfirm) {
                    closeDeleteConfirm();
                } else if (showModal) {
                    closeModal();
                }
            }
        };

        if (showModal || showDeleteConfirm) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showModal, showDeleteConfirm]);

    // Load categories from API
    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const response = await eventCategoriesService.getAllWithEventCounts();
            if (response.success) {
                setCategories(response.data || []);
            } else {
                showNotification('error', t('events.categories.load_error'));
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            showNotification('error', t('events.categories.load_error'));
        } finally {
            setIsLoading(false);
        }
    };

    // Show notification
    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => {
            setNotification({ show: false, type: '', message: '' });
        }, 5000);
    };

    // Open modal for adding new category
    const openAddModal = () => {
        setModalMode('add');
        setSelectedCategory(null);
        setFormData({ name: '' });
        setErrors({});
        setShowModal(true);

        // Focus on first input after modal opens
        setTimeout(() => {
            if (formRef.current) {
                const firstInput = formRef.current.querySelector('input');
                if (firstInput) firstInput.focus();
            }
        }, 100);
    };

    // Open modal for editing category
    const openEditModal = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setFormData({ name: category.name });
        setErrors({});
        setShowModal(true);

        // Focus on first input after modal opens
        setTimeout(() => {
            if (formRef.current) {
                const firstInput = formRef.current.querySelector('input');
                if (firstInput) firstInput.focus();
            }
        }, 100);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setModalMode('add');
        setSelectedCategory(null);
        setFormData({ name: '' });
        setErrors({});
    };

    // Open delete confirmation
    const openDeleteConfirm = (category) => {
        setCategoryToDelete(category);
        setShowDeleteConfirm(true);
    };

    // Close delete confirmation
    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field-specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Validate form data
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('events.categories.validation.name_required');
        } else if (formData.name.trim().length < 1) {
            newErrors.name = t('events.categories.validation.name_min_length');
        } else if (formData.name.trim().length > 100) {
            newErrors.name = t('events.categories.validation.name_max_length');
        }

        // Check for duplicate names (excluding current category in edit mode)
        const isDuplicate = categories.some(cat =>
            cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
            (modalMode === 'add' || cat.id !== selectedCategory?.id)
        );

        if (isDuplicate) {
            newErrors.name = t('events.categories.validation.name_exists');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const categoryData = {
                name: formData.name.trim()
            };

            let response;
            if (modalMode === 'add') {
                response = await eventCategoriesService.create(categoryData);
                if (response.success) {
                    showNotification('success', t('events.categories.create_success'));
                    loadCategories(); // Reload to get updated counts
                    closeModal();
                }
            } else {
                response = await eventCategoriesService.update(selectedCategory.id, categoryData);
                if (response.success) {
                    showNotification('success', t('events.categories.update_success'));
                    loadCategories(); // Reload to get updated data
                    closeModal();
                }
            }
        } catch (error) {
            console.error('Failed to save category:', error);
            showNotification('error', modalMode === 'add'
                ? t('events.categories.create_error')
                : t('events.categories.update_error')
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle category deletion
    const handleDelete = async () => {
        if (!categoryToDelete) return;

        setIsLoading(true);

        try {
            const response = await eventCategoriesService.delete(categoryToDelete.id);
            if (response.success) {
                showNotification('success', t('events.categories.delete_success'));
                loadCategories(); // Reload categories
                closeDeleteConfirm();
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            showNotification('error', t('events.categories.delete_error'));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle sort change
    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    // Check if user can manage categories
    const canManage = isAdmin() || isManager();

    return (
        <div className={`events-categories ${className}`}>
            {/* Header */}
            <div className="events-categories__header">
                <div className="events-categories__title-section">
                    <h1 className="events-categories__title">
                        {t('events.categories.title')}
                    </h1>
                    <p className="events-categories__subtitle">
                        {t('events.categories.subtitle')}
                    </p>
                </div>

                {canManage && (
                    <div className="events-categories__actions">
                        <button
                            className="events-categories__add-btn"
                            onClick={openAddModal}
                            disabled={isLoading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                            </svg>
                            <span>{isMobile ? t('common.add') : t('events.categories.add_category')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="events-categories__filters">
                <div className="events-categories__search">
                    <div className="events-categories__search-wrapper">
                        <svg className="events-categories__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                            type="text"
                            className="events-categories__search-input"
                            placeholder={t('events.categories.search_placeholder')}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && (
                            <button
                                className="events-categories__search-clear"
                                onClick={() => setSearchTerm('')}
                                aria-label={t('common.clear')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="events-categories__sort">
                    <button
                        className={`events-categories__sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                        onClick={() => handleSortChange('name')}
                    >
                        {t('events.categories.sort_by_name')}
                        {sortBy === 'name' && (
                            <svg
                                className={`events-categories__sort-icon ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M7 14l5-5 5 5z" />
                            </svg>
                        )}
                    </button>
                    <button
                        className={`events-categories__sort-btn ${sortBy === 'eventCount' ? 'active' : ''}`}
                        onClick={() => handleSortChange('eventCount')}
                    >
                        {t('events.categories.sort_by_count')}
                        {sortBy === 'eventCount' && (
                            <svg
                                className={`events-categories__sort-icon ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M7 14l5-5 5 5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="events-categories__content">
                {isLoading && !showModal && !showDeleteConfirm ? (
                    <div className="events-categories__loading">
                        <div className="events-categories__spinner"></div>
                        <span>{t('common.loading')}</span>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="events-categories__empty">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <h3>{searchTerm ? t('events.categories.no_results') : t('events.categories.no_categories')}</h3>
                        <p>{searchTerm
                            ? t('events.categories.no_results_message')
                            : t('events.categories.no_categories_message')
                        }</p>
                        {!searchTerm && canManage && (
                            <button
                                className="events-categories__add-btn events-categories__add-btn--primary"
                                onClick={openAddModal}
                            >
                                {t('events.categories.add_first_category')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="events-categories__grid">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="events-categories__card">
                                <div className="events-categories__card-content">
                                    <div className="events-categories__card-main">
                                        <h3 className="events-categories__card-name">
                                            {category.name}
                                        </h3>
                                        <div className="events-categories__card-stats">
                                            <span className="events-categories__card-count">
                                                {t('events.categories.event_count', { count: category.eventCount || 0 })}
                                            </span>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="events-categories__card-actions">
                                            <button
                                                className="events-categories__action-btn events-categories__action-btn--edit"
                                                onClick={() => openEditModal(category)}
                                                disabled={isLoading}
                                                aria-label={t('events.categories.edit_category', { name: category.name })}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                </svg>
                                                <span className="sr-only">{t('common.edit')}</span>
                                            </button>
                                            <button
                                                className="events-categories__action-btn events-categories__action-btn--delete"
                                                onClick={() => openDeleteConfirm(category)}
                                                disabled={isLoading}
                                                aria-label={t('events.categories.delete_category', { name: category.name })}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                </svg>
                                                <span className="sr-only">{t('common.delete')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="events-categories__modal-overlay">
                    <div className="events-categories__modal" ref={modalRef}>
                        <div className="events-categories__modal-header">
                            <h2 className="events-categories__modal-title">
                                {modalMode === 'add'
                                    ? t('events.categories.add_category')
                                    : t('events.categories.edit_category')
                                }
                            </h2>
                            <button
                                className="events-categories__modal-close"
                                onClick={closeModal}
                                aria-label={t('common.close')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        <form ref={formRef} className="events-categories__form" onSubmit={handleSubmit}>
                            <div className="events-categories__form-group">
                                <label htmlFor="categoryName" className="events-categories__label">
                                    {t('events.categories.name')} <span className="events-categories__required">*</span>
                                </label>
                                <input
                                    id="categoryName"
                                    type="text"
                                    name="name"
                                    className={`events-categories__input ${errors.name ? 'events-categories__input--error' : ''}`}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t('events.categories.name_placeholder')}
                                    maxLength={100}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <span className="events-categories__error">{errors.name}</span>
                                )}
                            </div>

                            <div className="events-categories__form-actions">
                                <button
                                    type="button"
                                    className="events-categories__btn events-categories__btn--secondary"
                                    onClick={closeModal}
                                    disabled={isLoading}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="events-categories__btn events-categories__btn--primary"
                                    disabled={isLoading || !formData.name.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="events-categories__btn-spinner"></div>
                                            {t('common.saving')}
                                        </>
                                    ) : (
                                        modalMode === 'add' ? t('common.create') : t('common.save')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && categoryToDelete && (
                <div className="events-categories__modal-overlay">
                    <div className="events-categories__confirm-modal" ref={deleteConfirmRef}>
                        <div className="events-categories__confirm-header">
                            <div className="events-categories__confirm-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                </svg>
                            </div>
                            <h3 className="events-categories__confirm-title">
                                {t('events.categories.delete_confirm_title')}
                            </h3>
                            <p className="events-categories__confirm-message">
                                {t('events.categories.delete_confirm_message', { name: categoryToDelete.name })}
                            </p>
                            {categoryToDelete.eventCount > 0 && (
                                <p className="events-categories__confirm-warning">
                                    {t('events.categories.delete_warning', { count: categoryToDelete.eventCount })}
                                </p>
                            )}
                        </div>

                        <div className="events-categories__confirm-actions">
                            <button
                                className="events-categories__btn events-categories__btn--secondary"
                                onClick={closeDeleteConfirm}
                                disabled={isLoading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="events-categories__btn events-categories__btn--danger"
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="events-categories__btn-spinner"></div>
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

            {/* Notification Toast */}
            {notification.show && (
                <div className={`events-categories__notification events-categories__notification--${notification.type}`}>
                    <div className="events-categories__notification-content">
                        <svg className="events-categories__notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            {notification.type === 'success' ? (
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            ) : (
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                            )}
                        </svg>
                        <span className="events-categories__notification-message">
                            {notification.message}
                        </span>
                    </div>
                    <button
                        className="events-categories__notification-close"
                        onClick={() => setNotification({ show: false, type: '', message: '' })}
                        aria-label={t('common.close')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventsCategories;