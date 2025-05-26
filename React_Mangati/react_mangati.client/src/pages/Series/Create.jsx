// src/pages/Series/Create.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Serie_Status, SerieStatusLabels } from '../../utils/enums';
import serieService from '../../services/serieService';
import filtersService from '../../services/filtersService';
import { useAuth } from '../../contexts/AuthContext';
import './Create.css';

const CreateSerie = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        status: Serie_Status.Ongoing,
        languages: [],
        tags: []
    });

    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(true);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                setLoadingFilters(true);
                const [languagesRes, tagsRes] = await Promise.all([
                    filtersService.getLanguages(),
                    filtersService.getTags()
                ]);

                setLanguages(languagesRes.data || []);
                setTags(tagsRes.data || []);
            } catch (err) {
                console.error('Error loading filters:', err);
                toast.error(t('common.errors.loadingFilters'));
            } finally {
                setLoadingFilters(false);
            }
        };

        loadFilters();
    }, [t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleLanguageChange = (e) => {
        const languageId = parseInt(e.target.value);
        setSelectedLanguages(prev => {
            if (e.target.checked) {
                return [...prev, languageId];
            } else {
                return prev.filter(id => id !== languageId);
            }
        });
    };

    const handleTagChange = (e) => {
        const tagId = parseInt(e.target.value);
        setSelectedTags(prev => {
            if (e.target.checked) {
                return [...prev, tagId];
            } else {
                return prev.filter(id => id !== tagId);
            }
        });
    };

    const handleRemoveImage = () => {
        setCoverImage(null);
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare final form data including selected languages and tags
            const finalFormData = {
                ...formData,
                languages: selectedLanguages,
                tags: selectedTags
            };

            if (!coverImage) {
                toast.warn(t('series.create.noCover'));
                setLoading(false);
                return;
            }

            const serieData = { ...finalFormData, coverImage };
            await serieService.create(serieData);

            toast.success(t('series.create.success'));
            navigate('/series');
        } catch (err) {
            console.error('Error creating serie:', err);
            toast.error(t('series.create.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="serie-create-container">
            <div className="serie-create-header">
                <h1>{t('series.create.title')}</h1>
                <p className="subtitle">{t('series.create.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="serie-form">
                <div className="form-layout">
                    <div className="form-main">
                        <div className="form-group">
                            <label htmlFor="title">{t('series.fields.title')} <span className="required">*</span></label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder={t('series.placeholders.title')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="synopsis">{t('series.fields.synopsis')}</label>
                            <textarea
                                id="synopsis"
                                name="synopsis"
                                value={formData.synopsis}
                                onChange={handleChange}
                                placeholder={t('series.placeholders.synopsis')}
                                rows={6}
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">{t('series.fields.status')}</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {Object.entries(SerieStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{t(`series.status.${label.toLowerCase()}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-sidebar">
                        <div className="cover-upload-section">
                            <label>{t('series.fields.coverImage')} <span className="required">*</span></label>

                            <div className="cover-preview-container">
                                {coverPreview ? (
                                    <div className="cover-preview-wrapper">
                                        <img src={coverPreview} alt="Cover preview" className="cover-preview" />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={handleRemoveImage}
                                            title={t('common.actions.remove')}
                                        >
                                            <span>×</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cover-placeholder" onClick={triggerFileInput}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{t('series.create.addCover')}</span>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />

                            <button
                                type="button"
                                className="upload-btn"
                                onClick={triggerFileInput}
                            >
                                {coverPreview ? t('series.create.changeCover') : t('series.create.selectCover')}
                            </button>
                        </div>

                        <div className="filters-section">
                            <div className="form-group languages-group">
                                <label className="filter-label">{t('series.fields.languages')}</label>
                                {loadingFilters ? (
                                    <div className="loading-filters">{t('common.loading')}</div>
                                ) : (
                                    <div className="checkboxes-container">
                                        {languages.map(language => (
                                            <label key={language.id} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={language.id}
                                                    checked={selectedLanguages.includes(language.id)}
                                                    onChange={handleLanguageChange}
                                                />
                                                <span>{language.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-group tags-group">
                                <label className="filter-label">{t('series.fields.tags')}</label>
                                {loadingFilters ? (
                                    <div className="loading-filters">{t('common.loading')}</div>
                                ) : (
                                    <div className="tags-container">
                                        {tags.map(tag => (
                                            <label key={tag.tagId} className="tag-checkbox">
                                                <input
                                                    type="checkbox"
                                                    value={tag.tagId}
                                                    checked={selectedTags.includes(tag.tagId)}
                                                    onChange={handleTagChange}
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

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => navigate('/series')}
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading || !formData.title || !coverImage}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {t('common.loading')}
                            </>
                        ) : (
                            t('series.create.submit')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSerie;