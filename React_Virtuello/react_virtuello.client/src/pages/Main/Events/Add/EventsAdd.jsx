import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../../../contexts/AuthContext';
import { eventService } from '../../../../services/eventService';
import { eventCategoriesService } from '../../../../services/eventCategoriesService';
import { EventStatus, EventType } from '../../../../services/Constants';
import 'leaflet/dist/leaflet.css';
import './EventsAdd.css';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
const MapClickHandler = ({ onLocationSelect, selectedLocation }) => {
    const [marker, setMarker] = useState(selectedLocation);

    useMapEvents({
        click(e) {
            const location = {
                lat: e.latlng.lat,
                lng: e.latlng.lng
            };
            setMarker(location);
            onLocationSelect(location);
        },
    });

    return marker ? <Marker position={[marker.lat, marker.lng]} /> : null;
};

const EventsAdd = ({ onSuccess, onCancel, className = '' }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

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

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            const response = await eventCategoriesService.getAll();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            setErrors({ categories: t('events.errors.categories_load_failed') });
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        let processedValue = value;
        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                pictureFile: t('events.errors.invalid_file_type')
            }));
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({
                ...prev,
                pictureFile: t('events.errors.file_too_large')
            }));
            return;
        }

        setFormData(prev => ({ ...prev, pictureFile: file }));
        setErrors(prev => ({ ...prev, pictureFile: '' }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, pictureFile: null }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng
        }));
    };

    const toggleMap = () => {
        setIsMapVisible(!isMapVisible);
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
            // Scroll to first error
            const firstError = document.querySelector('.events-add__input--error, .events-add__textarea--error, .events-add__select--error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
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
        { value: EventStatus.PUBLISHED, label: t('events.status.published') },
        { value: EventStatus.IN_PROGRESS, label: t('events.status.in_progress') },
        { value: EventStatus.COMPLETED, label: t('events.status.completed') },
        { value: EventStatus.CANCELLED, label: t('events.status.cancelled') }
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

    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    return (
        <div className={`events-add ${className} ${isMobile ? 'events-add--mobile' : ''}`}>
            <div className="events-add__header">
                <h1 className="events-add__title">{t('events.add.title')}</h1>
                <p className="events-add__subtitle">{t('events.add.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="events-add__form" noValidate>
                {/* Error Summary */}
                {errors.submit && (
                    <div className="events-add__error-summary" role="alert">
                        <svg className="events-add__error-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {errors.name && (
                            <span id="name-error" className="events-add__error" role="alert">{errors.name}</span>
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
                            className={`events-add__textarea ${errors.description ? 'events-add__textarea--error' : ''}`}
                            placeholder={t('events.add.description_placeholder')}
                            rows={isMobile ? 3 : 4}
                            maxLength={2000}
                            aria-describedby={errors.description ? 'description-error' : undefined}
                        />
                        {errors.description && (
                            <span id="description-error" className="events-add__error" role="alert">{errors.description}</span>
                        )}
                        <small className="events-add__character-count">
                            {formData.description.length}/2000 {t('common.characters')}
                        </small>
                    </div>

                    <div className={`events-add__form-row ${isMobile ? 'events-add__form-row--mobile' : ''}`}>
                        <div className="events-add__form-group">
                            <label htmlFor="eventCategoryId" className="events-add__label">
                                {t('events.add.category')} <span className="events-add__required">*</span>
                            </label>
                            <select
                                id="eventCategoryId"
                                name="eventCategoryId"
                                value={formData.eventCategoryId}
                                onChange={handleInputChange}
                                className={`events-add__select ${errors.eventCategoryId ? 'events-add__select--error' : ''}`}
                                required
                                aria-describedby={errors.eventCategoryId ? 'category-error' : undefined}
                            >
                                <option value="">{t('events.add.select_category')}</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.eventCategoryId && (
                                <span id="category-error" className="events-add__error" role="alert">{errors.eventCategoryId}</span>
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
                    <h2 className="events-add__section-title">{t('events.add.datetime')}</h2>

                    <div className={`events-add__form-row ${isMobile ? 'events-add__form-row--mobile' : ''}`}>
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
                                min={getCurrentDateTime()}
                                required
                                aria-describedby={errors.start ? 'start-error' : undefined}
                            />
                            {errors.start && (
                                <span id="start-error" className="events-add__error" role="alert">{errors.start}</span>
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
                                min={formData.start || getCurrentDateTime()}
                                aria-describedby={errors.end ? 'end-error' : undefined}
                            />
                            {errors.end && (
                                <span id="end-error" className="events-add__error" role="alert">{errors.end}</span>
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
                            aria-describedby={errors.address ? 'address-error' : undefined}
                        />
                        {errors.address && (
                            <span id="address-error" className="events-add__error" role="alert">{errors.address}</span>
                        )}
                    </div>

                    {/* Map Toggle */}
                    <div className="events-add__form-group">
                        <button
                            type="button"
                            onClick={toggleMap}
                            className="events-add__map-toggle"
                            aria-expanded={isMapVisible}
                            aria-controls="event-map"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            {isMapVisible ? t('events.add.hide_map') : t('events.add.show_map')}
                        </button>
                    </div>

                    {/* Map Container */}
                    {isMapVisible && (
                        <div id="event-map" className="events-add__map-container">
                            <p className="events-add__map-instruction">
                                {t('events.add.map_instruction')}
                            </p>
                            <div className="events-add__map">
                                <MapContainer
                                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [33.5731, -7.5898]} // Casablanca default
                                    zoom={selectedLocation ? 15 : 12}
                                    style={{ height: '300px', width: '100%' }}
                                    className="events-add__leaflet-map"
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <MapClickHandler
                                        onLocationSelect={handleLocationSelect}
                                        selectedLocation={selectedLocation}
                                    />
                                </MapContainer>
                            </div>
                            {selectedLocation && (
                                <div className="events-add__coordinates">
                                    <small>
                                        {t('events.add.coordinates')}: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </small>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Image Upload */}
                <div className="events-add__section">
                    <h2 className="events-add__section-title">{t('events.add.image')}</h2>

                    <div className="events-add__form-group">
                        <label className="events-add__label">
                            {t('events.add.picture')}
                        </label>

                        {!imagePreview ? (
                            <div
                                className="events-add__upload-area"
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={t('events.add.upload_image')}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.27 5.82 22 7 13.87 2 9l6.91-.74L12 2z" />
                                </svg>
                                <p className="events-add__upload-text">
                                    {t('events.add.click_to_upload')}
                                </p>
                                <small className="events-add__upload-hint">
                                    {t('events.add.upload_formats')}
                                </small>
                            </div>
                        ) : (
                            <div className="events-add__image-preview">
                                <img src={imagePreview} alt={t('events.add.image_preview')} />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="events-add__remove-image"
                                    aria-label={t('events.add.remove_image')}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="events-add__file-input"
                            aria-describedby={errors.pictureFile ? 'picture-error' : undefined}
                        />

                        {errors.pictureFile && (
                            <span id="picture-error" className="events-add__error" role="alert">{errors.pictureFile}</span>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="events-add__actions">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="events-add__btn events-add__btn--secondary"
                            disabled={isLoading}
                        >
                            {t('common.cancel')}
                        </button>
                    )}
                    <button
                        type="submit"
                        className="events-add__btn events-add__btn--primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg className="events-add__spinner" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" />
                                    <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                                </svg>
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