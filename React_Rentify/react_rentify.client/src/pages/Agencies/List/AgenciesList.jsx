// src/pages/Agencie/List/AgenciesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import agencyService from '../../../services/agencyService';
import './AgenciesList.css';

const AgenciesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [agencies, setAgencies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
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
        agency.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            </div>
        );
    }

    if (error) {
        return <div className="al-error-message">{error}</div>;
    }

    return (
        <div className="agencies-list-container">
            <div className="list-header">
                <h1 className="list-title">{t('agency.list.title')}</h1>
                <button className="btn-add" onClick={handleAdd}>
                    + {t('common.add')}
                </button>
            </div>

            <div className="search-bar-wrapper-2">
                <input
                    type="text"
                    className="search-input-2"
                    placeholder={t('agency.list.searchPlaceholder')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Table View (for larger screens) */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('agency.fields.name')}</th>
                            <th>{t('agency.fields.address')}</th>
                            <th>{t('agency.fields.email')}</th>
                            <th>{t('agency.fields.phone')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAgencies.map((agency) => (
                            <tr key={agency.id}>
                                <td>{agency.id}</td>
                                <td>{agency.address}</td>
                                <td>{agency.email}</td>
                                <td>{agency.phoneOne}</td>
                                <td className="actions-cell">
                                    <button
                                        className="action-button btn-details"
                                        onClick={() => handleDetails(agency.id)}
                                    >
                                        {t('common.details')}
                                    </button>
                                    <button
                                        className="action-button btn-edit"
                                        onClick={() => handleEdit(agency.id)}
                                    >
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        className="action-button btn-subscription"
                                        onClick={() => handleSubscription(agency.id)}
                                    >
                                        {t('agency.list.editSubscription')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View (for mobile screens) */}
            <div className="cards-wrapper">
                {filteredAgencies.map((agency) => (
                    <div className="agency-card" key={agency.id}>
                        <div className="card-content">
                            <p className="card-field">
                                <span className="field-label">{t('agency.fields.name')}:</span>{' '}
                                {agency.name}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.fields.address')}:</span>{' '}
                                {agency.address}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.fields.email')}:</span>{' '}
                                {agency.email}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.fields.phone')}:</span>{' '}
                                {agency.phoneOne}
                            </p>
                        </div>
                        <div className="card-actions">
                            <button
                                className="card-btn btn-details"
                                onClick={() => handleDetails(agency.id)}
                            >
                                {t('common.details')}
                            </button>
                            <button
                                className="card-btn btn-edit"
                                onClick={() => handleEdit(agency.id)}
                            >
                                {t('common.edit')}
                            </button>
                            <button
                                className="card-btn btn-subscription"
                                onClick={() => handleSubscription(agency.id)}
                            >
                                {t('agency.list.editSubscription')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgenciesList;
