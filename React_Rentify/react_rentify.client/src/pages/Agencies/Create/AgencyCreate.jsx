// src/pages/Agencie/Create/AgencyCreate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import agencyService from '../../../services/agencyService';
import './AgencyCreate.css';

const AgencyCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        phoneOne: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await agencyService.create(formData);
            navigate('/agencies');
        } catch (err) {
            console.error('❌ Error creating agency:', err);
            setError(t('agency.create.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/agencies');
    };

    return (
        <div className="agency-create-container">
            <h1 className="page-title">{t('agency.create.title')}</h1>

            {error && <div className="error-message">{error}</div>}

            <form className="agency-form" onSubmit={handleSubmit} noValidate>
                {/* Name Field */}
                <div className="form-group">
                    <label htmlFor="name">{t('agency.fields.name')}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder={t('agency.placeholders.name')}
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Address Field */}
                <div className="form-group">
                    <label htmlFor="address">{t('agency.fields.address')}</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        placeholder={t('agency.placeholders.address')}
                        value={formData.address}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Email Field */}
                <div className="form-group">
                    <label htmlFor="email">{t('agency.fields.email')}</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder={t('agency.placeholders.email')}
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Phone Field */}
                <div className="form-group">
                    <label htmlFor="phoneOne">{t('agency.fields.phone')}</label>
                    <input
                        type="tel"
                        id="phoneOne"
                        name="phoneOne"
                        placeholder={t('agency.placeholders.phone')}
                        value={formData.phoneOne}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AgencyCreate;
