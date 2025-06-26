// src/pages/Studio/AI/Character.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useImageGeneration } from '../../../contexts/ImageGenerationContext';
import studioAssetsService from '../../../services/studioAssetsService';
import aiStudioService from '../../../services/aiStudioService';
import { toast } from 'react-toastify';
import './Character.css';

const Character = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isDarkMode } = useTheme();
    const { generateImageInBackground } = useImageGeneration();
    const image_base_url = import.meta.env.VITE_API_URL + '/';

    // State
    const [characters, setCharacters] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [referenceImages, setReferenceImages] = useState([]);
    const [selectedRefs, setSelectedRefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('select-character');
    const [showRefsModal, setShowRefsModal] = useState(false);
    const [options, setOptions] = useState({
        provider: 'Gemini',
        style: 'anime',
        quality: 'standard',
        width: 1024,
        height: 1024,
        count: 1
    });
    const [generatedImage, setGeneratedImage] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [imageTitle, setImageTitle] = useState('');
    const [makeMainImage, setMakeMainImage] = useState(true);

    // Fetch characters on mount
    useEffect(() => {
        const generationId = searchParams.get('generationId');
        if (generationId) {
            // Handle case where we're coming from a generated image
            loadGeneratedImage(generationId);
        } else {
            loadCharacters();
        }
    }, [searchParams]);

    const loadCharacters = async () => {
        try {
            setLoading(true);
            // Assuming we're using a serieId from somewhere (context or URL)
            const serieId = 1; // Replace with actual serieId source
            const charactersData = await studioAssetsService.getCharacters(serieId);
            setCharacters(charactersData);
        } catch (error) {
            console.error('Error loading characters:', error);
            toast.error(t('studio.ai.character.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const loadGeneratedImage = async (generationId) => {
        try {
            setLoading(true);
            // Implement loading of a generated image by ID
            // This would connect to your service for getting a specific generation
            const imageData = await studioAssetsService.getGeneratedImage(generationId);
            setGeneratedImage(imageData);
            setStep('preview');
        } catch (error) {
            console.error('Error loading generated image:', error);
            toast.error(t('studio.ai.character.loadImageError'));
        } finally {
            setLoading(false);
        }
    };

    const handleCharacterSelect = (character) => {
        setSelectedCharacter(character);
        setStep('input-details');

        // Pre-fill prompt with character info
        setPrompt(`A detailed portrait of ${character.name}, ${character.description || ''}`);
    };

    const handlePromptChange = (e) => {
        setPrompt(e.target.value);
    };

    const handleOptionChange = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectReferenceImages = () => {
        // Load reference images (e.g., from uploads)
        loadReferenceImages();
        setShowRefsModal(true);
    };

    const loadReferenceImages = async () => {
        try {
            setLoading(true);
            // Assuming we're using a serieId from somewhere
            const serieId = 1; // Replace with actual serieId source
            const uploads = await studioAssetsService.getUploads(serieId);
            setReferenceImages(uploads);
        } catch (error) {
            console.error('Error loading reference images:', error);
            toast.error(t('studio.ai.character.loadRefsError'));
        } finally {
            setLoading(false);
        }
    };

    const toggleRefSelection = (image) => {
        if (selectedRefs.some(ref => ref.id === image.id)) {
            setSelectedRefs(selectedRefs.filter(ref => ref.id !== image.id));
        } else {
            setSelectedRefs([...selectedRefs, image]);
        }
    };

    const handleRemoveRef = (imageId) => {
        setSelectedRefs(selectedRefs.filter(ref => ref.id !== imageId));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            // Assuming we're using a serieId from somewhere
            const serieId = 1; // Replace with actual serieId source

            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const uploadedImage = await studioAssetsService.createUpload(serieId, formData);
            setReferenceImages(prev => [...prev, uploadedImage]);
            setSelectedRefs(prev => [...prev, uploadedImage]);

            toast.success(t('studio.ai.character.uploadSuccess'));
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(t('studio.ai.character.uploadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleImageGenerations = async () => {
        if (!prompt) {
            toast.warning(t('studio.ai.character.noPrompt'));
            return;
        }

        try {
            // Get references image IDs
            const referenceIds = selectedRefs.map(ref => ref.id);

            // Generate image in background
            await generateImageInBackground(
                async () => {
                    const serieId = 1; // Replace with actual serieId source
                    const result = await aiStudioService.generateImageWithReferences(
                        prompt,
                        referenceIds,
                        options,
                        serieId
                    );

                    if (result.success) {
                        setGeneratedImage({
                            id: result.generationId,
                            url: result.imageUrl,
                            base64: result.base64Image
                        });
                        setStep('preview');
                        return { success: true, generationId: result.generationId };
                    } else {
                        throw new Error(result.error || t('studio.ai.character.generationFailed'));
                    }
                },
                {
                    title: t('studio.ai.character.generatingTitle'),
                    description: t('studio.ai.character.generatingDesc')
                }
            );

            // After generation is complete, navigate to studio home
            navigate('/studio/home');

        } catch (error) {
            console.error('Error generating image:', error);
            toast.error(error.message || t('studio.ai.character.generationError'));
        }
    };

    const handleSaveToCharacter = () => {
        setShowSaveModal(true);
    };

    const handleSaveSubmit = async () => {
        try {
            setLoading(true);

            await studioAssetsService.createCharacterImageFromGeneration(
                selectedCharacter.id,
                generatedImage.id,
                makeMainImage,
                imageTitle || selectedCharacter.name
            );

            toast.success(t('studio.ai.character.savedSuccess'));
            setShowSaveModal(false);

            // Navigate to character details
            navigate(`/studio/characters/${selectedCharacter.id}`);
        } catch (error) {
            console.error('Error saving character image:', error);
            toast.error(t('studio.ai.character.saveError'));
            setLoading(false);
        }
    };

    const handleCreateNewCharacter = () => {
        navigate('/studio/characters/create');
    };

    const handleBack = () => {
        if (step === 'input-details') {
            setStep('select-character');
            setSelectedCharacter(null);
            setPrompt('');
            setSelectedRefs([]);
        } else if (step === 'preview') {
            setStep('input-details');
            setGeneratedImage(null);
        }
    };

    // Render character selection
    const renderCharacterSelection = () => (
        <div className="ai-character__character-selection">
            <h2 className="ai-character__section-title">{t('studio.ai.character.selectCharacter')}</h2>

            {characters.length > 0 ? (
                <div className="ai-character__character-grid">
                    {characters.map(character => (
                        <div
                            key={character.id}
                            className="ai-character__character-card"
                            onClick={() => handleCharacterSelect(character)}
                        >
                            <div className="ai-character__character-image">
                                {character.imageUrl ? (
                                    <img
                                        src={image_base_url + character.imageUrl}
                                        alt={character.name}
                                        className="ai-character__image"
                                    />
                                ) : (
                                    <div className="ai-character__character-placeholder">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="7" r="4" />
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h3 className="ai-character__character-name">{character.name}</h3>
                        </div>
                    ))}

                    {/* Add new character card */}
                    <div
                        className="ai-character__character-card ai-character__character-card--add"
                        onClick={handleCreateNewCharacter}
                    >
                        <div className="ai-character__character-image">
                            <div className="ai-character__character-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="ai-character__character-name">{t('studio.ai.character.createNew')}</h3>
                    </div>
                </div>
            ) : (
                <div className="ai-character__no-characters">
                    <p>{t('studio.ai.character.noCharacters')}</p>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={handleCreateNewCharacter}
                    >
                        {t('studio.ai.character.createFirst')}
                    </button>
                </div>
            )}
        </div>
    );

    // Render input details step
    const renderInputDetails = () => (
        <div className="ai-character__input-details">
            <div className="ai-character__header">
                <button className="ai-character__back-button" onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t('studio.ai.character.back')}
                </button>
                <h2 className="ai-character__title">
                    {t('studio.ai.character.generateFor')} <span>{selectedCharacter?.name}</span>
                </h2>
            </div>

            <div className="ai-character__sections">
                {/* Prompt Section */}
                <div className="ai-character__section">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.prompt')}</h3>
                    <p className="ai-character__description">{t('studio.ai.character.promptDesc')}</p>
                    <textarea
                        className="ai-character__prompt"
                        value={prompt}
                        onChange={handlePromptChange}
                        placeholder={t('studio.ai.character.promptPlaceholder')}
                    />
                </div>

                {/* Reference Images Section */}
                <div className="ai-character__section">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.references')}</h3>
                    <p className="ai-character__description">{t('studio.ai.character.referencesDesc')}</p>

                    <div className="ai-character__actions-row">
                        <button
                            className="ai-character__button ai-character__button--secondary"
                            onClick={handleSelectReferenceImages}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            {t('studio.ai.character.selectRefs')}
                        </button>

                        <label className="ai-character__button ai-character__button--secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {t('studio.ai.character.uploadRef')}
                            <input
                                type="file"
                                className="ai-character__file-input"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    {selectedRefs.length > 0 && (
                        <div className="ai-character__selected-refs">
                            <h4 className="ai-character__subsection-title">{t('studio.ai.character.selectedRefs')}</h4>
                            <div className="ai-character__selected-refs-grid">
                                {selectedRefs.map(ref => (
                                    <div key={ref.id} className="ai-character__selected-ref">
                                        <img
                                            src={image_base_url + ref.path}
                                            alt={ref.title}
                                            className="ai-character__ref-thumbnail"
                                        />
                                        <button
                                            className="ai-character__ref-remove"
                                            onClick={() => handleRemoveRef(ref.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Generation Options */}
                <div className="ai-character__section">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.options')}</h3>
                    <div className="ai-character__options-grid">
                        <div className="ai-character__option">
                            <label htmlFor="provider">{t('studio.ai.character.provider')}</label>
                            <select
                                id="provider"
                                className="ai-character__select"
                                value={options.provider}
                                onChange={(e) => handleOptionChange('provider', e.target.value)}
                            >
                                <option value="Gemini">Gemini</option>
                                <option value="ChatGPT">ChatGPT</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="style">{t('studio.ai.character.style')}</label>
                            <select
                                id="style"
                                className="ai-character__select"
                                value={options.style}
                                onChange={(e) => handleOptionChange('style', e.target.value)}
                            >
                                <option value="anime">Anime</option>
                                <option value="realistic">Realistic</option>
                                <option value="3d">3D Rendered</option>
                                <option value="sketch">Sketch</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="quality">{t('studio.ai.character.quality')}</label>
                            <select
                                id="quality"
                                className="ai-character__select"
                                value={options.quality}
                                onChange={(e) => handleOptionChange('quality', e.target.value)}
                            >
                                <option value="standard">Standard</option>
                                <option value="hd">HD</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="width">{t('studio.ai.character.width')}</label>
                            <select
                                id="width"
                                className="ai-character__select"
                                value={options.width}
                                onChange={(e) => handleOptionChange('width', parseInt(e.target.value))}
                            >
                                <option value="512">512px</option>
                                <option value="768">768px</option>
                                <option value="1024">1024px</option>
                                <option value="1280">1280px</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="height">{t('studio.ai.character.height')}</label>
                            <select
                                id="height"
                                className="ai-character__select"
                                value={options.height}
                                onChange={(e) => handleOptionChange('height', parseInt(e.target.value))}
                            >
                                <option value="512">512px</option>
                                <option value="768">768px</option>
                                <option value="1024">1024px</option>
                                <option value="1280">1280px</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ai-character__actions">
                <button
                    className="ai-character__button ai-character__button--primary ai-character__generate-button"
                    onClick={handleImageGenerations}
                    disabled={loading || !prompt}
                >
                    {loading ? (
                        <div className="ai-character__spinner"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    )}
                    {t('studio.ai.character.generate')}
                </button>
            </div>
        </div>
    );

    // Render preview step
    const renderPreview = () => (
        <div className="ai-character__preview">
            <div className="ai-character__header">
                <button className="ai-character__back-button" onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t('studio.ai.character.back')}
                </button>
                <h2 className="ai-character__title">
                    {t('studio.ai.character.result')}
                </h2>
            </div>

            <div className="ai-character__preview-content">
                <div className="ai-character__preview-image-container">
                    {generatedImage && (
                        <img
                            src={generatedImage.url || generatedImage.base64}
                            alt="Generated character"
                            className="ai-character__preview-image"
                        />
                    )}
                </div>

                <div className="ai-character__preview-details">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.details')}</h3>

                    <div className="ai-character__details-list">
                        <div className="ai-character__details-item">
                            <span className="ai-character__details-label">{t('studio.ai.character.character')}</span>
                            <span className="ai-character__details-value">{selectedCharacter?.name}</span>
                        </div>

                        <div className="ai-character__details-item">
                            <span className="ai-character__details-label">{t('studio.ai.character.style')}</span>
                            <span className="ai-character__details-value">{options.style}</span>
                        </div>

                        <div className="ai-character__details-item">
                            <span className="ai-character__details-label">{t('studio.ai.character.dimensions')}</span>
                            <span className="ai-character__details-value">{options.width} × {options.height}</span>
                        </div>
                    </div>

                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.promptUsed')}</h3>
                    <div className="ai-character__prompt-display">
                        {prompt}
                    </div>

                    <div className="ai-character__preview-actions">
                        <button
                            className="ai-character__button ai-character__button--secondary"
                            onClick={() => handleImageGenerations()}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                            {t('studio.ai.character.tryAgain')}
                        </button>

                        <button
                            className="ai-character__button ai-character__button--primary"
                            onClick={handleSaveToCharacter}
                            disabled={loading || !selectedCharacter}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            {t('studio.ai.character.saveToCharacter')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Reference Images Modal
    const renderRefsModal = () => (
        <div className={`ai-character__modal ${showRefsModal ? 'ai-character__modal--visible' : ''}`}>
            <div className="ai-character__modal-content">
                <div className="ai-character__modal-header">
                    <h2>{t('studio.ai.character.selectReferences')}</h2>
                    <button
                        className="ai-character__modal-close"
                        onClick={() => setShowRefsModal(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="ai-character__modal-body">
                    <div className="ai-character__upload-section">
                        <label className="ai-character__upload-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {t('studio.ai.character.uploadNew')}
                            <input
                                type="file"
                                className="ai-character__file-input"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    {referenceImages.length > 0 ? (
                        <div className="ai-character__grid">
                            {referenceImages.map(image => {
                                const isSelected = selectedRefs.some(ref => ref.id === image.id);
                                return (
                                    <div
                                        key={image.id}
                                        className={`ai-character__ref-image ${isSelected ? 'ai-character__ref-image--selected' : ''}`}
                                        onClick={() => toggleRefSelection(image)}
                                    >
                                        <img
                                            src={image_base_url + image.path}
                                            alt={image.title}
                                            className="ai-character__image"
                                        />
                                        <div className="ai-character__select-overlay">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="ai-character__no-images">
                            <p>{t('studio.ai.character.noUploads')}</p>
                        </div>
                    )}
                </div>

                <div className="ai-character__modal-footer">
                    <button
                        className="ai-character__button ai-character__button--secondary"
                        onClick={() => setShowRefsModal(false)}
                    >
                        {t('studio.ai.character.cancel')}
                    </button>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={() => setShowRefsModal(false)}
                    >
                        {t('studio.ai.character.done')} ({selectedRefs.length})
                    </button>
                </div>
            </div>
        </div>
    );

    // Save Character Image Modal
    const renderSaveModal = () => (
        <div className={`ai-character__modal ${showSaveModal ? 'ai-character__modal--visible' : ''}`}>
            <div className="ai-character__modal-content">
                <div className="ai-character__modal-header">
                    <h2>{t('studio.ai.character.saveAsCharacterImage')}</h2>
                    <button
                        className="ai-character__modal-close"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="ai-character__modal-body">
                    <div className="ai-character__save-preview">
                        {generatedImage && (
                            <img
                                src={generatedImage.url || generatedImage.base64}
                                alt="Generated character"
                                className="ai-character__save-image"
                            />
                        )}
                    </div>

                    <div className="ai-character__form-group">
                        <label htmlFor="imageTitle">{t('studio.ai.character.imageTitle')}</label>
                        <input
                            id="imageTitle"
                            type="text"
                            className="ai-character__input"
                            value={imageTitle}
                            onChange={(e) => setImageTitle(e.target.value)}
                            placeholder={selectedCharacter?.name || t('studio.ai.character.untitled')}
                        />
                    </div>

                    <div className="ai-character__form-group">
                        <label className="ai-character__checkbox-label">
                            <input
                                type="checkbox"
                                checked={makeMainImage}
                                onChange={(e) => setMakeMainImage(e.target.checked)}
                            />
                            {t('studio.ai.character.setAsMain')}
                        </label>
                    </div>
                </div>

                <div className="ai-character__modal-footer">
                    <button
                        className="ai-character__button ai-character__button--secondary"
                        onClick={() => setShowSaveModal(false)}
                    >
                        {t('studio.ai.character.cancel')}
                    </button>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={handleSaveSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="ai-character__spinner"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                        )}
                        {t('studio.ai.character.save')}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`ai-character ai-character--${isDarkMode ? 'dark' : 'light'}`}>
            {step === 'select-character' && renderCharacterSelection()}
            {step === 'input-details' && renderInputDetails()}
            {step === 'preview' && renderPreview()}

            {renderRefsModal()}
            {renderSaveModal()}
        </div>
    );
};

export default Character;