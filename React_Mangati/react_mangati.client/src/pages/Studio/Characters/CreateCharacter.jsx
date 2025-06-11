// src/pages/Studio/Characters/CreateCharacter.jsx
import { useState , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studioAssetsService from '../../../services/studioAssetsService';
import './CreateCharacter.css';

export default function CreateCharacter() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedSerie, setSelectedSerie] = useState(null);
   
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('Name', name);
      formData.append('Description', description);
      formData.append('Height', height);
      formData.append('Weight', weight);

      const secondData = {
          Name : name,
          Description : description,
          Height : height,
          Weight : weight,
      };

      // POST to /api/studio/assets/characters/create/{serieId}
      await studioAssetsService.createCharacter(selectedSerie.id,secondData);

      // Navigate back to characters list
      navigate(`/studio/series/${selectedSerie.id}/characters`);
    } catch (err) {
      console.error('Creation error:', err);
      setError('Failed to create character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-character">
      <h2 className="create-character__title">New Character</h2>
      <form className="create-character__form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Character name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief bio"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="height">Height (cm)</label>
            <input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 180"
            />
          </div>
          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
            />
          </div>
        </div>

        <button
          type="submit"
          className="create-character__submit"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create Character'}
        </button>

        {error && <p className="create-character__error">{error}</p>}
      </form>
    </div>
);
}
