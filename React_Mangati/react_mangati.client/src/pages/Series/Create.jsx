import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { serieService } from '../../services/serieService';
import filtersService from '../../services/filtersService';
import { Serie_Status, SerieStatusLabels } from '../../utils/enums';
import './Create.css';

const Create = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        status: Serie_Status.Ongoing,
        coverImage: null,
        languageIds: [],
        tagIds: []
    });

    // UI state
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Load languages and tags on mount
    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            setLoadingFilters(true);
            const [langResponse, tagResponse] = await Promise.all([
                filtersService.getLanguages(),
                filtersService.getTags()
            ]);
            setLanguages(langResponse.data || []);
            setTags(tagResponse.data || []);
        } catch (error) {
            console.error('Error loading filters:', error);
            toast.error(t('create.errors.loadingFilters'));
        } finally {
            setLoadingFilters(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({
            ...prev,
            status: parseInt(e.target.value)
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error(t('create.errors.imageTooLarge'));
                return;
            }

            setFormData(prev => ({
                ...prev,
                coverImage: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            coverImage: null
        }));
        setImagePreview(null);
    };

    const handleLanguageToggle = (languageId) => {
        setFormData(prev => ({
            ...prev,
            languageIds: prev.languageIds.includes(languageId)
                ? prev.languageIds.filter(id => id !== languageId)
                : [...prev.languageIds, languageId]
        }));
    };

    const handleTagToggle = (tagId) => {
        setFormData(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(tagId)
                ? prev.tagIds.filter(id => id !== tagId)
                : [...prev.tagIds, tagId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error(t('create.errors.titleRequired'));
            return;
        }

        if (formData.languageIds.length === 0) {
            toast.error(t('create.errors.languageRequired'));
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await serieService.create(formData);
            toast.success(t('create.success'));
            navigate(`/series/${response.id}`);
        } catch (error) {
            console.error('Error creating serie:', error);
            toast.error(t('create.errors.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="serie-create-container">
            <div className="serie-create-header">
                <h1>{t('create.title')}</h1>
                <p className="subtitle">{t('create.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="serie-form">
                <div className="form-layout">
                    {/* Main form section */}
                    <div className="form-main">
                        <div className="form-group">
                            <label htmlFor="title">
                                {t('create.form.title')}
                                <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder={t('create.form.titlePlaceholder')}
                                maxLength={200}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="synopsis">
                                {t('create.form.synopsis')}
                            </label>
                            <textarea
                                id="synopsis"
                                name="synopsis"
                                value={formData.synopsis}
                                onChange={handleInputChange}
                                placeholder={t('create.form.synopsisPlaceholder')}
                                maxLength={2000}
                                rows={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">
                                {t('create.form.status')}
                                <span className="required">*</span>
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleStatusChange}
                                required
                            >
                                {Object.entries(Serie_Status).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {t(`enums.serieStatus.${key.toLowerCase()}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sidebar section */}
                    <div className="form-sidebar">
                        {/* Cover upload */}
                        <div className="cover-upload-section">
                            <label>{t('create.form.coverImage')}</label>
                            <input
                                type="file"
                                id="coverImage"
                                className="file-input"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <div className="cover-preview-container">
                                {imagePreview ? (
                                    <div className="cover-preview-wrapper">
                                        <img
                                            src={imagePreview}
                                            alt="Cover preview"
                                            className="cover-preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="remove-image-btn"
                                            aria-label={t('create.form.removeImage')}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="coverImage" className="cover-placeholder">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>{t('create.form.uploadImage')}</span>
                                        <span className="text-sm">{t('create.form.imageRequirements')}</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Languages and Tags */}
                        <div className="filters-section">
                            {/* Languages */}
                            <div>
                                <label className="filter-label">
                                    {t('create.form.languages')}
                                    <span className="required">*</span>
                                </label>
                                {loadingFilters ? (
                                    <p className="loading-filters">{t('common.loading')}</p>
                                ) : (
                                    <div className="checkboxes-container">
                                        {languages.map(language => (
                                            <label key={language.id} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.languageIds.includes(language.id)}
                                                    onChange={() => handleLanguageToggle(language.id)}
                                                />
                                                <span>{language.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="filter-label">
                                    {t('create.form.tags')}
                                </label>
                                {loadingFilters ? (
                                    <p className="loading-filters">{t('common.loading')}</p>
                                ) : (
                                    <div className="tags-container">
                                        {tags.map(tag => (
                                            <label key={tag.tagId} className="tag-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tagIds.includes(tag.tagId)}
                                                    onChange={() => handleTagToggle(tag.tagId)}
                                                />
                                                <span className="tag-name">{tag.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/series')}
                        className="cancel-btn"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                {t('common.saving')}
                            </>
                        ) : (
                            t('create.form.submit')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Create;