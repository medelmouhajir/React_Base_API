import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import aiStudioService from '../../../services/aiStudioService';
import filtersService from '../../../services/filtersService';
import './StudioHome.css';

const StudioHome = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [tags, setTags] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // load studio series, tags, and languages in parallel
        const [studioSeries, tagsRes, langsRes] = await Promise.all([
          aiStudioService.getStudioSeries(),
          filtersService.getTags().then(r => r.data),
          filtersService.getLanguages().then(r => r.data),
        ]);
        setSeries(studioSeries);
        setFilteredSeries(studioSeries);
        setTags(tagsRes);
        setLanguages(langsRes);
      } catch (err) {
        console.error('Error loading studio home data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // apply filters whenever selection changes
  useEffect(() => {
    let out = series;
    if (selectedTag) {
      out = out.filter(s => s.tagIds?.includes(selectedTag));
    }
    if (selectedLanguage) {
      out = out.filter(s => s.languageIds?.includes(selectedLanguage));
    }
    setFilteredSeries(out);
  }, [selectedTag, selectedLanguage, series]);

  if (loading) {
    return <div className="studio-home__loading">Loading Studio...</div>;
  }

  return (
    <div className="studio-home">
      <div className="studio-home__filters">
        <select
          value={selectedTag}
          onChange={e => setSelectedTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <select
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
        >
          <option value="">All Languages</option>
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="studio-home__grid">
        {filteredSeries.map(serie => (
          <div
            key={serie.id}
            className="studio-home__card"
            onClick={() => navigate(`/series/${serie.id}`)}
          >
            {serie.coverImageUrl && (
              <img
                src={serie.coverImageUrl}
                alt={serie.title}
                className="studio-home__cover"
              />
            )}
            <div className="studio-home__info">
              <h3 className="studio-home__title">{serie.title}</h3>
              <span className="studio-home__status">{serie.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudioHome;
