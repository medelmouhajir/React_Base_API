// src/pages/Filters/CarModels/Models.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import carFiltersService from '../../../services/carFiltersService';
import './CarModels.css';

const Models = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const [models, setModels] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newManufacturerId, setNewManufacturerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterByManufacturer, setFilterByManufacturer] = useState('');

    // Handle responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchModelsAndManufacturers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [modelsData, mfrData] = await Promise.all([
                carFiltersService.getCarModels(),
                carFiltersService.getManufacturers(),
            ]);
            setModels(modelsData);
            setManufacturers(mfrData);
            // Default to first manufacturer if exists
            if (mfrData.length > 0) {
                setNewManufacturerId(mfrData[0].id);
            }
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(t('filters.models.fetchError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModelsAndManufacturers();
    }, [t]);

    const handleRemove = async (id) => {
        if (!window.confirm(t('filters.models.confirmRemove'))) {
            return;
        }
        try {
            await carFiltersService.removeCarModel(id);
            setModels((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
            console.error(`❌ Error removing model ${id}:`, err);
            setError(t('filters.models.removeError'));
        }
    };

    const openModal = () => {
        setNewName('');
        if (manufacturers.length > 0) {
            setNewManufacturerId(manufacturers[0].id);
        }
        setShowModal(true);
        setError(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setError(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim() || !newManufacturerId) {
            setError(t('filters.models.nameAndManufacturerRequired'));
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                name: newName.trim(),
                manufacturerId: newManufacturerId,
            };
            const created = await carFiltersService.addCarModel(payload);
            setModels((prev) => [...prev, created]);
            closeModal();
        } catch (err) {
            console.error('❌ Error adding car model:', err);
            setError(t('filters.models.addError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter models based on search and manufacturer filter
    const filteredModels = models.filter((model) => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.manufacturerName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesManufacturer = !filterByManufacturer || model.manufacturerId === filterByManufacturer;
        return matchesSearch && matchesManufacturer;
    });

    if (isLoading) {
        return (
            <div className={`cm-loading-wrapper ${isDarkMode ? 'dark' : ''}`}>
                <div className="cm-spinner" />
                <span className="cm-loading-text">{t('common.loading')}</span>
            </div>
        );
    }

    if (error && !showModal) {
        return (
            <div className={`cm-error-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="cm-error-message">{error}</div>
                <button className="cm-retry-btn" onClick={fetchModelsAndManufacturers}>
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className={`car-models-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="cm-header">
                <h1 className="cm-title">{t('filters.models.title')}</h1>
                <button className="cm-add-btn" onClick={openModal}>
                    <span className="cm-add-icon">+</span>
                    {isMobile ? '' : t('filters.models.add')}
                </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="cm-controls">
                <div className="cm-search-container">
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder={t('filters.models.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="cm-filter-container">
                    <select
                        className="cm-filter-select"
                        value={filterByManufacturer}
                        onChange={(e) => setFilterByManufacturer(e.target.value)}
                    >
                        <option value="">{t('filters.models.allManufacturers')}</option>
                        {manufacturers.map((mfr) => (
                            <option key={mfr.id} value={mfr.id}>
                                {mfr.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Count */}
            {filteredModels.length !== models.length && (
                <div className="cm-results-info">
                    {t('filters.models.showingResults', {
                        count: filteredModels.length,
                        total: models.length
                    })}
                </div>
            )}

            {/* Desktop Table View */}
            {!isMobile && (
                <div className="cm-table-wrapper">
                    <table className="cm-table">
                        <thead>
                            <tr>
                                <th>{t('filters.models.modelName')}</th>
                                <th>{t('filters.models.manufacturer')}</th>
                                <th className="cm-actions-header">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredModels.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="cm-no-results">
                                        {searchQuery || filterByManufacturer
                                            ? t('filters.models.noResultsFound')
                                            : t('filters.models.noModels')
                                        }
                                    </td>
                                </tr>
                            ) : (
                                filteredModels.map((model) => (
                                    <tr key={model.id} className="cm-table-row">
                                        <td className="cm-name-cell">{model.name}</td>
                                        <td className="cm-manufacturer-cell">
                                            {model.manufacturerName || t('common.unknown')}
                                        </td>
                                        <td className="cm-actions-cell">
                                            <button
                                                className="cm-remove-btn"
                                                onClick={() => handleRemove(model.id)}
                                                title={t('filters.models.remove')}
                                            >
                                                {t('common.remove')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mobile Cards View */}
            {isMobile && (
                <div className="cm-cards-wrapper">
                    {filteredModels.length === 0 ? (
                        <div className="cm-no-results-card">
                            <div className="cm-no-results-icon">📋</div>
                            <h3 className="cm-no-results-title">
                                {searchQuery || filterByManufacturer
                                    ? t('filters.models.noResultsFound')
                                    : t('filters.models.noModels')
                                }
                            </h3>
                            <p className="cm-no-results-subtitle">
                                {searchQuery || filterByManufacturer
                                    ? t('filters.models.tryDifferentSearch')
                                    : t('filters.models.addFirstModel')
                                }
                            </p>
                        </div>
                    ) : (
                        filteredModels.map((model) => (
                            <div key={model.id} className="cm-card">
                                <div className="cm-card-header">
                                    <h3 className="cm-card-title">{model.name}</h3>
                                    <button
                                        className="cm-card-remove-btn"
                                        onClick={() => handleRemove(model.id)}
                                        title={t('filters.models.remove')}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="cm-card-body">
                                    <div className="cm-card-info">
                                        <span className="cm-card-label">{t('filters.models.manufacturer')}:</span>
                                        <span className="cm-card-value">
                                            {model.manufacturerName || t('common.unknown')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="cm-modal-overlay" onClick={closeModal}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal-header">
                            <h2 className="cm-modal-title">{t('filters.models.addNew')}</h2>
                            <button className="cm-modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="cm-modal-form">
                            <div className="cm-form-group">
                                <label className="cm-form-label" htmlFor="modelName">
                                    {t('filters.models.modelName')} *
                                </label>
                                <input
                                    id="modelName"
                                    type="text"
                                    className="cm-form-input"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={t('filters.models.enterModelName')}
                                    required
                                />
                            </div>
                            <div className="cm-form-group">
                                <label className="cm-form-label" htmlFor="manufacturer">
                                    {t('filters.models.manufacturer')} *
                                </label>
                                <select
                                    id="manufacturer"
                                    className="cm-form-select"
                                    value={newManufacturerId}
                                    onChange={(e) => setNewManufacturerId(e.target.value)}
                                    required
                                >
                                    {manufacturers.map((mfr) => (
                                        <option key={mfr.id} value={mfr.id}>
                                            {mfr.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {error && <div className="cm-modal-error">{error}</div>}
                            <div className="cm-modal-actions">
                                <button
                                    type="button"
                                    className="cm-cancel-btn"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="cm-submit-btn"
                                    disabled={isSubmitting || !newName.trim() || !newManufacturerId}
                                >
                                    {isSubmitting ? t('common.adding') : t('common.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Models;