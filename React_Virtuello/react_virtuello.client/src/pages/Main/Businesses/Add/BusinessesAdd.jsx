import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import businessService from '../../../../services/businessService';
import './BusinessesAdd.css';

const BusinessesAdd = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Form state matching CreateBusinessDto
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 0, // Draft by default
        phone: '',
        email: '',
        whatsApp: '',
        instagram: '',
        facebook: '',
        website: '',
        ownerId: user?.id || '',
        latitude: 0,
        longitude: 0,
        address: '',
        imageFile: null,
        logoFile: null
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [imagePreview, setImagePreview] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    // Initialize ownerId when user is available
    useEffect(() => {
        if (user?.id && !formData.ownerId) {
            setFormData(prev => ({ ...prev, ownerId: user.id }));
        }
    }, [user]);

    // Clear messages when form data changes
    useEffect(() => {
        if (generalError || successMessage) {
            setGeneralError('');
            setSuccessMessage('');
        }
        // Clear field-specific errors when user starts typing
        Object.keys(errors).forEach(field => {
            if (errors[field] && formData[field]) {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        });
    }, [formData]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                // Validate file
                if (!isValidImageFile(file)) {
                    setErrors(prev => ({
                        ...prev,
                        [name]: t('business.validation.invalidImageFile')
                    }));
                    return;
                }

                setFormData(prev => ({ ...prev, [name]: file }));

                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (name === 'imageFile') {
                        setImagePreview(e.target.result);
                    } else if (name === 'logoFile') {
                        setLogoPreview(e.target.result);
                    }
                };
                reader.readAsDataURL(file);

                // Clear any previous error
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
            }));
        }
    };

    // Validate image file
    const isValidImageFile = (file) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            return false;
        }

        if (file.size > maxSize) {
            return false;
        }

        return true;
    };


    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrors(prev => ({ ...prev, location: t('business.validation.geolocationNotSupported') }));
            return;
        }

        setLocationLoading(true);

        const success = (position) => {
            setFormData(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }));
            setLocationLoading(false);
            setErrors(prev => ({ ...prev, location: '' }));
        };

        const fail = (error) => {
            // If it timed out or was unavailable, retry once with more relaxed settings
            if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                navigator.geolocation.getCurrentPosition(
                    success,
                    (err2) => {
                        setLocationLoading(false);
                        const msg =
                            err2.code === err2.PERMISSION_DENIED ? t('business.validation.locationPermissionDenied') :
                                err2.code === err2.POSITION_UNAVAILABLE ? t('business.validation.locationUnavailable') :
                                    err2.code === err2.TIMEOUT ? t('business.validation.locationTimeout') :
                                        t('business.validation.locationError');
                        setErrors(prev => ({ ...prev, location: msg }));
                    },
                    {
                        enableHighAccuracy: false,   // prefer a quick coarse fix
                        timeout: 60000,              // give it more time
                        maximumAge: 600000           // accept cached (up to 10 min)
                    }
                );
                return;
            }

            setLocationLoading(false);
            const msg =
                error.code === error.PERMISSION_DENIED ? t('business.validation.locationPermissionDenied') :
                    error.code === error.POSITION_UNAVAILABLE ? t('business.validation.locationUnavailable') :
                        error.code === error.TIMEOUT ? t('business.validation.locationTimeout') :
                            t('business.validation.locationError');
            setErrors(prev => ({ ...prev, location: msg }));
        };

        // First attempt: quick/coarse
        navigator.geolocation.getCurrentPosition(
            success,
            fail,
            {
                enableHighAccuracy: false,  // don’t force precise on laptops
                timeout: 20000,             // short try for a quick win
                maximumAge: 300000          // up to 5 min cached OK
            }
        );
    };


    // Form validation
    const validateForm = () => {
        const newErrors = {};

        // Step 1 validation - Basic Info
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                newErrors.name = t('business.validation.nameRequired');
            } else if (formData.name.trim().length < 2) {
                newErrors.name = t('business.validation.nameMinLength');
            } else if (formData.name.trim().length > 200) {
                newErrors.name = t('business.validation.nameMaxLength');
            }

            if (formData.description && formData.description.length > 2000) {
                newErrors.description = t('business.validation.descriptionMaxLength');
            }
        }

        // Step 2 validation - Contact Info
        if (currentStep === 2) {
            if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
                newErrors.phone = t('business.validation.phoneInvalid');
            }

            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = t('business.validation.emailInvalid');
            }

            if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
                newErrors.website = t('business.validation.websiteInvalid');
            }
        }

        // Step 3 validation - Location
        if (currentStep === 3) {
            if (!formData.address.trim()) {
                newErrors.address = t('business.validation.addressRequired');
            }

            if (formData.latitude === 0 && formData.longitude === 0) {
                newErrors.location = t('business.validation.locationRequired');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle next step
    const handleNext = () => {
        if (validateForm()) {
            if (currentStep === 3) {
                // If last step before submission, go to final step and submit
                setCurrentStep(4);
            } else {
                setCurrentStep(prev => Math.min(prev + 1, 4));
            }
        }
    };

    // Handle previous step
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Only submit if we're on the last step
        if (currentStep !== 4) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setGeneralError('');

        try {
            const result = await businessService.create(formData);

            if (result.success) {
                setSuccessMessage(t('business.messages.createSuccess'));
                // Redirect to business detail or list after a delay
                setTimeout(() => {
                    navigate('/myspace/businesses', {
                        state: { message: t('business.messages.createSuccess') }
                    });
                }, 2000);
            } else {
                setGeneralError(result.message || t('business.messages.createError'));
            }
        } catch (error) {
            setGeneralError(error.message || t('business.messages.createError'));
        } finally {
            setLoading(false);
        }
    };

    const handleFormKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (currentStep < 4) {
                e.preventDefault();     // stop implicit submit
                handleNext();           // optional: treat Enter as "Next"
            }
            // if step 4, let it submit normally
        }
    };

    // Remove file
    const removeFile = (type) => {
        if (type === 'image') {
            setFormData(prev => ({ ...prev, imageFile: null }));
            setImagePreview(null);
        } else if (type === 'logo') {
            setFormData(prev => ({ ...prev, logoFile: null }));
            setLogoPreview(null);
        }
    };

    // Business status options
    const statusOptions = [
        { value: 0, label: t('business.status.draft') },
        { value: 1, label: t('business.status.active') },
        { value: 2, label: t('business.status.inactive') },
        { value: 3, label: t('business.status.pending') }
    ];

    return (
        <div className="businesses-add">
            <div className="businesses-add__container">
                {/* Header */}
                <div className="businesses-add__header">
                    <button
                        className="businesses-add__back-btn"
                        onClick={() => navigate(-1)}
                        aria-label={t('common.back')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <div className="businesses-add__header-content">
                        <h1 className="businesses-add__title">{t('business.add.title')}</h1>
                        <p className="businesses-add__subtitle">{t('business.add.subtitle')}</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="businesses-add__steps">
                    {[1, 2, 3, 4].map((step) => (
                        <div
                            key={step}
                            className={`businesses-add__step ${step === currentStep ? 'active' :
                                    step < currentStep ? 'completed' : ''
                                }`}
                        >
                            <div className="businesses-add__step-number">
                                {step < currentStep ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                ) : (
                                    step
                                )}
                            </div>
                            <span className="businesses-add__step-label">
                                {t(`business.add.step${step}.title`)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Messages */}
                {generalError && (
                    <div className="businesses-add__error" role="alert">
                        {generalError}
                    </div>
                )}

                {successMessage && (
                    <div className="businesses-add__success" role="alert">
                        {successMessage}
                    </div>
                )}

                {/* Form */}
                <form
                    className="businesses-add__form"
                    onSubmit={(e) => e.preventDefault()}   // kill browser submit
                    onKeyDown={(e) => {                     // kill Enter anywhere
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                >
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('business.add.step1.title')}
                            </h2>
                            <p className="businesses-add__step-description">
                                {t('business.add.step1.description')}
                            </p>

                            <div className="form-group">
                                <label htmlFor="name" className="form-label required">
                                    {t('business.fields.name')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                    placeholder={t('business.placeholders.name')}
                                    required
                                    maxLength="200"
                                    aria-describedby={errors.name ? 'name-error' : undefined}
                                />
                                {errors.name && (
                                    <div id="name-error" className="error-message" role="alert">
                                        {errors.name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description" className="form-label">
                                    {t('business.fields.description')} ({t('common.optional')})
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
                                    placeholder={t('business.placeholders.description')}
                                    rows="4"
                                    maxLength="2000"
                                    aria-describedby={errors.description ? 'description-error' : undefined}
                                />
                                {errors.description && (
                                    <div id="description-error" className="error-message" role="alert">
                                        {errors.description}
                                    </div>
                                )}
                                <div className="form-hint">
                                    {formData.description.length}/2000 {t('common.characters')}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status" className="form-label">
                                    {t('business.fields.status')}
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="form-input form-select"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Information */}
                    {currentStep === 2 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('business.add.step2.title')}
                            </h2>
                            <p className="businesses-add__step-description">
                                {t('business.add.step2.description')}
                            </p>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="phone" className="form-label">
                                        {t('business.fields.phone')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`form-input ${errors.phone ? 'error' : ''}`}
                                        placeholder={t('business.placeholders.phone')}
                                        maxLength="20"
                                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                                    />
                                    {errors.phone && (
                                        <div id="phone-error" className="error-message" role="alert">
                                            {errors.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">
                                        {t('business.fields.email')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`form-input ${errors.email ? 'error' : ''}`}
                                        placeholder={t('business.placeholders.email')}
                                        maxLength="255"
                                        aria-describedby={errors.email ? 'email-error' : undefined}
                                    />
                                    {errors.email && (
                                        <div id="email-error" className="error-message" role="alert">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="whatsApp" className="form-label">
                                        {t('business.fields.whatsApp')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="tel"
                                        id="whatsApp"
                                        name="whatsApp"
                                        value={formData.whatsApp}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder={t('business.placeholders.whatsApp')}
                                        maxLength="50"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="website" className="form-label">
                                        {t('business.fields.website')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="url"
                                        id="website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className={`form-input ${errors.website ? 'error' : ''}`}
                                        placeholder={t('business.placeholders.website')}
                                        maxLength="500"
                                        aria-describedby={errors.website ? 'website-error' : undefined}
                                    />
                                    {errors.website && (
                                        <div id="website-error" className="error-message" role="alert">
                                            {errors.website}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="instagram" className="form-label">
                                        {t('business.fields.instagram')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="text"
                                        id="instagram"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder={t('business.placeholders.instagram')}
                                        maxLength="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="facebook" className="form-label">
                                        {t('business.fields.facebook')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="text"
                                        id="facebook"
                                        name="facebook"
                                        value={formData.facebook}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder={t('business.placeholders.facebook')}
                                        maxLength="100"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Location */}
                    {currentStep === 3 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('business.add.step3.title')}
                            </h2>
                            <p className="businesses-add__step-description">
                                {t('business.add.step3.description')}
                            </p>

                            <div className="form-group">
                                <label htmlFor="address" className="form-label required">
                                    {t('business.fields.address')}
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={`form-input form-textarea ${errors.address ? 'error' : ''}`}
                                    placeholder={t('business.placeholders.address')}
                                    rows="3"
                                    maxLength="500"
                                    required
                                    aria-describedby={errors.address ? 'address-error' : undefined}
                                />
                                {errors.address && (
                                    <div id="address-error" className="error-message" role="alert">
                                        {errors.address}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    {t('business.fields.coordinates')}
                                </label>
                                <div className="coordinates-input">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="latitude" className="form-label-small">
                                                {t('business.fields.latitude')}
                                            </label>
                                            <input
                                                type="number"
                                                id="latitude"
                                                name="latitude"
                                                value={formData.latitude}
                                                onChange={handleChange}
                                                className="form-input"
                                                step="any"
                                                min="-90"
                                                max="90"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="longitude" className="form-label-small">
                                                {t('business.fields.longitude')}
                                            </label>
                                            <input
                                                type="number"
                                                id="longitude"
                                                name="longitude"
                                                value={formData.longitude}
                                                onChange={handleChange}
                                                className="form-input"
                                                step="any"
                                                min="-180"
                                                max="180"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={locationLoading}
                                        className="location-btn"
                                    >
                                        {locationLoading ? (
                                            <>
                                                <svg className="location-btn__spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                                                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                                    </circle>
                                                </svg>
                                                {t('business.actions.gettingLocation')}
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                {t('business.actions.getCurrentLocation')}
                                            </>
                                        )}
                                    </button>

                                    {errors.location && (
                                        <div className="error-message" role="alert">
                                            {errors.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Media Upload */}
                    {currentStep === 4 && (
                        <div className="businesses-add__step-content">
                            <h2 className="businesses-add__step-title">
                                {t('business.add.step4.title')}
                            </h2>
                            <p className="businesses-add__step-description">
                                {t('business.add.step4.description')}
                            </p>

                            <div className="form-row">
                                {/* Business Image */}
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('business.fields.image')} ({t('common.optional')})
                                    </label>
                                    <div className="file-upload">
                                        <input
                                            type="file"
                                            id="imageFile"
                                            name="imageFile"
                                            onChange={handleChange}
                                            className="file-upload__input"
                                            accept="image/*"
                                            aria-describedby={errors.imageFile ? 'imageFile-error' : undefined}
                                        />
                                        <div
                                            className="file-upload__label"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.getElementById('imageFile').click();
                                            }}
                                        >
                                            {imagePreview ? (
                                                <div className="file-upload__preview">
                                                    <img src={imagePreview} alt={t('business.fields.image')} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile('image')}
                                                        className="file-upload__remove"
                                                        aria-label={t('business.actions.removeImage')}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="file-upload__placeholder">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                                    </svg>
                                                    <span>{t('business.placeholders.uploadImage')}</span>
                                                </div>
                                            )}
                                        </div>
                                        {errors.imageFile && (
                                            <div id="imageFile-error" className="error-message" role="alert">
                                                {errors.imageFile}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Business Logo */}
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('business.fields.logo')} ({t('common.optional')})
                                    </label>
                                    <div className="file-upload">
                                        <input
                                            type="file"
                                            id="logoFile"
                                            name="logoFile"
                                            onChange={handleChange}
                                            className="file-upload__input"
                                            accept="image/*"
                                            aria-describedby={errors.logoFile ? 'logoFile-error' : undefined}
                                        />
                                        <div
                                            className="file-upload__label file-upload__label--logo"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.getElementById('logoFile').click();
                                            }}
                                        >
                                            {logoPreview ? (
                                                <div className="file-upload__preview file-upload__preview--logo">
                                                    <img src={logoPreview} alt={t('business.fields.logo')} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile('logo')}
                                                        className="file-upload__remove"
                                                        aria-label={t('business.actions.removeLogo')}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="file-upload__placeholder">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <span>{t('business.placeholders.uploadLogo')}</span>
                                                </div>
                                            )}
                                        </div>
                                        {errors.logoFile && (
                                            <div id="logoFile-error" className="error-message" role="alert">
                                                {errors.logoFile}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="file-upload__info">
                                <h4>{t('business.upload.requirements')}</h4>
                                <ul>
                                    <li>{t('business.upload.formats')}</li>
                                    <li>{t('business.upload.maxSize')}</li>
                                    <li>{t('business.upload.recommendations')}</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="businesses-add__navigation">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="businesses-add__btn businesses-add__btn--secondary"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                </svg>
                                {t('common.previous')}
                            </button>
                        )}

                        <div className="businesses-add__navigation-spacer" />

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="businesses-add__btn businesses-add__btn--primary"
                            >
                                {t('common.next')} …
                            </button>
                        ) : (
                            <button
                                type="button"                          // <-- was "submit"
                                onClick={handleSubmit}                 // <-- call it yourself
                                disabled={loading}
                                className="businesses-add__btn businesses-add__btn--primary businesses-add__btn--submit"
                            >
                                … {t('business.actions.createBusiness')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessesAdd;