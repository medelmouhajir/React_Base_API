import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { tourService } from '../../../../services/tourService';
import './ToursAdd.css';

const ToursAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageFile: null
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('tours.add.validation.name_required');
        } else if (formData.name.length > 200) {
            newErrors.name = t('tours.add.validation.name_too_long');
        }

        if (formData.description && formData.description.length > 2000) {
            newErrors.description = t('tours.add.validation.description_too_long');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({
                ...prev,
                image: t('tours.add.validation.invalid_image_type')
            }));
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                image: t('tours.add.validation.image_too_large')
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            imageFile: file
        }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Clear image errors
        if (errors.image) {
            setErrors(prev => ({
                ...prev,
                image: ''
            }));
        }
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    // Handle drag and drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            imageFile: null
        }));
        setImagePreview(null);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!user?.id) {
            setErrors({ general: t('tours.add.validation.not_authenticated') });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const tourData = {
                name: formData.name.trim(),
                description: formData.description?.trim() || '',
                ownerId: user.id,
                imageFile: formData.imageFile
            };

            const response = await tourService.create(tourData);

            if (response.success) {
                // Navigate to tour details or list
                navigate(`/myspace/tours/${response.data.id}`, {
                    state: { message: t('tours.add.success_message') }
                });
            } else {
                setErrors({ general: response.message || t('tours.add.error.general') });
            }
        } catch (error) {
            console.error('Failed to create tour:', error);
            setErrors({
                general: error.message || t('tours.add.error.general')
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="tours-add">
            <div className="tours-add__container">
                {/* Header */}
                <div className="tours-add__header">
                    <h1 className="tours-add__title">
                        {t('tours.add.title')}
                    </h1>
                    <p className="tours-add__subtitle">
                        {t('tours.add.subtitle')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="tours-add__form">
                    {/* General Error */}
                    {errors.general && (
                        <div className="tours-add__error tours-add__error--general">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                            </svg>
                            {errors.general}
                        </div>
                    )}

                    {/* Tour Name */}
                    <div className="tours-add__field">
                        <label htmlFor="tour-name" className="tours-add__label">
                            {t('tours.add.fields.name.label')}
                            <span className="tours-add__required">*</span>
                        </label>
                        <input
                            id="tour-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t('tours.add.fields.name.placeholder')}
                            className={`tours-add__input ${errors.name ? 'tours-add__input--error' : ''}`}
                            maxLength={200}
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <div className="tours-add__error">
                                {errors.name}
                            </div>
                        )}
                        <div className="tours-add__hint">
                            {formData.name.length}/200 {t('tours.add.fields.name.hint')}
                        </div>
                    </div>

                    {/* Tour Description */}
                    <div className="tours-add__field">
                        <label htmlFor="tour-description" className="tours-add__label">
                            {t('tours.add.fields.description.label')}
                        </label>
                        <textarea
                            id="tour-description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={t('tours.add.fields.description.placeholder')}
                            className={`tours-add__textarea ${errors.description ? 'tours-add__textarea--error' : ''}`}
                            rows={4}
                            maxLength={2000}
                            disabled={isLoading}
                        />
                        {errors.description && (
                            <div className="tours-add__error">
                                {errors.description}
                            </div>
                        )}
                        <div className="tours-add__hint">
                            {formData.description.length}/2000 {t('tours.add.fields.description.hint')}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="tours-add__field">
                        <label className="tours-add__label">
                            {t('tours.add.fields.image.label')}
                        </label>

                        {!imagePreview ? (
                            <div
                                className={`tours-add__dropzone ${dragActive ? 'tours-add__dropzone--active' : ''} ${errors.image ? 'tours-add__dropzone--error' : ''}`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="tours-add__dropzone-content">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                    <h3 className="tours-add__dropzone-title">
                                        {t('tours.add.fields.image.dropzone.title')}
                                    </h3>
                                    <p className="tours-add__dropzone-subtitle">
                                        {t('tours.add.fields.image.dropzone.subtitle')}
                                    </p>
                                    <button type="button" className="tours-add__dropzone-button">
                                        {t('tours.add.fields.image.dropzone.button')}
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="tours-add__file-input"
                                    disabled={isLoading}
                                />
                            </div>
                        ) : (
                            <div className="tours-add__image-preview">
                                <img
                                    src={imagePreview}
                                    alt={t('tours.add.fields.image.preview_alt')}
                                    className="tours-add__preview-image"
                                />
                                <div className="tours-add__preview-overlay">
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="tours-add__remove-image"
                                        disabled={isLoading}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                        </svg>
                                        {t('tours.add.fields.image.remove')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="tours-add__change-image"
                                        disabled={isLoading}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" />
                                        </svg>
                                        {t('tours.add.fields.image.change')}
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="tours-add__file-input"
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {errors.image && (
                            <div className="tours-add__error">
                                {errors.image}
                            </div>
                        )}

                        <div className="tours-add__hint">
                            {t('tours.add.fields.image.hint')}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="tours-add__actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="tours-add__button tours-add__button--secondary"
                            disabled={isLoading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="tours-add__button tours-add__button--primary"
                            disabled={isLoading || !formData.name.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="tours-add__spinner" width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                                    </svg>
                                    {t('tours.add.creating')}
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                    </svg>
                                    {t('tours.add.create_button')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ToursAdd;