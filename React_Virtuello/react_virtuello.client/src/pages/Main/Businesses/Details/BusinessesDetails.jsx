import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layouts/MainLayout/Layout/MainLayout';
import { businessService } from '@/services/businessService';
import './BusinessesDetails.css';

const BusinessesDetails = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const data = await businessService.getById(id);
                setBusiness(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
    }, [id]);

    return (
        <MainLayout pageTitle={t('businesses.detailsTitle')}>
            <div className="businesses-details">
                {loading && <p>{t('common.loading')}</p>}
                {error && <p className="error-message">{error}</p>}
                {business && (
                    <div className="businesses-details__card">
                        <h1>{business.name}</h1>
                        {business.description && (
                            <p className="businesses-details__description">{business.description}</p>
                        )}
                        <ul className="businesses-details__info">
                            {business.phone && (
                                <li>
                                    <strong>{t('businesses.fields.phone')}:</strong> {business.phone}
                                </li>
                            )}
                            {business.email && (
                                <li>
                                    <strong>{t('businesses.fields.email')}:</strong> {business.email}
                                </li>
                            )}
                            {business.address && (
                                <li>
                                    <strong>{t('businesses.fields.address')}:</strong> {business.address}
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default BusinessesDetails;