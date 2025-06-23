// src/pages/Studio/AI/Character.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import aiStudioService from '../../../services/aiStudioService';
import studioAssetsService from '../../../services/studioAssetsService';
import { useImageGeneration } from '../../../contexts/ImageGenerationContext';
import './Character.css';

const Character = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const { generateImageInBackground } = useImageGeneration();

    // State for the selected series
    const [selectedSerie, setSelectedSerie] = useState(null);

    // State for image generation
    const [characters, setCharacters] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [step, setStep] = useState('select-character'); // 'select-character', 'input-details', 'preview'
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationId, setGenerationId] = useState(null);

    // State for reference images
    const [referenceImages, setReferenceImages] = useState([]);
    const [selectedRefImages, setSelectedRefImages] = useState([]);

    // State for character images (when saving)
    const [characterImages, setCharacterImages] = useState([]);

    // State for image selection modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCharacterImagesModal, setShowCharacterImagesModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [imageName, setImageName] = useState('');
    const [isMainImage, setIsMainImage] = useState(false);
    const image_base_url = import.meta.env.VITE_API_URL;

    // State for generation options
    const [generationOptions, setGenerationOptions] = useState({
        model: 'dall-e-3',
        resolution: '1024x1024',
        quality: 'standard',
        style: 'vivid'
    });

    // Load selected series from localStorage
    useEffect(() => {
        const storedSerie = localStorage.getItem('studioSelectedSerie');
        if (storedSerie) {
            try {
                setSelectedSerie(JSON.parse(storedSerie));
            } catch (error) {
                console.error('Error loading selected serie:', error);
                toast.error('Failed to load selected series data');
            }
        } else {
            toast.warning('Please select a series first');
        }
    }, []);

    // Load characters when series is set
    useEffect(() => {
        if (selectedSerie) {
            loadCharacters();
            loadUploads();
        }
    }, [selectedSerie]);

    // Load characters from the selected series
    const loadCharacters = async () => {
        try {
            const data = await studioAssetsService.getCharacters(selectedSerie.id);
            setCharacters(data);
        } catch (error) {
            console.error('Error loading characters:', error);
            toast.error('Failed to load characters');
        }
    };

    // Load uploaded images from the selected series
    const loadUploads = async () => {
        try {
            const data = await studioAssetsService.getUploads(selectedSerie.id);
            setReferenceImages(data);
        } catch (error) {
            console.error('Error loading uploads:', error);
            toast.error('Failed to load reference images');
        }
    };

    // Load character images when a character is selected
    const loadCharacterImages = async (characterId) => {
        try {
            const data = await studioAssetsService.getCharacterImages(characterId);
            setCharacterImages(data);
        } catch (error) {
            console.error('Error loading character images:', error);
            toast.error('Failed to load character images');
        }
    };

    // Handle character selection
    const handleCharacterSelect = (character) => {
        setSelectedCharacter(character);
        loadCharacterImages(character.id);
        setStep('input-details');

        // Initialize prompt with character details
        const detailsPrompt = character.description
            ? `\nCharacter description: ${character.description}`
            : '';
        const physicalPrompt = (character.height || character.weight)
            ? `\nPhysical attributes: ${character.height ? `Height: ${character.height}cm, ` : ''}${character.weight ? `Weight: ${character.weight}kg` : ''}`
            : '';

        setPrompt(`${detailsPrompt}${physicalPrompt}\n\nTransform the input photograph (<INPUT_IMAGE>) into a full-body Korean manhwa–style illustration reminiscent of Solo Leveling.  
– Style: high-contrast line art with dynamic shading, rich colors, and dramatic lighting.  
– Character: full-body pose, natural anatomy and proportions, preserving the exact facial details and expression of the original photo.  
– Background: fully transparent (alpha channel only).  
– Quality: ultra-detailed, 4K resolution, crisp edges, smooth gradients.  
– Mood: heroic, slightly dramatic, with subtle motion lines or energy effects typical of manhwa covers.`);
    };

    // Handle image generation

    const handleGenerateImage = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt');
            return;
        }

        // Prevent multiple generations
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            // Define the image generation function based on whether reference images are selected
            const generateFn = async () => {
                if (selectedRefImages.length > 0) {
                    // Map selected reference image IDs to actual image paths
                    const imageUrls = selectedRefImages.map(id => {
                        const image = referenceImages.find(img => img.id === id);
                        return image ? `${import.meta.env.VITE_API_URL}${image.path}` : null;
                    }).filter(Boolean);

                    return await aiStudioService.generateImageWithReferences(
                        prompt,
                        imageUrls,
                        {
                            provider: aiStudioService.AIProvider.ChatGPT,
                            width: parseInt(generationOptions.resolution.split('x')[0]),
                            height: parseInt(generationOptions.resolution.split('x')[1]),
                            style: generationOptions.style,
                            quality: generationOptions.quality,
                            model: generationOptions.model
                        },
                        selectedSerie.id
                    );
                } else {
                    // Generate without reference images
                    return await aiStudioService.generateImage(
                        prompt,
                        {
                            provider: aiStudioService.AIProvider.ChatGPT,
                            width: parseInt(generationOptions.resolution.split('x')[0]),
                            height: parseInt(generationOptions.resolution.split('x')[1]),
                            style: generationOptions.style,
                            quality: generationOptions.quality,
                            model: generationOptions.model,
                            serieId: selectedSerie.id
                        }
                    );
                }
            };

            // Generate the image in background
            await generateImageInBackground(
                generateFn,
                {
                    title: `Generating Character Image: ${selectedCharacter.name}`,
                    description: `Prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
                    onNotificationClick: (result) => {
                        // Handle notification click - navigate to the character page or set the result
                        if (result.success) {
                            setGeneratedImage(image_base_url + result.imageUrl || result.base64Image);
                            setGenerationId(result.generationId);
                            setStep('preview');
                        }
                    }
                }
            ).then(result => {
                if (result.success) {
                    setGeneratedImage(image_base_url + result.imageUrl || result.base64Image);
                    setGenerationId(result.generationId);
                    setStep('preview');
                }
            });

        } catch (error) {
            console.error('Error generating image:', error);
            toast.error(`Error: ${error.message || 'Failed to generate image'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle file upload for reference images
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('fileData', file);

                const uploadedImage = await studioAssetsService.createUpload(selectedSerie.id, formData);
                setReferenceImages(prev => [...prev, uploadedImage]);
            }

            toast.success(`${files.length} image(s) uploaded successfully`);
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Failed to upload images');
        }
    };

    // Toggle reference image selection
    const toggleRefImageSelection = (imageId) => {
        setSelectedRefImages(prev =>
            prev.includes(imageId)
                ? prev.filter(id => id !== imageId)
                : [...prev, imageId]
        );
    };

    // Save generated image as character image
    const handleSaveImage = async () => {
        if (!generatedImage || !selectedCharacter) {
            toast.warning('No image to save or no character selected');
            return;
        }

        try {

            // Save image to character
            await studioAssetsService.createCharacterImageFromGeneration(
                selectedCharacter.id, generationId, isMainImage, imageName || `${selectedCharacter.name} - AI Generated`
            );

            toast.success('Image saved to character successfully');
            setShowSaveModal(false);

            // Refresh character images
            loadCharacterImages(selectedCharacter.id);
        } catch (error) {
            console.error('Error saving image:', error);
            toast.error('Failed to save image to character');
        }
    };

    // Go back to previous step
    const handleBack = () => {
        if (step === 'input-details') {
            setStep('select-character');
            setSelectedCharacter(null);
        } else if (step === 'preview') {
            setStep('input-details');
        }
    };

    // Render upload modal
    const renderUploadModal = () => (
        <div className={`ai-character__modal ${showUploadModal ? 'ai-character__modal--visible' : ''}`}>
            <div className="ai-character__modal-content">
                <div className="ai-character__modal-header">
                    <h2>{t('studio.ai.selectReferenceImages')}</h2>
                    <button
                        className="ai-character__modal-close"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="ai-character__modal-body">
                    <div className="ai-character__upload-section">
                        <label className="ai-character__upload-button" htmlFor="upload-ref-images">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            {t('studio.ai.uploadNewImages')}
                        </label>
                        <input
                            id="upload-ref-images"
                            type="file"
                            className="ai-character__file-input"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>

                    <div className="ai-character__grid">
                        {referenceImages.map(image => (
                            <div
                                key={image.id}
                                className={`ai-character__ref-image ${selectedRefImages.includes(image.id) ? 'ai-character__ref-image--selected' : ''}`}
                                onClick={() => toggleRefImageSelection(image.id)}
                            >
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${image.path}`}
                                    alt={`Upload ${image.id}`}
                                    className="ai-character__image"
                                />
                                <div className="ai-character__select-overlay">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            </div>
                        ))}

                        {referenceImages.length === 0 && (
                            <div className="ai-character__no-images">
                                <p>{t('studio.ai.noReferenceImages')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ai-character__modal-footer">
                    <button
                        className="ai-character__button ai-character__button--secondary"
                        onClick={() => setShowUploadModal(false)}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={() => setShowUploadModal(false)}
                    >
                        {t('common.select')} ({selectedRefImages.length})
                    </button>
                </div>
            </div>
        </div>
    );

    // Render character images modal
    const renderCharacterImagesModal = () => (
        <div className={`ai-character__modal ${showCharacterImagesModal ? 'ai-character__modal--visible' : ''}`}>
            <div className="ai-character__modal-content">
                <div className="ai-character__modal-header">
                    <h2>{t('studio.ai.characterImages')}</h2>
                    <button
                        className="ai-character__modal-close"
                        onClick={() => setShowCharacterImagesModal(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="ai-character__modal-body">
                    <div className="ai-character__grid">
                        {characterImages.map(image => (
                            <div
                                key={image.id}
                                className="ai-character__character-image-item"
                            >
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${image.image_Path}`}
                                    alt={image.title || 'Character image'}
                                    className="ai-character__image"
                                />
                                <div className="ai-character__image-title">
                                    {image.title || 'Untitled'}
                                    {image.is_Main && (
                                        <span className="ai-character__main-badge">Main</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {characterImages.length === 0 && (
                            <div className="ai-character__no-images">
                                <p>{t('studio.ai.noCharacterImages')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ai-character__modal-footer">
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={() => setShowCharacterImagesModal(false)}
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );

    // Render save image modal
    const renderSaveImageModal = () => (
        <div className={`ai-character__modal ${showSaveModal ? 'ai-character__modal--visible' : ''}`}>
            <div className="ai-character__modal-content">
                <div className="ai-character__modal-header">
                    <h2>{t('studio.ai.saveGeneratedImage')}</h2>
                    <button
                        className="ai-character__modal-close"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="ai-character__modal-body">
                    <div className="ai-character__save-preview">
                        {generatedImage && (
                            <img
                                src={generatedImage}
                                alt="Generated Character"
                                className="ai-character__save-image"
                            />
                        )}
                    </div>

                    <div className="ai-character__form-group">
                        <label htmlFor="image-name">{t('studio.ai.imageName')}</label>
                        <input
                            id="image-name"
                            type="text"
                            className="ai-character__input"
                            value={imageName}
                            onChange={(e) => setImageName(e.target.value)}
                            placeholder="Enter image name"
                        />
                    </div>

                    <div className="ai-character__form-group">
                        <label className="ai-character__checkbox-label">
                            <input
                                type="checkbox"
                                checked={isMainImage}
                                onChange={(e) => setIsMainImage(e.target.checked)}
                            />
                            {t('studio.ai.setAsMainImage')}
                        </label>
                    </div>
                </div>

                <div className="ai-character__modal-footer">
                    <button
                        className="ai-character__button ai-character__button--secondary"
                        onClick={() => setShowSaveModal(false)}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={handleSaveImage}
                    >
                        {t('studio.ai.saveImage')}
                    </button>
                </div>
            </div>
        </div>
    );

    // Render character selection step
    const renderCharacterSelection = () => (
        <div className="ai-character__character-selection">
            <h1 className="ai-character__section-title">{t('studio.ai.selectCharacter')}</h1>

            {characters.length === 0 ? (
                <div className="ai-character__no-characters">
                    <p>{t('studio.ai.noCharactersFound')}</p>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={() => navigate('/studio/characters/create')}
                    >
                        {t('studio.characters.createNew')}
                    </button>
                </div>
            ) : (
                <div className="ai-character__character-grid">
                    {characters.map(character => (
                        <div
                            key={character.id}
                            className="ai-character__character-card"
                            onClick={() => handleCharacterSelect(character)}
                        >
                            <div className="ai-character__character-image">
                                <div className="ai-character__character-placeholder">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <circle cx="12" cy="8" r="5"></circle>
                                        <path d="M20 21v-2a7 7 0 0 0-14 0v2"></path>
                                    </svg>
                                </div>
                            </div>
                            <h3 className="ai-character__character-name">{character.name}</h3>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Render input details step
    const renderInputDetails = () => (
        <div className="ai-character__input-details">
            <div className="ai-character__header">
                <button
                    className="ai-character__back-button"
                    onClick={handleBack}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>{t('studio.ai.back')}</span>
                </button>

                <h1 className="ai-character__title">
                    {t('studio.ai.generateImageFor')} <span>{selectedCharacter.name}</span>
                </h1>
            </div>

            <div className="ai-character__sections">
                <div className="ai-character__section">
                    <h2 className="ai-character__section-subtitle">{t('studio.ai.promptDetails')}</h2>
                    <textarea
                        className="ai-character__prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('studio.ai.promptPlaceholder')}
                        rows={6}
                    />
                </div>

                <div className="ai-character__section">
                    <h2 className="ai-character__section-subtitle">{t('studio.ai.generationOptions')}</h2>

                    <div className="ai-character__options-grid">
                        <div className="ai-character__option">
                            <label htmlFor="model">{t('studio.ai.model')}</label>
                            <select
                                id="model"
                                className="ai-character__select"
                                value={generationOptions.model}
                                onChange={(e) => setGenerationOptions({ ...generationOptions, model: e.target.value })}
                            >
                                <option value="dall-e-2">DALL-E 2</option>
                                <option value="dall-e-3">DALL-E 3</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="resolution">{t('studio.ai.resolution')}</label>
                            <select
                                id="resolution"
                                className="ai-character__select"
                                value={generationOptions.resolution}
                                onChange={(e) => setGenerationOptions({ ...generationOptions, resolution: e.target.value })}
                            >
                                <option value="1024x1024">1024x1024</option>
                                <option value="1024x1792">1024x1792 (Portrait)</option>
                                <option value="1792x1024">1792x1024 (Landscape)</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="quality">{t('studio.ai.quality')}</label>
                            <select
                                id="quality"
                                className="ai-character__select"
                                value={generationOptions.quality}
                                onChange={(e) => setGenerationOptions({ ...generationOptions, quality: e.target.value })}
                            >
                                <option value="standard">Standard</option>
                                <option value="hd">HD</option>
                            </select>
                        </div>

                        <div className="ai-character__option">
                            <label htmlFor="style">{t('studio.ai.style')}</label>
                            <select
                                id="style"
                                className="ai-character__select"
                                value={generationOptions.style}
                                onChange={(e) => setGenerationOptions({ ...generationOptions, style: e.target.value })}
                            >
                                <option value="vivid">Vivid</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="ai-character__section">
                    <h2 className="ai-character__section-subtitle">{t('studio.ai.referenceImages')}</h2>
                    <p className="ai-character__description">
                        {t('studio.ai.referenceImagesDescription')}
                    </p>

                    <div className="ai-character__actions-row">
                        <button
                            className="ai-character__button ai-character__button--secondary"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            {t('studio.ai.selectReferenceImages')}
                            {selectedRefImages.length > 0 && `(${selectedRefImages.length})`}
                        </button>

                        <button
                            className="ai-character__button ai-character__button--secondary"
                            onClick={() => setShowCharacterImagesModal(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                            {t('studio.ai.viewCharacterImages')}
                        </button>
                    </div>

                    {selectedRefImages.length > 0 && (
                        <div className="ai-character__selected-refs">
                            <h3 className="ai-character__subsection-title">{t('studio.ai.selectedReferences')}</h3>
                            <div className="ai-character__selected-refs-grid">
                                {selectedRefImages.map(id => {
                                    const image = referenceImages.find(img => img.id === id);
                                    return image ? (
                                        <div key={id} className="ai-character__selected-ref">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${image.path}`}
                                                alt="Reference"
                                                className="ai-character__ref-thumbnail"
                                            />
                                            <button
                                                className="ai-character__ref-remove"
                                                onClick={() => toggleRefImageSelection(id)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="ai-character__actions">
                <button
                    className="ai-character__button ai-character__button--primary ai-character__generate-button"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <div className="ai-character__spinner"></div>
                            {t('studio.ai.generating')}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            {t('studio.ai.generateImage')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Render preview step
    const renderPreview = () => (
        <div className="ai-character__preview">
            <div className="ai-character__header">
                <button
                    className="ai-character__back-button"
                    onClick={handleBack}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>{t('studio.ai.back')}</span>
                </button>

                <h1 className="ai-character__title">
                    {t('studio.ai.generatedImageFor')} <span>{selectedCharacter.name}</span>
                </h1>
            </div>

            <div className="ai-character__preview-content">
                <div className="ai-character__preview-image-container">
                    {generatedImage && (
                        <img
                            src={generatedImage}
                            alt="Generated Character"
                            className="ai-character__preview-image"
                        />
                    )}
                </div>

                <div className="ai-character__preview-details">
                    <div className="ai-character__section">
                        <h2 className="ai-character__section-subtitle">{t('studio.ai.generationDetails')}</h2>
                        <div className="ai-character__details-list">
                            <div className="ai-character__details-item">
                                <span className="ai-character__details-label">{t('studio.ai.model')}:</span>
                                <span className="ai-character__details-value">{generationOptions.model}</span>
                            </div>
                            <div className="ai-character__details-item">
                                <span className="ai-character__details-label">{t('studio.ai.resolution')}:</span>
                                <span className="ai-character__details-value">{generationOptions.resolution}</span>
                            </div>
                            <div className="ai-character__details-item">
                                <span className="ai-character__details-label">{t('studio.ai.quality')}:</span>
                                <span className="ai-character__details-value">{generationOptions.quality}</span>
                            </div>
                            <div className="ai-character__details-item">
                                <span className="ai-character__details-label">{t('studio.ai.style')}:</span>
                                <span className="ai-character__details-value">{generationOptions.style}</span>
                            </div>
                            <div className="ai-character__details-item">
                                <span className="ai-character__details-label">{t('studio.ai.referenceImagesCount')}:</span>
                                <span className="ai-character__details-value">{selectedRefImages.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ai-character__section">
                        <h2 className="ai-character__section-subtitle">{t('studio.ai.prompt')}</h2>
                        <div className="ai-character__prompt-display">
                            {prompt}
                        </div>
                    </div>

                    <div className="ai-character__preview-actions">
                        <button
                            className="ai-character__button ai-character__button--secondary"
                            onClick={() => handleGenerateImage()}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                            {t('studio.ai.regenerate')}
                        </button>

                        <button
                            className="ai-character__button ai-character__button--primary"
                            onClick={() => {
                                setImageName(`${selectedCharacter.name} - AI Generated`);
                                setIsMainImage(false);
                                setShowSaveModal(true);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {t('studio.ai.saveToCharacter')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`ai-character ${isDarkMode ? 'ai-character--dark' : 'ai-character--light'}`}>
            {step === 'select-character' && renderCharacterSelection()}
            {step === 'input-details' && renderInputDetails()}
            {step === 'preview' && renderPreview()}

            {/* Modals */}
            {renderUploadModal()}
            {renderCharacterImagesModal()}
            {renderSaveImageModal()}
        </div>
    );
};

export default Character;