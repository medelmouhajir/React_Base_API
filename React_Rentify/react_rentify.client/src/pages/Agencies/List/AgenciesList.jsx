// src/pages/Agencies/List/AgenciesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import agencyService from '../../../services/agencyService';
import './AgenciesList.css';

const AgenciesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [agencies, setAgencies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await agencyService.getAll();
                setAgencies(data);
            } catch (err) {
                console.error('❌ Error fetching agencies:', err);
                setError(t('agency.list.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgencies();
    }, [t]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredAgencies = agencies.filter((agency) =>
        agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        navigate('/agencies/create');
    };

    const handleDetails = (id) => {
        navigate(`/agencies/${id}`);
    };

    const handleEdit = (id) => {
        navigate(`/agencies/edit/${id}`);
    };

    const handleSubscription = (id) => {
        navigate(`/agencies/${id}/stuff`);
    };

    if (isLoading) {
        return (
            <div className="al-loading-wrapper">
                <div className="al-spinner" />
                <p className="al-loading-text">{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="al-error-wrapper">
                <div className="al-error-message">{error}</div>
                <button
                    className="al-retry-btn"
                    onClick={() => window.location.reload()}
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className={`agencies-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="al-header">
                <h1 className="al-title">{t('agency.list.title')}</h1>
                <button className="al-btn-add" onClick={handleAdd}>
                    <span className="al-btn-icon">+</span>
                    <span className="al-btn-text">{t('common.add')}</span>
                </button>
            </div>

            {/* Search Section */}
            <div className="al-search-wrapper">
                <div className="al-search-container">
                    <input
                        type="text"
                        className="al-search-input"
                        placeholder={t('agency.list.searchPlaceholder')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <div className="al-search-icon">🔍</div>
                </div>
            </div>

            {/* Results Count */}
            <div className="al-results-info">
                <span className="al-results-count">
                    {filteredAgencies.length} {t('agency.list.agencies')}
                </span>
            </div>

            {/* Empty State */}
            {filteredAgencies.length === 0 && !isLoading && (
                <div className="al-empty-state">
                    <div className="al-empty-icon">🏢</div>
                    <h3 className="al-empty-title">
                        {searchTerm ? t('agency.list.noResults') : t('agency.list.noAgencies')}
                    </h3>
                    <p className="al-empty-description">
                        {searchTerm
                            ? t('agency.list.tryDifferentSearch')
                            : t('agency.list.createFirstAgency')
                        }
                    </p>
                    {!searchTerm && (
                        <button className="al-empty-action" onClick={handleAdd}>
                            {t('agency.list.createAgency')}
                        </button>
                    )}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="al-desktop-view">
                <div className="al-table-wrapper">
                    <table className="al-table">
                        <thead>
                            <tr>
                                <th>{t('agency.fields.name')}</th>
                                <th>{t('agency.fields.address')}</th>
                                <th>{t('agency.fields.email')}</th>
                                <th>{t('agency.fields.phoneOne')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgencies.map((agency) => (
                                <tr key={agency.id} className="al-table-row">
                                    <td className="al-cell-name">{agency.name}</td>
                                    <td className="al-cell-address">{agency.address}</td>
                                    <td className="al-cell-email">
                                        <a href={`mailto:${agency.email}`} className="al-email-link">
                                            {agency.email}
                                        </a>
                                    </td>
                                    <td className="al-cell-phone">
                                        {agency.phoneOne && (
                                            <a href={`tel:${agency.phoneOne}`} className="al-phone-link">
                                                {agency.phoneOne}
                                            </a>
                                        )}
                                    </td>
                                    <td className="al-cell-actions">
                                        <div className="al-actions">
                                            <button
                                                className="al-action-btn al-btn-details"
                                                onClick={() => handleDetails(agency.id)}
                                                title={t('common.details')}
                                            >
                                                {t('common.details')}
                                            </button>
                                            <button
                                                className="al-action-btn al-btn-edit"
                                                onClick={() => handleEdit(agency.id)}
                                                title={t('common.edit')}
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                className="al-action-btn al-btn-subscription"
                                                onClick={() => handleSubscription(agency.id)}
                                                title={t('agency.list.editSubscription')}
                                            >
                                                {t('agency.list.subscription')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards View */}
            <div className="al-mobile-view">
                <div className="al-cards-container">
                    {filteredAgencies.map((agency) => (
                        <div key={agency.id} className="al-agency-card">
                            <div className="al-card-header">
                                <h3 className="al-card-title">{agency.name}</h3>
                            </div>

                            <div className="al-card-content">
                                {agency.address && (
                                    <div className="al-card-field">
                                        <span className="al-field-label">{t('agency.fields.address')}:</span>
                                        <span className="al-field-value">{agency.address}</span>
                                    </div>
                                )}

                                {agency.email && (
                                    <div className="al-card-field">
                                        <span className="al-field-label">{t('agency.fields.email')}:</span>
                                        <a href={`mailto:${agency.email}`} className="al-field-link">
                                            {agency.email}
                                        </a>
                                    </div>
                                )}

                                {agency.phoneOne && (
                                    <div className="al-card-field">
                                        <span className="al-field-label">{t('agency.fields.phoneOne')}:</span>
                                        <a href={`tel:${agency.phoneOne}`} className="al-field-link">
                                            {agency.phoneOne}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="al-card-actions">
                                <button
                                    className="al-card-btn al-btn-details"
                                    onClick={() => handleDetails(agency.id)}
                                >
                                    {t('common.details')}
                                </button>
                                <button
                                    className="al-card-btn al-btn-edit"
                                    onClick={() => handleEdit(agency.id)}
                                >
                                    {t('common.edit')}
                                </button>
                                <button
                                    className="al-card-btn al-btn-subscription"
                                    onClick={() => handleSubscription(agency.id)}
                                >
                                    {t('agency.list.subscription')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgenciesList;