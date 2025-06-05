// src/pages/Filters/CarYear/CarYear.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import carFiltersService from '../../../services/carFiltersService';
import './CarYear.css';

const CarYear = () => {
    const { t } = useTranslation();
    const [years, setYears] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [newYear, setNewYear] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchYears = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await carFiltersService.getCarYears();
            setYears(data);
        } catch (err) {
            console.error('❌ Error fetching car years:', err);
            setError(t('filters.years.fetchError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, [t]);

    const handleRemove = async (id) => {
        if (!window.confirm(t('filters.years.confirmRemove'))) {
            return;
        }
        try {
            await carFiltersService.removeCarYear(id);
            setYears((prev) => prev.filter((y) => y.id !== id));
        } catch (err) {
            console.error(`❌ Error removing year ${id}:`, err);
            setError(t('filters.years.removeError'));
        }
    };

    const openModal = () => {
        setNewYear('');
        setShowModal(true);
        setError(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setError(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const numericYear = parseInt(newYear, 10);
        if (isNaN(numericYear) || numericYear < 1900 || numericYear > new Date().getFullYear() + 1) {
            setError(t('filters.years.invalidYear'));
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const created = await carFiltersService.addCarYear({ yearValue: numericYear });
            setYears((prev) => [...prev, created]);
            closeModal();
        } catch (err) {
            console.error('❌ Error adding car year:', err);
            setError(t('filters.years.addError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="cy-loading-wrapper">
                <div className="cy-spinner" />
            </div>
        );
    }

    if (error && !showModal) {
        return <div className="cy-error-message">{error}</div>;
    }

    return (
        <div className="car-year-container">
            <div className="cy-header">
                <h1 className="cy-title">{t('filters.years.title')}</h1>
                <button className="cy-add-btn" onClick={openModal}>
                    + {t('filters.years.add')}
                </button>
            </div>

            <div className="cy-table-wrapper">
                <table className="cy-table">
                    <thead>
                        <tr>
                            <th>{t('filters.years.YearValue')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map((yr) => (
                            <tr key={yr.id}>
                                <td>{yr.yearValue}</td>
                                <td className="cy-actions-cell">
                                    <button
                                        className="cy-remove-btn"
                                        onClick={() => handleRemove(yr.id)}
                                    >
                                        {t('common.remove')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="cy-cards-wrapper">
                {years.map((yr) => (
                    <div className="cy-card" key={yr.id}>
                        <p className="cy-card-year">{yr.yearValue}</p>
                        <button
                            className="cy-remove-btn"
                            onClick={() => handleRemove(yr.id)}
                        >
                            {t('common.remove')}
                        </button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="cy-modal-overlay" onClick={closeModal}>
                    <div className="cy-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="cy-modal-title">{t('filters.years.add')}</h2>
                        {error && <div className="cy-modal-error">{error}</div>}
                        <form onSubmit={handleAdd} className="cy-modal-form">
                            <div className="cy-form-group">
                                <label htmlFor="year-input">{t('filters.years.yearLabel')}</label>
                                <input
                                    type="number"
                                    id="year-input"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                    placeholder={t('filters.years.yearPlaceholder')}
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    required
                                />
                            </div>
                            <div className="cy-modal-actions">
                                <button
                                    type="button"
                                    className="cy-btn-secondary"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="cy-btn-primary"
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

export default CarYear;
