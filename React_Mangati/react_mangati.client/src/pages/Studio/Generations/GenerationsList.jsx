// src/pages/Studio/Generations/GenerationsList.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import studioAssetsService from '../../../services/studioAssetsService';
import { toast } from 'react-toastify';
import './GenerationsList.css';

const GenerationsList = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const touchStartRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || '';

    // State for data
    const [selectedSerie, setSelectedSerie] = useState(null);
    const [generations, setGenerations] = useState([]);
    const [filteredGenerations, setFilteredGenerations] = useState([]);

    // State for filtering and searching
    const [search, setSearch] = useState('');

    // State for loading and UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionType, setActionType] = useState('');
    const [activeSwipeIndex, setActiveSwipeIndex] = useState(null);

    // Load selected series from localStorage
    useEffect(() => {
        const storedSerie = localStorage.getItem('studioSelectedSerie');
        if (storedSerie) {
            try {
                setSelectedSerie(JSON.parse(storedSerie));
            } catch (error) {
                console.error('Error parsing stored serie:', error);
                setError(t('errors.invalidSerieData'));
            }
        } else {
            setError(t('errors.noSerieSelected'));
        }
    }, [t]);

    // Load generations when serie is selected
    useEffect(() => {
        if (selectedSerie) {
            loadGenerations();
        }
    }, [selectedSerie]);

    // Apply search filter when search or generations change
    useEffect(() => {
        if (!generations.length) return;

        if (!search.trim()) {
            setFilteredGenerations(generations);
            return;
        }

        const filtered = generations.filter(gen =>
            gen.prompt?.toLowerCase().includes(search.toLowerCase())
        );

        setFilteredGenerations(filtered);
    }, [search, generations]);

    const loadGenerations = useCallback(async () => {
        if (!selectedSerie) return;

        try {
            setLoading(true);
            const data = await studioAssetsService.getImagesGenerations(selectedSerie.id);
            setGenerations(data);
            setFilteredGenerations(data);
            setError('');
        } catch (err) {
            console.error('Error fetching generations:', err);
            setError(t('generations.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [selectedSerie, t]);

    const handleRemoveImage = async (id) => {
        try {
            // Implement the removeGeneratedImage method in studioAssetsService if needed
            await studioAssetsService.removeGeneratedImage(id);
            setGenerations(prevGenerations =>
                prevGenerations.filter(gen => gen.id !== id)
            );
            toast.success(t('generations.imageRemoved'));
            setShowModal(false);
        } catch (err) {
            console.error('Error removing image:', err);
            toast.error(t('generations.removeError'));
        }
    };

    const handleRegenerateImage = async (id) => {
        try {
            setLoading(true);
            // Implement the regenerateImage method in studioAssetsService if needed
            await studioAssetsService.regenerateImage(id);
            await loadGenerations();
            toast.success(t('generations.imageRegenerated'));
            setShowModal(false);
        } catch (err) {
            console.error('Error regenerating image:', err);
            toast.error(t('generations.regenerateError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSetAsImage = async (imageId, type) => {
        try {
            setLoading(true);
            if (type === 'character') {
                // Redirect to character selection or implement direct setting
                navigate(`/studio/ai/character?generationId=${imageId}`);
            } else if (type === 'scene') {
                // Implement setAsScenePlaceImage method in studioAssetsService if needed
                await studioAssetsService.setAsScenePlaceImage(imageId);
                toast.success(t('generations.setAsSceneSuccess'));
            }
            setShowModal(false);
        } catch (err) {
            console.error(`Error setting image as ${type}:`, err);
            toast.error(t(`generations.setAs${type.charAt(0).toUpperCase() + type.slice(1)}Error`));
        } finally {
            setLoading(false);
        }
    };

    const openConfirmModal = (image, action) => {
        setSelectedImage(image);
        setActionType(action);
        setShowModal(true);
    };

    // Touch handlers for mobile swipe actions
    const handleTouchStart = (e, index) => {
        touchStartRef.current = e.touches[0].clientX;
        setActiveSwipeIndex(index);
    };

    const handleTouchMove = (e) => {
        if (!touchStartRef.current) return;

        const touchEnd = e.touches[0].clientX;
        const diff = touchStartRef.current - touchEnd;

        // If swipe distance is significant, show action buttons
        if (Math.abs(diff) > 50) {
            // Implementation for swipe actions would go here
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
        setActiveSwipeIndex(null);
    };

    // Create New button click handler
    const handleCreateNew = () => {
        navigate('/studio/text-to-image');
    };

    if (loading && generations.length === 0) {
        return (
            <div className="generations-loading">
                <div className="generations-spinner"></div>
                <p>{t('generations.loading')}</p>
            </div>
        );
    }

    return (
        <div className={`generations-container ${isDarkMode ? 'dark' : 'light'}`}>
            {error && (
                <div className="generations-error-banner">
                    <p>{error}</p>
                    <button
                        className="generations-button generations-button--link"
                        onClick={() => setError(null)}
                    >
                        {t('common.dismiss')}
                    </button>
                </div>
            )}

            <header className="generations-header">
                <h1 className="generations-title">{t('generations.title')}</h1>
                <div className="generations-controls">
                    {loading && generations.length > 0 && (
                        <div className="generations-refreshing">
                            <div className="generations-spinner generations-spinner--small"></div>
                            <span>{t('generations.refreshing')}</span>
                        </div>
                    )}
                    <button
                        className="generations-button generations-button--primary"
                        onClick={handleCreateNew}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="generations-button-icon">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        {t('generations.createNew')}
                    </button>
                </div>
            </header>

            {generations.length > 0 && (
                <div className="generations-search">
                    <div className="generations-search-input-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="generations-search-icon">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            className="generations-search-input"
                            placeholder={t('generations.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                className="generations-search-clear"
                                onClick={() => setSearch('')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {generations.length === 0 && !loading ? (
                <div className="generations-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="generations-empty-icon">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>{t('generations.noGenerations')}</p>
                    <button
                        className="generations-button generations-button--primary"
                        onClick={handleCreateNew}
                    >
                        {t('generations.createFirst')}
                    </button>
                </div>
            ) : (
                <div className="generations-grid">
                    {filteredGenerations.map((gen, index) => (
                        <div
                            key={gen.id}
                            className={`generation-card ${activeSwipeIndex === index ? 'generation-card--active' : ''}`}
                            onTouchStart={(e) => handleTouchStart(e, index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="generation-image">
                                <img
                                    src={`${API_URL}${gen.result_Path}`}
                                    alt={gen.prompt || t('generations.generatedImage')}
                                    loading="lazy"
                                    onClick={() => window.open(`${API_URL}${gen.result_Path}`, '_blank')}
                                />
                            </div>

                            <div className="generation-info">
                                <p className="generation-prompt">{gen.prompt || t('generations.noPrompt')}</p>
                                <p className="generation-date">
                                    {new Date(gen.date_Created).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="generation-actions">
                                <button
                                    className="generation-action-btn generation-action-btn--danger"
                                    onClick={() => openConfirmModal(gen, 'remove')}
                                    title={t('generations.remove')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                        <path d="M10 11v6M14 11v6"></path>
                                    </svg>
                                </button>

                                <div className="generation-action-dropdown">
                                    <button className="generation-action-btn generation-action-btn--more">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="19" cy="12" r="1"></circle>
                                            <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                    </button>

                                    <div className="generation-action-dropdown-menu">
                                        <button
                                            className="generation-action-dropdown-item"
                                            onClick={() => openConfirmModal(gen, 'character')}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            {t('generations.setAsCharacter')}
                                        </button>
                                        <button
                                            className="generation-action-dropdown-item"
                                            onClick={() => openConfirmModal(gen, 'scene')}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                            </svg>
                                            {t('generations.setAsScene')}
                                        </button>
                                        <button
                                            className="generation-action-dropdown-item"
                                            onClick={() => openConfirmModal(gen, 'regenerate')}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 4v6h-6M1 20v-6h6"></path>
                                                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                                            </svg>
                                            {t('generations.regenerate')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation Modal */}
            {showModal && selectedImage && (
                <div className="generations-modal">
                    <div className={`generations-modal-content ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="generations-modal-header">
                            <h2 className="generations-modal-title">
                                {actionType === 'remove' && t('generations.confirmRemove')}
                                {actionType === 'character' && t('generations.confirmSetAsCharacter')}
                                {actionType === 'scene' && t('generations.confirmSetAsScene')}
                                {actionType === 'regenerate' && t('generations.confirmRegenerate')}
                            </h2>
                            <button
                                className="generations-modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="generations-modal-body">
                            <p>
                                {actionType === 'remove' && t('generations.confirmRemoveBody')}
                                {actionType === 'character' && t('generations.confirmSetAsCharacterBody')}
                                {actionType === 'scene' && t('generations.confirmSetAsSceneBody')}
                                {actionType === 'regenerate' && t('generations.confirmRegenerateBody')}
                            </p>
                            <div className="generations-modal-image">
                                <img
                                    src={`${API_URL}${selectedImage.result_Path}`}
                                    alt={selectedImage.prompt || t('generations.generatedImage')}
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        <div className="generations-modal-footer">
                            <button
                                className="generations-button generations-button--secondary"
                                onClick={() => setShowModal(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className={`generations-button ${actionType === 'remove'
                                        ? 'generations-button--danger'
                                        : 'generations-button--primary'
                                    }`}
                                onClick={() => {
                                    if (actionType === 'remove') {
                                        handleRemoveImage(selectedImage.id);
                                    } else if (actionType === 'character') {
                                        handleSetAsImage(selectedImage.id, 'character');
                                    } else if (actionType === 'scene') {
                                        handleSetAsImage(selectedImage.id, 'scene');
                                    } else if (actionType === 'regenerate') {
                                        handleRegenerateImage(selectedImage.id);
                                    }
                                }}
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerationsList;