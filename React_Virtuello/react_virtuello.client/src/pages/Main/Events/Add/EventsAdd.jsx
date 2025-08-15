import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { eventService } from '../../../../services/eventService';
import { EventStatus, EventType } from '../../../../services/Constants';
import './EventsAdd.css';

const EventsAdd = ({ onSuccess, onCancel, className = '' }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const mapRef = useRef(null);
    const [isMapVisible, setIsMapVisible] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start: '',
        end: '',
        status: EventStatus.DRAFT,
        type: EventType.OTHER,
        organizerId: user?.id || '',
        eventCategoryId: '',
        latitude: 0,
        longitude: 0,
        address: '',
        pictureFile: null
    });

    // Load categories and initialize form
    useEffect(() => {
        loadCategories();
        setFormData(prev => ({
            ...prev,
            organizerId: user?.id || ''
        }));
    }, [user]);

    const loadCategories = async () => {
        try {
            // Mock categories for now - replace with actual API call
            setCategories([
                { id: '1', name: 'Conference' },
                { id: '2', name: 'Workshop' },
                { id: '3', name: 'Exhibition' },
                { id: '4', name: 'Concert' },
                { id: '5', name: 'Sports' },
                { id: '6', name: 'Festival' },
                { id: '7', name: 'Other' }
            ]);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        let processedValue = value;
        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'status' || name === 'type') {
            processedValue = parseInt(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Clear specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    pictureFile: t('events.errors.invalid_image_type')
                }));
                return;
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    pictureFile: t('events.errors.image_too_large')
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                pictureFile: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Clear error
            if (errors.pictureFile) {
                setErrors(prev => ({
                    ...prev,
                    pictureFile: ''
                }));
            }
        }
    };

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            pictureFile: null
        }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            address: location.address || ''
        }));
        setIsMapVisible(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('events.errors.name_required');
        } else if (formData.name.length > 200) {
            newErrors.name = t('events.errors.name_too_long');
        }

        if (formData.description && formData.description.length > 2000) {
            newErrors.description = t('events.errors.description_too_long');
        }

        if (!formData.start) {
            newErrors.start = t('events.errors.start_required');
        }

        if (formData.end && formData.start && new Date(formData.end) <= new Date(formData.start)) {
            newErrors.end = t('events.errors.end_before_start');
        }

        if (!formData.eventCategoryId) {
            newErrors.eventCategoryId = t('events.errors.category_required');
        }

        if (formData.address && formData.address.length > 500) {
            newErrors.address = t('events.errors.address_too_long');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await eventService.create(formData);

            if (result.success) {
                if (onSuccess) {
                    onSuccess(result.data);
                }
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            setErrors({ submit: error.message || t('events.errors.create_failed') });
        } finally {
            setIsLoading(false);
        }
    };

    const getEventStatusOptions = () => [
        { value: EventStatus.DRAFT, label: t('events.status.draft') },
        { value: EventStatus.PUBLISHED, label: t('events.status.published') }
    ];

    const getEventTypeOptions = () => [
        { value: EventType.CONFERENCE, label: t('events.type.conference') },
        { value: EventType.WORKSHOP, label: t('events.type.workshop') },
        { value: EventType.EXHIBITION, label: t('events.type.exhibition') },
        { value: EventType.CONCERT, label: t('events.type.concert') },
        { value: EventType.SPORTS, label: t('events.type.sports') },
        { value: EventType.FESTIVAL, label: t('events.type.festival') },
        { value: EventType.OTHER, label: t('events.type.other') }
    ];

    return (
        <div className={`events-add ${className}`}>
            <div className="events-add__header">
                <h1 className="events-add__title">{t('events.add.title')}</h1>
                <p className="events-add__subtitle">{t('events.add.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="events-add__form">
                {/* Error Summary */}
                {errors.submit && (
                    <div className="events-add__error-summary" role="alert">
                        <svg className="events-add__error-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        {errors.submit}
                    </div>
                )}

                {/* Basic Information */}
                <div className="events-add__section">
                    <h2 className="events-add__section-title">{t('events.add.basic_info')}</h2>

                    <div className="events-add__form-group">
                        <label htmlFor="name" className="events-add__label">
                            {t('events.add.name')} <span className="events-add__required">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`events-add__input ${errors.name ? 'events-add__input--error' : ''}`}
                            placeholder={t('events.add.name_placeholder')}
                            maxLength={200}
                            required
                        />
                        {errors.name && (
                            <span className="events-add__error" role="alert">{errors.name}</span>
                        )}
                    </div>

                    <div className="events-add__form-group">
                        <label htmlFor="description" className="events-add__label">
                            {t('events.add.description')}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={`events-add__textarea ${errors.description ? 'events-add__input--error' : ''}`}
                            placeholder={t('events.add.description_placeholder')}
                            maxLength={2000}
                            rows={4}
                        />
                        {errors.description && (
                            <span className="events-add__error" role="alert">{errors.description}</span>
                        )}
                        <span className="events-add__char-count">
                            {formData.description.length}/2000
                        </span>
                    </div>

                    <div className="events-add__form-row">
                        <div className="events-add__form-group">
                            <label htmlFor="eventCategoryId" className="events-add__label">
                                {t('events.add.category')} <span className="events-add__required">*</span>
                            </label>
                            <select
                                id="eventCategoryId"
                                name="eventCategoryId"
                                value={formData.eventCategoryId}
                                onChange={handleInputChange}
                                className={`events-add__select ${errors.eventCategoryId ? 'events-add__input--error' : ''}`}
                                required
                            >
                                <option value="">{t('events.add.select_category')}</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.eventCategoryId && (
                                <span className="events-add__error" role="alert">{errors.eventCategoryId}</span>
                            )}
                        </div>

                        <div className="events-add__form-group">
                            <label htmlFor="type" className="events-add__label">
                                {t('events.add.type')}
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="events-add__select"
                            >
                                {getEventTypeOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="events-add__section">
                    <h2 className="events-add__section-title">{t('events.add.date_time')}</h2>

                    <div className="events-add__form-row">
                        <div className="events-add__form-group">
                            <label htmlFor="start" className="events-add__label">
                                {t('events.add.start_date')} <span className="events-add__required">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="start"
                                name="start"
                                value={formData.start}
                                onChange={handleInputChange}
                                className={`events-add__input ${errors.start ? 'events-add__input--error' : ''}`}
                                required
                            />
                            {errors.start && (
                                <span className="events-add__error" role="alert">{errors.start}</span>
                            )}
                        </div>

                        <div className="events-add__form-group">
                            <label htmlFor="end" className="events-add__label">
                                {t('events.add.end_date')}
                            </label>
                            <input
                                type="datetime-local"
                                id="end"
                                name="end"
                                value={formData.end}
                                onChange={handleInputChange}
                                className={`events-add__input ${errors.end ? 'events-add__input--error' : ''}`}
                            />
                            {errors.end && (
                                <span className="events-add__error" role="alert">{errors.end}</span>
                            )}
                        </div>
                    </div>

                    <div className="events-add__form-group">
                        <label htmlFor="status" className="events-add__label">
                            {t('events.add.status')}
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="events-add__select"
                        >
                            {getEventStatusOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Location */}
                <div className="events-add__section">
                    <h2 className="events-add__section-title">{t('events.add.location')}</h2>

                    <div className="events-add__form-group">
                        <label htmlFor="address" className="events-add__label">
                            {t('events.add.address')}
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={`events-add__input ${errors.address ? 'events-add__input--error' : ''}`}
                            placeholder={t('events.add.address_placeholder')}
                            maxLength={500}
                        />
                        {errors.address && (
                            <span className="events-add__error" role="alert">{errors.address}</span>
                        )}
                    </div>

                    <div className="events-add__form-row">
                        <div className="events-add__form-group">
                            <label htmlFor="latitude" className="events-add__label">
                                {t('events.add.latitude')}
                            </label>
                            <input
                                type="number"
                                id="latitude"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleInputChange}
                                className="events-add__input"
                                step="any"
                                placeholder="0.000000"
                            />
                        </div>

                        <div className="events-add__form-group">
                            <label htmlFor="longitude" className="events-add__label">
                                {t('events.add.longitude')}
                            </label>
                            <input
                                type="number"
                                id="longitude"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleInputChange}
                                className="events-add__input"
                                step="any"
                                placeholder="0.000000"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMapVisible(!isMapVisible)}
                        className="events-add__map-toggle"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {isMapVisible ? t('events.add.hide_map') : t('events.add.select_on_map')}
                    </button>

                    {isMapVisible && (
                        <div className="events-add__map-container">
                            <div ref={mapRef} className="events-add__map">
                                {/* Map integration would go here */}
                                <div className="events-add__map-placeholder">
                                    <p>{t('events.add.map_placeholder')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Upload */}
                <div className="events-add__section">
                    <h2 className="events-add__section-title">{t('events.add.event_image')}</h2>

                    <div className="events-add__form-group">
                        <div className="events-add__image-upload">
                            {imagePreview ? (
                                <div className="events-add__image-preview">
                                    <img
                                        src={imagePreview}
                                        alt={t('events.add.image_preview')}
                                        className="events-add__preview-img"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="events-add__remove-image"
                                        aria-label={t('events.add.remove_image')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="events-add__upload-area"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg className="events-add__upload-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                    <p className="events-add__upload-text">{t('events.add.upload_image')}</p>
                                    <p className="events-add__upload-hint">{t('events.add.image_formats')}</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="events-add__file-input"
                                hidden
                            />
                        </div>

                        {errors.pictureFile && (
                            <span className="events-add__error" role="alert">{errors.pictureFile}</span>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="events-add__actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="events-add__btn events-add__btn--secondary"
                        disabled={isLoading}
                    >
                        {t('common.cancel')}
                    </button>

                    <button
                        type="submit"
                        className="events-add__btn events-add__btn--primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="events-add__spinner" />
                                {t('events.add.creating')}
                            </>
                        ) : (
                            t('events.add.create_event')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventsAdd;