import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { businessService } from '../../../../services/businessService';
import { tagService } from '../../../../services/tagService';
import { useAuth } from '../../../../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';
import './BusinessesAdd.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location picker component
const LocationPicker = ({ position, onLocationSelect }) => {
    const map = useMapEvents({
        click: (e) => {
            onLocationSelect([e.latlng.lat, e.latlng.lng]);
        },
    });

    useEffect(() => {
        if (position && position.length === 2) {
            map.setView(position, map.getZoom());
        }
    }, [map, position]);

    return position ? (
        <Marker position={position} />
    ) : null;
};

const BusinessesAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Form steps
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 0, // Draft
        phone: '',
        email: '',
        whatsApp: '',
        instagram: '',
        facebook: '',
        website: '',
        latitude: 34.0522, // Default to Fes, Morocco
        longitude: -6.7736,
        address: '',
        imageFile: null,
        logoFile: null,
        selectedTags: []
    });

    // Component states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [tags, setTags] = useState([]);
    const [locationPickerMode, setLocationPickerMode] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    // File previews
    const [imagePreview, setImagePreview] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    // Refs
    const imageInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const addressInputRef = useRef(null);

    // Step configuration
    const steps = [
        {
            key: 'basic',
            title: t('businesses.add.steps.basic_info'),
            icon: 'info'
        },
        {
            key: 'contact',
            title: t('businesses.add.steps.contact_info'),
            icon: 'contact'
        },
        {
            key: 'location',
            title: t('businesses.add.steps.location'),
            icon: 'location'
        },
        {
            key: 'media',
            title: t('businesses.add.steps.media_tags'),
            icon: 'media'
        }
    ];

    // Handle mobile detection
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

    // Set owner ID when user is available
    useEffect(() => {
        if (user?.id) {
            setFormData(prev => ({ ...prev, ownerId: user.id }));
        }
    }, [user]);

    // Load tags
    const loadTags = async () => {
        try {
            const response = await tagService.getAll();
            if (response.success) {
                setTags(response.data || []);
            }
        } catch (err) {
            console.error('Error loading tags:', err);
        }
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Handle file uploads
    const handleFileUpload = (field, file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setFormErrors(prev => ({
                ...prev,
                [field]: t('businesses.add.errors.invalid_image')
            }));
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setFormErrors(prev => ({
                ...prev,
                [field]: t('businesses.add.errors.file_too_large')
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [field]: file }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (field === 'imageFile') {
                setImagePreview(e.target.result);
            } else if (field === 'logoFile') {
                setLogoPreview(e.target.result);
            }
        };
        reader.readAsDataURL(file);

        // Clear any previous errors
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Remove file
    const removeFile = (field) => {
        setFormData(prev => ({ ...prev, [field]: null }));
        if (field === 'imageFile') {
            setImagePreview(null);
            if (imageInputRef.current) imageInputRef.current.value = '';
        } else if (field === 'logoFile') {
            setLogoPreview(null);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    // Get current location
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError(t('businesses.add.errors.geolocation_not_supported'));
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));
                setGettingLocation(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setError(t('businesses.add.errors.location_failed'));
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [t]);

    // Handle location selection from map
    const handleLocationSelect = useCallback((position) => {
        setFormData(prev => ({
            ...prev,
            latitude: position[0],
            longitude: position[1]
        }));
    }, []);

    // Validate current step
    const validateStep = (step) => {
        const errors = {};

        switch (step) {
            case 1: // Basic info
                if (!formData.name.trim()) {
                    errors.name = t('businesses.add.errors.name_required');
                }
                if (formData.name.length > 200) {
                    errors.name = t('businesses.add.errors.name_too_long');
                }
                if (formData.description && formData.description.length > 2000) {
                    errors.description = t('businesses.add.errors.description_too_long');
                }
                break;

            case 2: // Contact info
                if (formData.phone && !isValidPhone(formData.phone)) {
                    errors.phone = t('businesses.add.errors.invalid_phone');
                }
                if (formData.email && !isValidEmail(formData.email)) {
                    errors.email = t('businesses.add.errors.invalid_email');
                }
                if (formData.website && !isValidUrl(formData.website)) {
                    errors.website = t('businesses.add.errors.invalid_website');
                }
                break;

            case 3: // Location
                if (!formData.latitude || !formData.longitude) {
                    errors.location = t('businesses.add.errors.location_required');
                }
                if (formData.address && formData.address.length > 500) {
                    errors.address = t('businesses.add.errors.address_too_long');
                }
                break;

            case 4: // Media & Tags
                // Optional validations for files already handled in handleFileUpload
                break;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Validation helpers
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPhone = (phone) => {
        const phoneRegex = /^[+]?[\d\s-()]+$/;
        return phoneRegex.test(phone) && phone.length >= 8;
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // Navigate steps
    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Submit form
    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        try {
            setLoading(true);
            setError('');

            const submitData = {
                ...formData,
                ownerId: user?.id || formData.ownerId
            };

            const response = await businessService.create(submitData);

            if (response.success) {
                navigate('/businesses', {
                    state: {
                        message: t('businesses.add.success.created')
                    }
                });
            } else {
                setError(response.message || t('businesses.add.errors.submit_failed'));
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message || t('businesses.add.errors.submit_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Toggle tag selection
    const toggleTag = (tagId) => {
        setFormData(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagId)
                ? prev.selectedTags.filter(id => id !== tagId)
                : [...prev.selectedTags, tagId]
        }));
    };

    // Get step icon
    const getStepIcon = (iconType) => {
        const icons = {
            info: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
                </svg>
            ),
            contact: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22,3H2C0.91,3.04 0.04,3.91 0,5V19C0.04,20.09 0.91,20.96 2,21H22C23.09,20.96 23.96,20.09 24,19V5C23.96,3.91 23.09,3.04 22,3M22,19H2V5H22V19M14,17V15.5C14,14.11 16.79,13.42 18.5,13.42C20.21,13.42 23,14.11 23,15.5V17H14M18.5,7A2.5,2.5 0 0,0 16,9.5A2.5,2.5 0 0,0 18.5,12A2.5,2.5 0 0,0 21,9.5A2.5,2.5 0 0,0 18.5,7Z" />
                </svg>
            ),
            location: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22S19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5C10.62,11.5 9.5,10.38 9.5,9S10.62,6.5 12,6.5 14.5,7.62 14.5,9 13.38,11.5 12,11.5Z" />
                </svg>
            ),
            media: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M11,4H6V20H18V10H11V4Z" />
                </svg>
            )
        };
        return icons[iconType] || icons.info;
    };

    return (
        <div className={`businesses-add ${isMobile ? 'businesses-add--mobile' : ''}`}>
            {/* Header */}
            <div className="businesses-add__header">
                <div className="businesses-add__header-content">
                    <button
                        className="businesses-add__back-btn"
                        onClick={() => navigate('/businesses')}
                        aria-label={t('common.back')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                        </svg>
                    </button>

                    <div className="businesses-add__header-text">
                        <h1 className="businesses-add__title">
                            {t('businesses.add.title')}
                        </h1>
                        <p className="businesses-add__subtitle">
                            {t('businesses.add.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="businesses-add__steps">
                {steps.map((step, index) => (
                    <div
                        key={step.key}
                        className={`businesses-add__step ${index + 1 === currentStep ? 'active' : ''
                            } ${index + 1 < currentStep ? 'completed' : ''
                            }`}
                    >
                        <div className="businesses-add__step-icon">
                            {index + 1 < currentStep ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                                </svg>
                            ) : (
                                getStepIcon(step.icon)
                            )}
                        </div>
                        <span className="businesses-add__step-label">
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className="businesses-add__error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Form Content */}
            <div className="businesses-add__content">
                <form className="businesses-add__form">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('businesses.add.steps.basic_info')}
                            </h2>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-name">
                                    {t('businesses.add.fields.name')} *
                                </label>
                                <input
                                    type="text"
                                    id="business-name"
                                    className={`form-input ${formErrors.name ? 'form-input--error' : ''}`}
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.name')}
                                    maxLength={200}
                                />
                                {formErrors.name && (
                                    <span className="form-error">{formErrors.name}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-description">
                                    {t('businesses.add.fields.description')}
                                </label>
                                <textarea
                                    id="business-description"
                                    className={`form-textarea ${formErrors.description ? 'form-input--error' : ''}`}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.description')}
                                    rows={4}
                                    maxLength={2000}
                                />
                                {formErrors.description && (
                                    <span className="form-error">{formErrors.description}</span>
                                )}
                                <span className="form-hint">
                                    {formData.description.length}/2000 {t('common.characters')}
                                </span>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-status">
                                    {t('businesses.add.fields.status')}
                                </label>
                                <select
                                    id="business-status"
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
                                >
                                    <option value={0}>{t('businesses.status.draft')}</option>
                                    <option value={1}>{t('businesses.status.published')}</option>
                                    <option value={2}>{t('businesses.status.archived')}</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Information */}
                    {currentStep === 2 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('businesses.add.steps.contact_info')}
                            </h2>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-phone">
                                    {t('businesses.add.fields.phone')}
                                </label>
                                <input
                                    type="tel"
                                    id="business-phone"
                                    className={`form-input ${formErrors.phone ? 'form-input--error' : ''}`}
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.phone')}
                                    maxLength={20}
                                />
                                {formErrors.phone && (
                                    <span className="form-error">{formErrors.phone}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-email">
                                    {t('businesses.add.fields.email')}
                                </label>
                                <input
                                    type="email"
                                    id="business-email"
                                    className={`form-input ${formErrors.email ? 'form-input--error' : ''}`}
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.email')}
                                    maxLength={255}
                                />
                                {formErrors.email && (
                                    <span className="form-error">{formErrors.email}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-whatsapp">
                                    {t('businesses.add.fields.whatsapp')}
                                </label>
                                <input
                                    type="tel"
                                    id="business-whatsapp"
                                    className="form-input"
                                    value={formData.whatsApp}
                                    onChange={(e) => handleInputChange('whatsApp', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.whatsapp')}
                                    maxLength={50}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-instagram">
                                    {t('businesses.add.fields.instagram')}
                                </label>
                                <input
                                    type="text"
                                    id="business-instagram"
                                    className="form-input"
                                    value={formData.instagram}
                                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.instagram')}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-facebook">
                                    {t('businesses.add.fields.facebook')}
                                </label>
                                <input
                                    type="text"
                                    id="business-facebook"
                                    className="form-input"
                                    value={formData.facebook}
                                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.facebook')}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-website">
                                    {t('businesses.add.fields.website')}
                                </label>
                                <input
                                    type="url"
                                    id="business-website"
                                    className={`form-input ${formErrors.website ? 'form-input--error' : ''}`}
                                    value={formData.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.website')}
                                    maxLength={500}
                                />
                                {formErrors.website && (
                                    <span className="form-error">{formErrors.website}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Location */}
                    {currentStep === 3 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('businesses.add.steps.location')}
                            </h2>

                            <div className="form-group">
                                <label className="form-label" htmlFor="business-address">
                                    {t('businesses.add.fields.address')}
                                </label>
                                <textarea
                                    id="business-address"
                                    ref={addressInputRef}
                                    className={`form-textarea ${formErrors.address ? 'form-input--error' : ''}`}
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder={t('businesses.add.placeholders.address')}
                                    rows={3}
                                    maxLength={500}
                                />
                                {formErrors.address && (
                                    <span className="form-error">{formErrors.address}</span>
                                )}
                                <span className="form-hint">
                                    {formData.address.length}/500 {t('common.characters')}
                                </span>
                            </div>

                            {/* Location Controls */}
                            <div className="location-controls">
                                <button
                                    type="button"
                                    className="location-btn location-btn--current"
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? (
                                        <div className="location-btn__spinner">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z" />
                                        </svg>
                                    )}
                                    {t('businesses.add.location.get_current')}
                                </button>

                                <button
                                    type="button"
                                    className={`location-btn location-btn--picker ${locationPickerMode ? 'location-btn--active' : ''
                                        }`}
                                    onClick={() => setLocationPickerMode(!locationPickerMode)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22S19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5C10.62,11.5 9.5,10.38 9.5,9S10.62,6.5 12,6.5 14.5,7.62 14.5,9 13.38,11.5 12,11.5Z" />
                                    </svg>
                                    {locationPickerMode
                                        ? t('businesses.add.location.exit_picker')
                                        : t('businesses.add.location.pick_on_map')
                                    }
                                </button>
                            </div>

                            {/* Coordinates Display */}
                            <div className="coordinates-display">
                                <div className="coordinates-input">
                                    <label>{t('businesses.add.fields.latitude')}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                                        className="form-input form-input--small"
                                    />
                                </div>
                                <div className="coordinates-input">
                                    <label>{t('businesses.add.fields.longitude')}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                                        className="form-input form-input--small"
                                    />
                                </div>
                            </div>

                            {/* Map */}
                            <div className="map-section">
                                <div className="map-container">
                                    {locationPickerMode && (
                                        <div className="map-instructions">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
                                            </svg>
                                            {t('businesses.add.location.map_instructions')}
                                        </div>
                                    )}

                                    <MapContainer
                                        center={[formData.latitude, formData.longitude]}
                                        zoom={15}
                                        className="leaflet-map"
                                        scrollWheelZoom={!isMobile}
                                        touchZoom={true}
                                        doubleClickZoom={false}
                                        style={{ height: '300px', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />

                                        {locationPickerMode ? (
                                            <LocationPicker
                                                position={[formData.latitude, formData.longitude]}
                                                onLocationSelect={handleLocationSelect}
                                            />
                                        ) : (
                                            <Marker position={[formData.latitude, formData.longitude]} />
                                        )}
                                    </MapContainer>
                                </div>
                            </div>

                            {formErrors.location && (
                                <span className="form-error">{formErrors.location}</span>
                            )}
                        </div>
                    )}

                    {/* Step 4: Media & Tags */}
                    {currentStep === 4 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('businesses.add.steps.media_tags')}
                            </h2>

                            {/* Image Upload */}
                            <div className="form-group">
                                <label className="form-label">
                                    {t('businesses.add.fields.image')}
                                </label>
                                <div className="file-upload">
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload('imageFile', e.target.files[0])}
                                        className="file-upload__input"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" className="file-upload__label">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,7V4H5V7H19M21,2A2,2 0 0,1 23,4V20A2,2 0 0,1 21,22H3A2,2 0 0,1 1,20V4A2,2 0 0,1 3,2H21M21,20V8H3V20H21M13.96,12.71L11.21,15.46L9.25,13.5L5.5,17.25H18.5L13.96,12.71Z" />
                                        </svg>
                                        {t('businesses.add.upload.choose_image')}
                                    </label>

                                    {imagePreview && (
                                        <div className="file-upload__preview">
                                            <img src={imagePreview} alt={t('businesses.add.upload.image_preview')} />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('imageFile')}
                                                className="file-upload__remove"
                                                aria-label={t('common.remove')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {formErrors.imageFile && (
                                        <span className="form-error">{formErrors.imageFile}</span>
                                    )}
                                </div>
                                <div className="file-upload__info">
                                    {t('businesses.add.upload.image_info')}
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="form-group">
                                <label className="form-label">
                                    {t('businesses.add.fields.logo')}
                                </label>
                                <div className="file-upload">
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload('logoFile', e.target.files[0])}
                                        className="file-upload__input"
                                        id="logo-upload"
                                    />
                                    <label htmlFor="logo-upload" className="file-upload__label">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12,2A3,3 0 0,1 15,5V7A3,3 0 0,1 12,10A3,3 0 0,1 9,7V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7A1,1 0 0,0 12,8A1,1 0 0,0 13,7V5A1,1 0 0,0 12,4M21,12V14A2,2 0 0,1 19,16H17V20A2,2 0 0,1 15,22H9A2,2 0 0,1 7,20V16H5A2,2 0 0,1 3,14V12A2,2 0 0,1 5,10H7A2,2 0 0,1 9,12H15A2,2 0 0,1 17,10H19A2,2 0 0,1 21,12Z" />
                                        </svg>
                                        {t('businesses.add.upload.choose_logo')}
                                    </label>

                                    {logoPreview && (
                                        <div className="file-upload__preview">
                                            <img src={logoPreview} alt={t('businesses.add.upload.logo_preview')} />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('logoFile')}
                                                className="file-upload__remove"
                                                aria-label={t('common.remove')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {formErrors.logoFile && (
                                        <span className="form-error">{formErrors.logoFile}</span>
                                    )}
                                </div>
                                <div className="file-upload__info">
                                    {t('businesses.add.upload.logo_info')}
                                </div>
                            </div>

                            {/* Tags Selection */}
                            <div className="form-group">
                                <label className="form-label">
                                    {t('businesses.add.fields.tags')}
                                </label>
                                <div className="tags-grid">
                                    {tags.map((tag) => {
                                        const isSelected = formData.selectedTags.includes(tag.id);
                                        const apiBaseUrl = import.meta.env.VITE_API_URL + '/' || '';

                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className={`tag-item ${isSelected ? 'tag-item--selected' : ''}`}
                                                onClick={() => toggleTag(tag.id)}
                                            >
                                                {tag.iconPath ? (
                                                    <img
                                                        src={apiBaseUrl + tag.iconPath}
                                                        alt={tag.name}
                                                        className="tag-item__icon"
                                                    />
                                                ) : (
                                                    <div className="tag-item__icon tag-item__icon--default">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className="tag-item__name">{tag.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {tags.length === 0 && (
                                    <div className="tags-empty">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
                                        </svg>
                                        <p>{t('businesses.add.tags.no_tags_available')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Navigation */}
            <div className="businesses-add__navigation">
                {currentStep > 1 && (
                    <button
                        type="button"
                        className="businesses-add__btn businesses-add__btn--secondary"
                        onClick={prevStep}
                        disabled={loading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                        </svg>
                        {t('common.previous')}
                    </button>
                )}

                <div className="businesses-add__step-info">
                    {t('common.step')} {currentStep} {t('common.of')} {totalSteps}
                </div>

                {currentStep < totalSteps ? (
                    <button
                        type="button"
                        className="businesses-add__btn businesses-add__btn--primary"
                        onClick={nextStep}
                        disabled={loading}
                    >
                        {t('common.next')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                        </svg>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="businesses-add__btn businesses-add__btn--primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="btn-spinner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                                </svg>
                            </div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                            </svg>
                        )}
                        {loading ? t('common.creating') : t('businesses.add.create_business')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default BusinessesAdd;