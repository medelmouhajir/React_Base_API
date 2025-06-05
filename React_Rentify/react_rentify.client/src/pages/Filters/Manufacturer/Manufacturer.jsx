// src/pages/Filters/Manufacturer/Manufacturer.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import carFiltersService from '../../../services/carFiltersService';
import './Manufacturer.css';

const Manufacturer = () => {
    const { t } = useTranslation();
    const [manufacturers, setManufacturers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchManufacturers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await carFiltersService.getManufacturers();
            setManufacturers(data);
        } catch (err) {
            console.error('❌ Error fetching manufacturers:', err);
            setError(t('filters.manufacturer.fetchError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManufacturers();
    }, [t]);

    const handleRemove = async (id) => {
        if (!window.confirm(t('filters.manufacturer.confirmRemove'))) {
            return;
        }
        try {
            await carFiltersService.removeManufacturer(id);
            setManufacturers((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
            console.error(`❌ Error removing manufacturer ${id}:`, err);
            setError(t('filters.manufacturer.removeError'));
        }
    };

    const openModal = () => {
        setNewName('');
        setShowModal(true);
        setError(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setError(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            setError(t('filters.manufacturer.nameRequired'));
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const created = await carFiltersService.addManufacturer({ name: newName.trim() });
            setManufacturers((prev) => [...prev, created]);
            closeModal();
        } catch (err) {
            console.error('❌ Error adding manufacturer:', err);
            setError(t('filters.manufacturer.addError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mf-loading-wrapper">
                <div className="mf-spinner" />
            </div>
        );
    }

    if (error && !showModal) {
        return <div className="mf-error-message">{error}</div>;
    }

    return (
        <div className="manufacturer-container">
            <div className="mf-header">
                <h1 className="mf-title">{t('filters.manufacturer.title')}</h1>
                <button className="mf-add-btn" onClick={openModal}>
                    + {t('filters.manufacturer.add')}
                </button>
            </div>

            <div className="mf-table-wrapper">
                <table className="mf-table">
                    <thead>
                        <tr>
                            <th>{t('filters.manufacturer.nameLabel')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {manufacturers.map((mfr) => (
                            <tr key={mfr.id}>
                                <td>{mfr.name}</td>
                                <td className="mf-actions-cell">
                                    <button
                                        className="mf-remove-btn"
                                        onClick={() => handleRemove(mfr.id)}
                                    >
                                        {t('common.remove')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mf-cards-wrapper">
                {manufacturers.map((mfr) => (
                    <div className="mf-card" key={mfr.id}>
                        <p className="mf-card-name">{mfr.name}</p>
                        <button
                            className="mf-remove-btn"
                            onClick={() => handleRemove(mfr.id)}
                        >
                            {t('common.remove')}
                        </button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="mf-modal-overlay" onClick={closeModal}>
                    <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mf-modal-title">{t('filters.manufacturer.add')}</h2>
                        {error && <div className="mf-modal-error">{error}</div>}
                        <form onSubmit={handleAdd} className="mf-modal-form">
                            <div className="mf-form-group">
                                <label htmlFor="mfr-name">{t('filters.manufacturer.nameLabel')}</label>
                                <input
                                    type="text"
                                    id="mfr-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={t('filters.manufacturer.namePlaceholder')}
                                    required
                                />
                            </div>
                            <div className="mf-modal-actions">
                                <button
                                    type="button"
                                    className="mf-btn-secondary"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="mf-btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? t('common.saving')
                                        : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Manufacturer;
