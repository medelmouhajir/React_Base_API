import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import studioAssetsService from '../../../services/studioAssetsService';
import { toast } from 'react-toastify';
import './CharacterDetails.css';

// Swipeable image component with delete/edit actions
const CharacterImage = ({ image, onDelete, onSetMain, isMain, apiBaseUrl }) => {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { t } = useTranslation();
  
  // Touch gesture tracking
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe) {
      setShowActions(true);
    } else if (distance < -minSwipeDistance) {
      setShowActions(false);
    }
  };
  
  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(image.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // Auto-reset confirm state after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };
  
  return (
    <div 
      className="character-image"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`character-image__container ${showActions ? 'character-image__container--show-actions' : ''}`}
        onClick={() => setShowActions(!showActions)}
      >
        <img 
          src={apiBaseUrl + image.image_Path} 
          alt={image.title || 'Character image'} 
          className="character-image__img"
        />
        {isMain && (
          <div className="character-image__main-badge">
            {t('studio.characters.mainImage')}
          </div>
        )}
        <div className="character-image__title">
          {image.title || t('studio.characters.untitled')}
        </div>
      </div>
      
      <div className="character-image__actions">
        {!isMain && (
          <button 
            className="character-image__action character-image__action--primary"
            onClick={() => onSetMain(image.id)}
            title={t('studio.characters.setAsMain')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </button>
        )}
        <button 
          className={`character-image__action ${confirmDelete ? 'character-image__action--confirm' : 'character-image__action--danger'}`}
          onClick={handleDelete}
          title={confirmDelete ? t('studio.characters.confirmDelete') : t('studio.characters.delete')}
        >
          {confirmDelete ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const CharacterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  
  const [character, setCharacter] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSerie, setSelectedSerie] = useState(null);
  
  // Load selected series and character data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load selected serie from localStorage
        const stored = localStorage.getItem('studioSelectedSerie');
        if (stored) {
          const serie = JSON.parse(stored);
          setSelectedSerie(serie);
        }
        
        // Fetch character data
        const characterData = await studioAssetsService.getCharacter(id);
        setCharacter(characterData);
        
        // Fetch character images
        const imagesData = await studioAssetsService.getCharacterImages(id);
        setImages(imagesData);
      } catch (err) {
        console.error('Error loading character data:', err);
        setError(t('studio.characters.loadError'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, t]);
  
  // Handle delete image
  const handleDeleteImage = async (imageId) => {
    try {
      await studioAssetsService.removeCharacterImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      toast.success(t('studio.characters.imageDeleted'));
    } catch (err) {
      console.error('Error deleting image:', err);
      toast.error(t('studio.characters.deleteError'));
    }
  };
  
  // Handle set main image
  const handleSetMainImage = async (imageId) => {
    try {
      await studioAssetsService.editCharacterImage(imageId, null, null, true);
      
      // Update other images to not be main
      const updatedImages = await studioAssetsService.getCharacterImages(id);
      setImages(updatedImages);
      
      toast.success(t('studio.characters.mainImageSet'));
    } catch (err) {
      console.error('Error setting main image:', err);
      toast.error(t('studio.characters.mainImageError'));
    }
  };
  
  // Navigate to add new image
  const handleAddImage = () => {
    navigate(`/studio/characters/${id}/add-image`);
  };
  
  // Navigate back to characters list
  const handleBack = () => {
    navigate('/studio/characters');
  };
  
  if (loading) {
    return (
      <div className="character-details__loading">
        <div className="character-details__spinner"></div>
        <p>{t('studio.characters.loading')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="character-details__error">
        <h2>{t('studio.characters.error')}</h2>
        <p>{error}</p>
        <button 
          className="character-details__button character-details__button--primary"
          onClick={handleBack}
        >
          {t('studio.characters.backToList')}
        </button>
      </div>
    );
  }
  
  if (!character) {
    return (
      <div className="character-details__not-found">
        <h2>{t('studio.characters.notFound')}</h2>
        <button 
          className="character-details__button character-details__button--primary"
          onClick={handleBack}
        >
          {t('studio.characters.backToList')}
        </button>
      </div>
    );
  }
  
  const mainImage = images.find(img => img.is_Main);
  
  return (
    <div className={`character-details ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="character-details__header">
        <button 
          className="character-details__back-button"
          onClick={handleBack}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>{t('studio.characters.back')}</span>
        </button>
        
        <h1 className="character-details__title">{character.name}</h1>
        
        <div className="character-details__actions">
          <button 
            className="character-details__button character-details__button--primary"
            onClick={handleAddImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
              <line x1="12" y1="9" x2="12" y2="15"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
            </svg>
            <span>{t('studio.characters.addImage')}</span>
          </button>
          <Link 
            to={`/studio/characters/${id}/edit`}
            className="character-details__button character-details__button--secondary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            <span>{t('studio.characters.edit')}</span>
          </Link>
        </div>
      </div>
      
      <div className="character-details__content">
        <div className="character-details__info-card">
          <div className="character-details__main-image">
            {mainImage ? (
              <img 
                src={apiBaseUrl + mainImage.image_Path} 
                alt={character.name} 
                className="character-details__portrait"
              />
            ) : (
              <div className="character-details__no-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="8" r="5"></circle>
                  <path d="M20 21v-2a7 7 0 0 0-14 0v2"></path>
                </svg>
                <span>{t('studio.characters.noMainImage')}</span>
              </div>
            )}
          </div>
          
          <div className="character-details__info">
            <div className="character-details__info-row">
              <span className="character-details__info-label">{t('studio.characters.name')}:</span>
              <span className="character-details__info-value">{character.name}</span>
            </div>
            
            {character.height && (
              <div className="character-details__info-row">
                <span className="character-details__info-label">{t('studio.characters.height')}:</span>
                <span className="character-details__info-value">{character.height} cm</span>
              </div>
            )}
            
            {character.weight && (
              <div className="character-details__info-row">
                <span className="character-details__info-label">{t('studio.characters.weight')}:</span>
                <span className="character-details__info-value">{character.weight} kg</span>
              </div>
            )}
            
            {character.characters_GroupId && (
              <div className="character-details__info-row">
                <span className="character-details__info-label">{t('studio.characters.group')}:</span>
                <span className="character-details__info-value">{character.characters_Group?.name || '-'}</span>
              </div>
            )}
          </div>
        </div>
        
        {character.description && (
          <div className="character-details__description-card">
            <h3 className="character-details__section-title">{t('studio.characters.description')}</h3>
            <p className="character-details__description">{character.description}</p>
          </div>
        )}
        
        <div className="character-details__images-section">
          <div className="character-details__images-header">
            <h3 className="character-details__section-title">{t('studio.characters.images')}</h3>
            <span className="character-details__count">
              {images.length} {t('studio.characters.imagesCount')}
            </span>
          </div>
          
          {images.length === 0 ? (
            <div className="character-details__no-images">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>{t('studio.characters.noImagesYet')}</p>
              <button 
                className="character-details__button character-details__button--primary"
                onClick={handleAddImage}
              >
                {t('studio.characters.addFirstImage')}
              </button>
            </div>
          ) : (
            <div className="character-details__images-grid">
              {images.map(image => (
                <CharacterImage 
                  key={image.id}
                  image={image}
                  onDelete={handleDeleteImage}
                  onSetMain={handleSetMainImage}
                  isMain={image.is_Main}
                  apiBaseUrl={apiBaseUrl}
                />
              ))}
              
              <div className="character-details__add-image" onClick={handleAddImage}>
                <div className="character-details__add-image-inner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>{t('studio.characters.addImage')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterDetails;