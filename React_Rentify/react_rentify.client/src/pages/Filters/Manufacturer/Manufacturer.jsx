// src/pages/Filters/Manufacturer/Manufacturer.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import carFiltersService from '../../../services/carFiltersService';
import './Manufacturer.css';

const Manufacturer = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();

    // State management
    const [manufacturers, setManufacturers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mobile view state
    const [isMobileView, setIsMobileView] = useState(false);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        checkMobileView();
        window.addEventListener('resize', checkMobileView);

        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

    // Fetch manufacturers data
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

    // Handle manufacturer removal
    const handleRemove = async (id) => {
        if (!window.confirm(t('filters.manufacturer.confirmRemove'))) {
            return;
        }

        setError(null);
        try {
            await carFiltersService.removeManufacturer(id);
            setManufacturers((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
            console.error(`❌ Error removing manufacturer ${id}:`, err);
            setError(t('filters.manufacturer.removeError'));
        }
    };

    // Modal handlers
    const openModal = () => {
        setNewName('');
        setShowModal(true);
        setError(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setNewName('');
        setError(null);
    };

    // Handle form submission
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

    // Loading state component
    if (isLoading) {
        return (
            <div className={`manufacturer-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="mf-loading-wrapper">
                    <div className="mf-spinner" />
                    <p className="mf-loading-text">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    // Error state component (when not in modal)
    if (error && !showModal) {
        return (
            <div className={`manufacturer-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="mf-error-message">
                    <div className="mf-error-icon">⚠️</div>
                    <p>{error}</p>
                    <button onClick={fetchManufacturers} className="mf-retry-btn">
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`manufacturer-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="mf-header">
                <div className="mf-title-section">
                    <h1 className="mf-title">{t('filters.manufacturer.title')}</h1>
                    <p className="mf-subtitle">{t('filters.manufacturer.subtitle')}</p>
                </div>
                <button
                    className="mf-add-btn"
                    onClick={openModal}
                    aria-label={t('filters.manufacturer.add')}
                >
                    <span className="mf-add-icon">+</span>
                    <span className="mf-add-text">{t('filters.manufacturer.add')}</span>
                </button>
            </div>

            {/* Empty state */}
            {manufacturers.length === 0 ? (
                <div className="mf-empty-state">
                    <div className="mf-empty-icon">🏭</div>
                    <h3 className="mf-empty-title">{t('filters.manufacturer.emptyTitle')}</h3>
                    <p className="mf-empty-description">{t('filters.manufacturer.emptyDescription')}</p>
                    <button className="mf-empty-action-btn" onClick={openModal}>
                        {t('filters.manufacturer.addFirst')}
                    </button>
                </div>
            ) : (
                <>
                    {/* Stats bar */}
                    <div className="mf-stats-bar">
                        <div className="mf-stats-item">
                            <span className="mf-stats-value">{manufacturers.length}</span>
                            <span className="mf-stats-label">{t('filters.manufacturer.totalCount')}</span>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    {!isMobileView && (
                        <div className="mf-table-wrapper desktop-view">
                            <table className="mf-table">
                                <thead>
                                    <tr>
                                        <th className="mf-th-name">{t('filters.manufacturer.nameLabel')}</th>
                                        <th className="mf-th-actions">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manufacturers.map((mfr) => (
                                        <tr key={mfr.id} className="mf-table-row">
                                            <td className="mf-td-name">
                                                <div className="mf-manufacturer-name">
                                                    {mfr.name}
                                                </div>
                                            </td>
                                            <td className="mf-td-actions">
                                                <div className="mf-actions-cell">
                                                    <button
                                                        className="mf-remove-btn"
                                                        onClick={() => handleRemove(mfr.id)}
                                                        aria-label={t('common.remove') + ' ' + mfr.name}
                                                    >
                                                        <span className="mf-remove-icon">🗑️</span>
                                                        <span className="mf-remove-text">{t('common.remove')}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Mobile Cards View */}
                    {isMobileView && (
                        <div className="mf-cards-wrapper mobile-view">
                            {manufacturers.map((mfr) => (
                                <div className="mf-card" key={mfr.id}>
                                    <div className="mf-card-content">
                                        <div className="mf-card-header">
                                            <h3 className="mf-card-name">{mfr.name}</h3>
                                            <div className="mf-card-id">ID: {mfr.id}</div>
                                        </div>
                                        <div className="mf-card-actions">
                                            <button
                                                className="mf-card-remove-btn"
                                                onClick={() => handleRemove(mfr.id)}
                                                aria-label={t('common.remove') + ' ' + mfr.name}
                                            >
                                                <span className="mf-remove-icon">🗑️</span>
                                                <span>{t('common.remove')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Add Manufacturer Modal */}
            {showModal && (
                <div className="mf-modal-overlay" onClick={closeModal}>
                    <div
                        className="mf-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="modal-title"
                        aria-modal="true"
                    >
                        <div className="mf-modal-header">
                            <h2 id="modal-title" className="mf-modal-title">
                                {t('filters.manufacturer.add')}
                            </h2>
                            <button
                                className="mf-modal-close"
                                onClick={closeModal}
                                aria-label={t('common.close')}
                            >
                                ×
                            </button>
                        </div>

                        <div className="mf-modal-body">
                            {error && (
                                <div className="mf-modal-error" role="alert">
                                    <span className="mf-error-icon">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleAdd} className="mf-modal-form">
                                <div className="mf-form-group">
                                    <label htmlFor="mfr-name" className="mf-form-label">
                                        {t('filters.manufacturer.nameLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        id="mfr-name"
                                        className="mf-form-input"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder={t('filters.manufacturer.namePlaceholder')}
                                        required
                                        autoFocus
                                        disabled={isSubmitting}
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
                                        disabled={isSubmitting || !newName.trim()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="mf-spinner-sm"></span>
                                                {t('common.saving')}
                                            </>
                                        ) : (
                                            t('common.save')
                                        )}
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

export default Manufacturer;