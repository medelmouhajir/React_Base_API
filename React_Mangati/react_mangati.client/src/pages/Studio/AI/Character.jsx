import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import aiStudioService from '../../../services/aiStudioService';
import studioAssetsService from '../../../services/studioAssetsService';
import './Character.css';

const Character = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    // State
    const [selectedSerie, setSelectedSerie] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [characterImages, setCharacterImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [serieUploads, setSerieUploads] = useState([]);
    const [selectedUploads, setSelectedUploads] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [step, setStep] = useState('select-character'); // ['select-character', 'input-details', 'result']

    // Load selected series from local storage
    useEffect(() => {
        const stored = localStorage.getItem('studioSelectedSerie');
        if (stored) {
            try {
                const serie = JSON.parse(stored);
                setSelectedSerie(serie);
                // Load characters for this series
                loadCharacters(serie.id);
            } catch (error) {
                console.error('Error loading selected serie:', error);
                toast.error(t('studio.ai.character.serieLoadError'));
            }
        }
    }, [t]);

    // Load characters for selected series
    const loadCharacters = async (serieId) => {
        try {
            setIsLoading(true);
            const characters = await studioAssetsService.getCharacters(serieId);
            setCharacters(characters);
        } catch (error) {
            console.error('Error loading characters:', error);
            toast.error(t('studio.ai.character.charactersLoadError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Load character images and uploads when a character is selected
    useEffect(() => {
        if (selectedCharacter) {
            loadCharacterData();
        }
    }, [selectedCharacter]);

    // Load character images and series uploads
    const loadCharacterData = async () => {
        try {
            setIsLoading(true);

            // Load character images
            const images = await studioAssetsService.getCharacterImages(selectedCharacter.id);
            setCharacterImages(images);

            // Load series uploads
            if (selectedSerie) {
                const uploads = await studioAssetsService.getUploads(selectedSerie.id);
                setSerieUploads(uploads);
            }

            // Set initial prompt based on character details
            const promptTemplate = `Create a detailed anime-style character illustration of ${selectedCharacter.name}`;
            const details = [];

            if (selectedCharacter.description) {
                details.push(selectedCharacter.description);
            }

            if (selectedCharacter.height) {
                details.push(`Height: ${selectedCharacter.height}cm`);
            }

            if (selectedCharacter.weight) {
                details.push(`Weight: ${selectedCharacter.weight}kg`);
            }

            const fullPrompt = details.length > 0
                ? `${promptTemplate}. ${details.join('. ')}`
                : promptTemplate;

            setPrompt(fullPrompt);

            // Move to input details step
            setStep('input-details');
        } catch (error) {
            console.error('Error loading character data:', error);
            toast.error(t('studio.ai.character.dataLoadError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle character selection
    const handleCharacterSelect = (character) => {
        setSelectedCharacter(character);
        // Reset selections
        setSelectedImages([]);
        setSelectedUploads([]);
        setGeneratedImage(null);
    };

    // Toggle character image selection
    const toggleImageSelection = (image) => {
        setSelectedImages(prev => {
            const isSelected = prev.some(img => img.id === image.id);
            if (isSelected) {
                return prev.filter(img => img.id !== image.id);
            } else {
                return [...prev, image];
            }
        });
    };

    // Toggle upload selection
    const toggleUploadSelection = (upload) => {
        setSelectedUploads(prev => {
            const isSelected = prev.some(up => up.id === upload.id);
            if (isSelected) {
                return prev.filter(up => up.id !== upload.id);
            } else {
                return [...prev, upload];
            }
        });
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files?.length) return;

        setIsLoading(true);
        try {
            for (let file of files) {
                const formData = new FormData();
                formData.append('fileData', file);       // <-- must match the parameter name

                const upload = await studioAssetsService.createUpload(
                    selectedSerie.id,
                    formData
                );

                setSerieUploads(prev => [...prev, upload]);
                setSelectedUploads(prev => [...prev, upload]);
            }
            toast.success(t('studio.ai.character.uploadSuccess'));
        } catch (err) {
            console.error('Error uploading file:', err);
            toast.error(t('studio.ai.character.uploadError'));
        } finally {
            setIsLoading(false);
            fileInputRef.current && (fileInputRef.current.value = '');
        }
    };


    // Generate image based on the prompt and selected references
    const generateImage = async () => {
        if (!prompt.trim()) {
            toast.warning(t('studio.ai.character.promptRequired'));
            return;
        }

        try {
            setGeneratingImage(true);

            // Prepare reference images URLs
            const referenceImages = [
                ...selectedImages.map(img => `${apiBaseUrl}${img.image_Path}`),
                ...selectedUploads.map(up => `${apiBaseUrl}${up.path}`)
            ];

            let result;

            // If we have reference images, use them
            if (referenceImages.length > 0) {
                result = await aiStudioService.generateImageWithReferences(
                    prompt,
                    referenceImages,
                    {
                        provider: aiStudioService.AIProvider.ChatGPT,
                        width: 1024,
                        height: 1024,
                        style: "anime"
                    }
                );
            } else {
                // Otherwise just use the prompt
                result = await aiStudioService.generateImage(
                    prompt,
                    {
                        provider: aiStudioService.AIProvider.ChatGPT,
                        width: 1024,
                        height: 1024,
                        style: "anime"
                    }
                );
            }

            if (result.success) {
                setGeneratedImage(result.imageUrl || result.base64Image);
                setStep('result');
                toast.success(t('studio.ai.character.generateSuccess'));
            } else {
                console.error(
                    'Error generating image:',
                    error.response?.data || error
                );
                // if your API returned { success: false, error: "..."} you’ll now pick it up
                const msg =
                    error.response?.data?.error ||
                    error.message ||
                    t('studio.ai.character.generateError');
                toast.error(msg);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            toast.error(t('studio.ai.character.generateError'));
        } finally {
            setGeneratingImage(false);
        }
    };

    // Save generated image as a character image
    const saveGeneratedImage = async () => {
        try {
            setIsLoading(true);

            // Convert base64 to blob if needed
            let imageBlob;
            if (generatedImage.startsWith('data:')) {
                // It's a base64 image
                const response = await fetch(generatedImage);
                imageBlob = await response.blob();
            } else {
                // It's a URL, fetch it first
                const response = await fetch(generatedImage);
                imageBlob = await response.blob();
            }

            // Create a file from the blob
            const file = new File([imageBlob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });

            // Upload the image as a character image
            await studioAssetsService.createCharacterImage(
                selectedCharacter.id,
                file,
                'AI Generated Character Image',
                false
            );

            toast.success(t('studio.ai.character.saveSuccess'));

            // Navigate to character details
            navigate(`/studio/characters/${selectedCharacter.id}/details`);
        } catch (error) {
            console.error('Error saving generated image:', error);
            toast.error(t('studio.ai.character.saveError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Go back to input details step
    const handleBack = () => {
        if (step === 'result') {
            setStep('input-details');
        } else if (step === 'input-details') {
            setStep('select-character');
            setSelectedCharacter(null);
        }
    };

    // Render character selection step
    const renderCharacterSelection = () => (
        <div className="ai-character__character-selection">
            <h2 className="ai-character__section-title">{t('studio.ai.character.selectCharacter')}</h2>

            {isLoading ? (
                <div className="ai-character__loading">
                    <div className="ai-character__spinner"></div>
                    <p>{t('studio.ai.character.loadingCharacters')}</p>
                </div>
            ) : characters.length === 0 ? (
                <div className="ai-character__empty">
                    <p>{t('studio.ai.character.noCharacters')}</p>
                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={() => navigate('/studio/characters/create')}
                    >
                        {t('studio.ai.character.createCharacter')}
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
                        <path d="M19 12H5M12 19l-7-7 7-7"></path>
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
                    <textarea
                        className="ai-character__prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('studio.ai.character.promptPlaceholder')}
                        rows={6}
                    />
                </div>

                {/* Character Images Section */}
                <div className="ai-character__section">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.characterImages')}</h3>
                    {isLoading ? (
                        <div className="ai-character__loading">
                            <div className="ai-character__spinner"></div>
                            <p>{t('studio.ai.character.loadingImages')}</p>
                        </div>
                    ) : characterImages.length === 0 ? (
                        <div className="ai-character__empty">
                            <p>{t('studio.ai.character.noImages')}</p>
                        </div>
                    ) : (
                        <div className="ai-character__images-grid">
                            {characterImages.map(image => (
                                <div
                                    key={image.id}
                                    className={`ai-character__ref-image ${selectedImages.some(img => img.id === image.id) ? 'ai-character__ref-image--selected' : ''}`}
                                    onClick={() => toggleImageSelection(image)}
                                >
                                    <img
                                        src={`${apiBaseUrl}${image.image_Path}`}
                                        alt={image.title || selectedCharacter.name}
                                        className="ai-character__image"
                                    />
                                    <div className="ai-character__select-overlay">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Uploads Section */}
                <div className="ai-character__section">
                    <h3 className="ai-character__section-subtitle">{t('studio.ai.character.uploads')}</h3>
                    <div className="ai-character__upload-controls">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            multiple
                            className="ai-character__file-input"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="ai-character__upload-button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            {t('studio.ai.character.uploadReferences')}
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="ai-character__loading">
                            <div className="ai-character__spinner"></div>
                            <p>{t('studio.ai.character.loadingUploads')}</p>
                        </div>
                    ) : serieUploads.length === 0 ? (
                        <div className="ai-character__empty">
                            <p>{t('studio.ai.character.noUploads')}</p>
                        </div>
                    ) : (
                        <div className="ai-character__images-grid">
                            {serieUploads.map(upload => (
                                <div
                                    key={upload.id}
                                    className={`ai-character__ref-image ${selectedUploads.some(up => up.id === upload.id) ? 'ai-character__ref-image--selected' : ''}`}
                                    onClick={() => toggleUploadSelection(upload)}
                                >
                                    <img
                                        src={`${apiBaseUrl}${upload.path}`}
                                        alt="Reference upload"
                                        className="ai-character__image"
                                    />
                                    <div className="ai-character__select-overlay">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="ai-character__actions">
                <button
                    className="ai-character__button ai-character__button--primary"
                    onClick={generateImage}
                    disabled={generatingImage || isLoading}
                >
                    {generatingImage ? (
                        <>
                            <div className="ai-character__button-spinner"></div>
                            {t('studio.ai.character.generating')}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            {t('studio.ai.character.generate')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Render result step
    const renderResult = () => (
        <div className="ai-character__result">
            <div className="ai-character__header">
                <button
                    className="ai-character__back-button"
                    onClick={handleBack}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"></path>
                    </svg>
                    {t('studio.ai.character.back')}
                </button>
                <h2 className="ai-character__title">
                    {t('studio.ai.character.generatedImage')}
                </h2>
            </div>

            <div className="ai-character__generated-container">
                <div className="ai-character__generated-image-wrapper">
                    <img
                        src={generatedImage}
                        alt="Generated character"
                        className="ai-character__generated-image"
                    />
                </div>

                <div className="ai-character__result-actions">
                    <button
                        className="ai-character__button ai-character__button--secondary"
                        onClick={handleBack}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        {t('studio.ai.character.regenerate')}
                    </button>

                    <button
                        className="ai-character__button ai-character__button--primary"
                        onClick={saveGeneratedImage}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="ai-character__button-spinner"></div>
                                {t('studio.ai.character.saving')}
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                {t('studio.ai.character.saveToCharacter')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    // Main render based on current step
    return (
        <div className="ai-character">
            {step === 'select-character' && renderCharacterSelection()}
            {step === 'input-details' && renderInputDetails()}
            {step === 'result' && renderResult()}
        </div>
    );
};

export default Character;