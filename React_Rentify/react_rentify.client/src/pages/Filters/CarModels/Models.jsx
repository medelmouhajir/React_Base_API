// src/pages/Filters/CarModels/Models.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import carFiltersService from '../../../services/carFiltersService';
import './CarModels.css';

const Models = () => {
    const { t } = useTranslation();
    const [models, setModels] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newManufacturerId, setNewManufacturerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (isLoading) {
        return (
            <div className="cm-loading-wrapper">
                <div className="cm-spinner" />
            </div>
        );
    }

    if (error && !showModal) {
        return <div className="cm-error-message">{error}</div>;
    }

    return (
        <div className="car-models-container">
            <div className="cm-header">
                <h1 className="cm-title">{t('filters.models.title')}</h1>
                <button className="cm-add-btn" onClick={openModal}>
                    + {t('filters.models.add')}
                </button>
            </div>

            <div className="cm-table-wrapper">
                <table className="cm-table">
                    <thead>
                        <tr>
                            <th>{t('filters.models.nameLabel')}</th>
                            <th>{t('filters.models.manufacturerLabel')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((mdl) => {
                            const parent = manufacturers.find((m) => m.id === mdl.manufacturerId);
                            return (
                                <tr key={mdl.id}>
                                    <td>{mdl.name}</td>
                                    <td>{parent?.name || '-'}</td>
                                    <td className="cm-actions-cell">
                                        <button
                                            className="cm-remove-btn"
                                            onClick={() => handleRemove(mdl.id)}
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="cm-cards-wrapper">
                {models.map((mdl) => {
                    const parent = manufacturers.find((m) => m.id === mdl.manufacturerId);
                    return (
                        <div className="cm-card" key={mdl.id}>
                            <div className="cm-card-content">
                                <p className="cm-card-field">
                                    <span className="cm-field-label">{t('filters.models.nameLabel')}:</span> {mdl.name}
                                </p>
                                <p className="cm-card-field">
                                    <span className="cm-field-label">{t('filters.models.manufacturerLabel')}:</span> {parent?.name || '-'}
                                </p>
                            </div>
                            <button
                                className="cm-remove-btn"
                                onClick={() => handleRemove(mdl.id)}
                            >
                                {t('common.remove')}
                            </button>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="cm-modal-overlay" onClick={closeModal}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="cm-modal-title">{t('filters.models.add')}</h2>
                        {error && <div className="cm-modal-error">{error}</div>}
                        <form onSubmit={handleAdd} className="cm-modal-form">
                            <div className="cm-form-group">
                                <label htmlFor="mdl-name">{t('filters.models.nameLabel')}</label>
                                <input
                                    type="text"
                                    id="mdl-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={t('filters.models.namePlaceholder')}
                                    required
                                />
                            </div>
                            <div className="cm-form-group">
                                <label htmlFor="mdl-manufacturer">{t('filters.models.manufacturerLabel')}</label>
                                <select
                                    id="mdl-manufacturer"
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
                            <div className="cm-modal-actions">
                                <button
                                    type="button"
                                    className="cm-btn-secondary"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="cm-btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('common.saving') : t('common.save')}
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
