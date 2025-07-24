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
                <p className="cy-loading-text">{t('common.loading')}</p>
            </div>
        );
    }

    if (error && !showModal) {
        return (
            <div className="cy-error-container">
                <div className="cy-error-message">{error}</div>
                <button className="cy-retry-btn" onClick={fetchYears}>
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="car-year-container">
            <div className="cy-header">
                <h1 className="cy-title">{t('filters.years.title')}</h1>
                <button className="cy-add-btn" onClick={openModal}>
                    <span className="cy-add-icon">+</span>
                    <span className="cy-add-text">{t('filters.years.add')}</span>
                </button>
            </div>

            {years.length === 0 ? (
                <div className="cy-no-results">
                    <p>{t('filters.years.noResults')}</p>
                    <button className="cy-add-btn" onClick={openModal}>
                        <span className="cy-add-icon">+</span>
                        <span className="cy-add-text">{t('filters.years.addFirst')}</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="cy-desktop-view">
                        <div className="cy-table-wrapper">
                            <table className="cy-table">
                                <thead>
                                    <tr>
                                        <th>{t('filters.years.YearValue')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {years.map((year) => (
                                        <tr key={year.id}>
                                            <td className="cy-year-cell">{year.yearValue}</td>
                                            <td className="cy-actions-cell">
                                                <button
                                                    className="cy-remove-btn"
                                                    onClick={() => handleRemove(year.id)}
                                                    title={t('common.remove')}
                                                >
                                                    {t('common.remove')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="cy-mobile-view">
                        <div className="cy-cards-wrapper">
                            {years.map((year) => (
                                <div key={year.id} className="cy-card">
                                    <div className="cy-card-content">
                                        <div className="cy-card-main">
                                            <h3 className="cy-card-year">{year.yearValue}</h3>
                                            <span className="cy-card-label">{t('filters.years.YearValue')}</span>
                                        </div>
                                        <div className="cy-card-actions">
                                            <button
                                                className="cy-card-remove-btn"
                                                onClick={() => handleRemove(year.id)}
                                                title={t('common.remove')}
                                            >
                                                <span className="cy-remove-icon">×</span>
                                                <span className="cy-remove-text">{t('common.remove')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="cy-modal-overlay" onClick={closeModal}>
                    <div className="cy-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="cy-modal-header">
                            <h2 className="cy-modal-title">{t('filters.years.add')}</h2>
                            <button
                                className="cy-modal-close"
                                onClick={closeModal}
                                title={t('common.close')}
                            >
                                ×
                            </button>
                        </div>
                        <div className="cy-modal-body">
                            {error && <div className="cy-modal-error">{error}</div>}
                            <form onSubmit={handleAdd} className="cy-modal-form">
                                <div className="cy-form-group">
                                    <label htmlFor="year-input" className="cy-form-label">
                                        {t('filters.years.yearLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        id="year-input"
                                        className="cy-form-input"
                                        value={newYear}
                                        onChange={(e) => setNewYear(e.target.value)}
                                        placeholder={t('filters.years.yearPlaceholder')}
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                        required
                                        autoFocus
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
                </div>
            )}
        </div>
    );
};

export default CarYear;