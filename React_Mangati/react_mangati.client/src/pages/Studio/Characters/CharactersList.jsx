// src/pages/Studio/Characters/CharactersList.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import studioAssetsService from '../../../services/studioAssetsService';
import { toast } from 'react-toastify';
import './CharactersList.css';

const CharactersList = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const touchStartRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || '';

    // State for data
    const [selectedSerie, setSelectedSerie] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [filteredCharacters, setFilteredCharacters] = useState([]);
    const [groups, setGroups] = useState([]);

    // State for filtering and searching
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    // State for loading and UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createGroupModal, setCreateGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
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

    // Load characters and groups when serie is selected
    useEffect(() => {
        if (selectedSerie) {
            loadCharacters();
            loadGroups();
        }
    }, [selectedSerie]);

    // Apply filters when search, selectedGroup, sortBy, or sortOrder changes
    useEffect(() => {
        if (!characters.length) return;

        let filtered = [...characters];

        // Apply group filter
        if (selectedGroup) {
            filtered = filtered.filter(char =>
                char.characters_GroupId === selectedGroup ||
                (selectedGroup === 'none' && !char.characters_GroupId)
            );
        }

        // Apply search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(char =>
                char.name.toLowerCase().includes(searchLower) ||
                (char.description && char.description.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'height':
                    valueA = a.height || 0;
                    valueB = b.height || 0;
                    break;
                case 'weight':
                    valueA = a.weight || 0;
                    valueB = b.weight || 0;
                    break;
                default:
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        setFilteredCharacters(filtered);
    }, [characters, search, selectedGroup, sortBy, sortOrder]);

    // Load characters from API
    const loadCharacters = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await studioAssetsService.getCharacters(selectedSerie.id);
            setCharacters(data);
            setFilteredCharacters(data);
        } catch (error) {
            console.error('Error loading characters:', error);
            setError(t('errors.loadingCharacters'));
            toast.error(t('errors.loadingCharacters'));
        } finally {
            setLoading(false);
        }
    };

    // Load character groups from API
    const loadGroups = async () => {
        try {
            // Replace with the actual service method when available
            // For now, we'll simulate groups
            // const data = await studioAssetsService.getCharacterGroups(selectedSerie.id);

            // Simulated groups
            const data = characters.reduce((acc, char) => {
                if (char.characters_GroupId && !acc.some(g => g.id === char.characters_GroupId)) {
                    acc.push({
                        id: char.characters_GroupId,
                        name: char.characters_Group?.name || `Group ${char.characters_GroupId}`
                    });
                }
                return acc;
            }, []);

            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    // Create a new character group
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.warning(t('validation.groupNameRequired'));
            return;
        }

        try {
            // Replace with the actual service method when available
            // const result = await studioAssetsService.createCharacterGroup({
            //   name: newGroupName,
            //   serieId: selectedSerie.id
            // });

            // Simulate API response
            const result = {
                id: `group-${Date.now()}`,
                name: newGroupName
            };

            setGroups([...groups, result]);
            setNewGroupName('');
            setCreateGroupModal(false);
            toast.success(t('success.groupCreated'));
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error(t('errors.creatingGroup'));
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    // Navigate to character details
    const goToCharacterDetails = (characterId) => {
        navigate(`/studio/characters/${characterId}/details`);
    };

    // Navigate to create new character
    const goToCreateCharacter = () => {
        navigate('/studio/characters/create');
    };

    // Handle touch start for swipe actions
    const handleTouchStart = (e, index) => {
        touchStartRef.current = e.targetTouches[0].clientX;
    };

    // Handle touch move for swipe actions
    const handleTouchMove = (e, index) => {
        if (!touchStartRef.current) return;

        const touchEnd = e.targetTouches[0].clientX;
        const diff = touchStartRef.current - touchEnd;

        // If swiped more than 50px, activate swipe UI
        if (Math.abs(diff) > 50) {
            setActiveSwipeIndex(diff > 0 ? index : null);
        }
    };

    // Handle touch end for swipe actions
    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };

    // Delete a character
    const handleDeleteCharacter = async (e, characterId) => {
        e.stopPropagation();

        if (window.confirm(t('confirm.deleteCharacter'))) {
            try {
                await studioAssetsService.deleteCharacter(characterId);

                // Remove character from state
                setCharacters(characters.filter(char => char.id !== characterId));
                toast.success(t('success.characterDeleted'));
            } catch (error) {
                console.error('Error deleting character:', error);
                toast.error(t('errors.deletingCharacter'));
            }
        }

        setActiveSwipeIndex(null);
    };

    // Edit a character
    const handleEditCharacter = (e, characterId) => {
        e.stopPropagation();
        navigate(`/studio/characters/${characterId}/edit`);
        setActiveSwipeIndex(null);
    };

    // Render character card
    const renderCharacterCard = (character, index) => {
        const isActive = activeSwipeIndex === index;

        return (
            <div
                key={character.id}
                className={`characters-list__card ${isActive ? 'characters-list__card--swiped' : ''}`}
                onClick={() => goToCharacterDetails(character.id)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={handleTouchEnd}
            >
                <div className="characters-list__card-content">
                    <div className="characters-list__image-container">
                        {character.mainImageUrl ? (
                            <img
                                src={API_URL + character.mainImageUrl}
                                alt={character.name}
                                className="characters-list__image"
                            />
                        ) : (
                            <div className="characters-list__placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="12" cy="8" r="5"></circle>
                                    <path d="M20 21v-2a7 7 0 0 0-14 0v2"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="characters-list__info">
                        <h3 className="characters-list__name">{character.name}</h3>
                        {character.characters_Group && (
                            <span className="characters-list__group">
                                {character.characters_Group.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Swipe Actions */}
                <div className="characters-list__actions">
                    <button
                        className="characters-list__action characters-list__action--edit"
                        onClick={(e) => handleEditCharacter(e, character.id)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                        {t('actions.edit')}
                    </button>
                    <button
                        className="characters-list__action characters-list__action--delete"
                        onClick={(e) => handleDeleteCharacter(e, character.id)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        {t('actions.delete')}
                    </button>
                </div>
            </div>
        );
    };

    // Render create group modal
    const renderCreateGroupModal = () => (
        <div className={`characters-list__modal ${createGroupModal ? 'characters-list__modal--active' : ''}`}>
            <div className="characters-list__modal-content">
                <div className="characters-list__modal-header">
                    <h3>{t('groups.createNew')}</h3>
                    <button
                        className="characters-list__modal-close"
                        onClick={() => setCreateGroupModal(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="characters-list__modal-body">
                    <div className="characters-list__form-group">
                        <label htmlFor="group-name">{t('groups.name')}</label>
                        <input
                            id="group-name"
                            type="text"
                            className="characters-list__input"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder={t('groups.namePlaceholder')}
                        />
                    </div>
                </div>
                <div className="characters-list__modal-footer">
                    <button
                        className="characters-list__button characters-list__button--secondary"
                        onClick={() => setCreateGroupModal(false)}
                    >
                        {t('actions.cancel')}
                    </button>
                    <button
                        className="characters-list__button characters-list__button--primary"
                        onClick={handleCreateGroup}
                    >
                        {t('actions.create')}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`characters-list ${isDarkMode ? 'characters-list--dark' : 'characters-list--light'}`}>
            <div className="characters-list__header">
                <h1 className="characters-list__title">{t('characters.title')}</h1>
                <div className="characters-list__search-container">
                    <div className="characters-list__search-input-container">
                        <input
                            type="text"
                            className="characters-list__search-input"
                            placeholder={t('actions.search')}
                            value={search}
                            onChange={handleSearchChange}
                        />
                        <svg className="characters-list__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <button
                        className="characters-list__filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        <span className="characters-list__filter-toggle-text">{t('actions.filter')}</span>
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className={`characters-list__filters ${showFilters ? 'characters-list__filters--active' : ''}`}>
                <div className="characters-list__filter-row">
                    <div className="characters-list__filter-group">
                        <label className="characters-list__filter-label">{t('filters.group')}</label>
                        <div className="characters-list__select-container">
                            <select
                                className="characters-list__select"
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                            >
                                <option value="">{t('filters.allGroups')}</option>
                                <option value="none">{t('filters.noGroup')}</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                            <svg className="characters-list__select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <div className="characters-list__filter-group">
                        <label className="characters-list__filter-label">{t('filters.sortBy')}</label>
                        <div className="characters-list__select-container">
                            <select
                                className="characters-list__select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">{t('filters.name')}</option>
                                <option value="height">{t('filters.height')}</option>
                                <option value="weight">{t('filters.weight')}</option>
                            </select>
                            <svg className="characters-list__select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <div className="characters-list__filter-group">
                        <label className="characters-list__filter-label">{t('filters.order')}</label>
                        <div className="characters-list__select-container">
                            <select
                                className="characters-list__select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="asc">{t('filters.ascending')}</option>
                                <option value="desc">{t('filters.descending')}</option>
                            </select>
                            <svg className="characters-list__select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <button
                        className="characters-list__button characters-list__button--secondary"
                        onClick={() => setCreateGroupModal(true)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        {t('groups.createNew')}
                    </button>
                </div>
            </div>

            {/* Action Button */}
            <div className="characters-list__actions-container">
                <button
                    className="characters-list__create-button"
                    onClick={goToCreateCharacter}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    {t('characters.createNew')}
                </button>
            </div>

            {/* Characters Grid */}
            {loading ? (
                <div className="characters-list__loading">
                    <div className="characters-list__spinner"></div>
                    <p>{t('status.loading')}</p>
                </div>
            ) : error ? (
                <div className="characters-list__error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>{error}</p>
                </div>
            ) : filteredCharacters.length > 0 ? (
                <div className="characters-list__grid">
                    {filteredCharacters.map((character, index) => renderCharacterCard(character, index))}
                </div>
            ) : (
                <div className="characters-list__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 15h8M8.5 9h.01M15.5 9h.01"></path>
                    </svg>
                    <p>{search ? t('status.noResults') : t('status.noCharacters')}</p>
                    <button
                        className="characters-list__button characters-list__button--primary"
                        onClick={goToCreateCharacter}
                    >
                        {t('characters.createNew')}
                    </button>
                </div>
            )}

            {/* Create Group Modal */}
            {renderCreateGroupModal()}

            {/* Overlay for Modal */}
            {createGroupModal && (
                <div
                    className="characters-list__overlay"
                    onClick={() => setCreateGroupModal(false)}
                ></div>
            )}
        </div>
    );
};

export default CharactersList;