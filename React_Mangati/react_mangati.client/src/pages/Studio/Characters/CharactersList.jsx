// src/pages/Studio/Characters/CharactersList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studioAssetsService from '../../../services/studioAssetsService';
import { useTheme } from '../../../contexts/ThemeContext';
import './CharactersList.css';

const CharactersList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [selectedSerie, setSelectedSerie] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load selected series from StudioLayout
  useEffect(() => {
    const stored = localStorage.getItem('studioSelectedSerie');
    if (stored) {
      try {
        setSelectedSerie(JSON.parse(stored));
      } catch {
        setError('Invalid series data.');
      }
    } else {
      setError('No series selected.');
    }
  }, []);

  // Fetch characters when series is set
  useEffect(() => {
    if (!selectedSerie) return;
    setLoading(true);
    studioAssetsService
      .getCharacters(selectedSerie.id)
      .then(data => {
        setCharacters(data);
        setFiltered(data);
      })
      .catch(() => setError('Failed to load characters.'))
      .finally(() => setLoading(false));
  }, [selectedSerie]);

  // Filter on search
  const handleSearch = e => {
    const term = e.target.value;
    setSearch(term);
    if (!term) return setFiltered(characters);
    setFiltered(
      characters.filter(c =>
        c.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  // Navigation handlers
  const goCreate = () =>
    navigate(`/studio/characters/create`);
  const goEdit = id =>
    navigate(`/studio/characters/${id}/edit`);
  const goDetails = id =>
    navigate(`/studio/characters/${id}/details`);

  return (
    <div className={`characters-list ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="characters-list__header">
        <input
          type="text"
          className="characters-list__search"
          placeholder="Search characters…"
          value={search}
          onChange={handleSearch}
        />
        <button
          className="characters-list__create-btn"
          onClick={goCreate}
        >
          + Create New
        </button>
      </div>

      {loading && <div className="characters-list__status">Loading…</div>}
      {error && <div className="characters-list__status">{error}</div>}

      {!loading && !error && (
        <div className="characters-list__grid">
          {filtered.map(char => (
            <div
              key={char.id}
              className="characters-list__card"
              onClick={() => goDetails(char.id)}
            >
              <div className="characters-list__image-wrapper">
                {char.mainImageUrl ? (
                  <img
                    src={char.mainImageUrl}
                    alt={char.name}
                    className="characters-list__image"
                  />
                ) : (
                  <div className="characters-list__placeholder">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="characters-list__name">{char.name}</h3>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="characters-list__status">
              No characters found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharactersList;
