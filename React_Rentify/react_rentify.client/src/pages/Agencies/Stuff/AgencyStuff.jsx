// src/pages/Agencies/Stuff/AgencyStuff.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import agencyStaffService from '../../../services/agencyStaffService';
import './AgencyStuff.css';

const AgencyStuff = () => {
    const { t } = useTranslation();
    const { id: agencyId } = useParams();

    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phoneNumber: '',
        role: 'Manager',
        password: '',
        picture: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        const fetchStaff = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await agencyStaffService.getStaffByAgencyId(agencyId);
                setStaffList(data);
            } catch (err) {
                console.error('❌ Error fetching staff:', err);
                setError(t('agency.stuff.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchStaff();
    }, [agencyId, t]);

    const refreshStaff = async () => {
        try {
            const data = await agencyStaffService.getStaffByAgencyId(agencyId);
            setStaffList(data);
        } catch {
            /* ignore */
        }
    };

    const handleFormToggle = () => {
        setShowForm((prev) => !prev);
        setFormError(null);
        setFormData({
            email: '',
            fullName: '',
            phoneNumber: '',
            role: 'Manager',
            password: '',
            picture: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        const payload = {
            ...formData,
            agencyId
        };

        try {
            await agencyStaffService.createStaff(payload);
            setShowForm(false);
            await refreshStaff();
        } catch (err) {
            console.error('❌ Error creating staff:', err);
            setFormError(t('agency.stuff.createError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (staffId) => {
        const confirmed = window.confirm(t('agency.stuff.confirmRemove'));
        if (!confirmed) return;

        try {
            await agencyStaffService.deleteStaff(staffId);
            await refreshStaff();
        } catch (err) {
            console.error('❌ Error deleting staff:', err);
            alert(t('agency.stuff.removeError'));
        }
    };

    const handleResetPassword = async (staffId) => {
        const newPassword = window.prompt(t('agency.stuff.promptNewPassword'));
        if (!newPassword) return;

        try {
            await agencyStaffService.resetPassword(staffId, newPassword);
            alert(t('agency.stuff.resetSuccess'));
        } catch (err) {
            console.error('❌ Error resetting password:', err);
            alert(t('agency.stuff.resetError'));
        }
    };

    if (isLoading) {
        return (
            <div className="as-loading-wrapper">
                <div className="as-spinner" />
            </div>
        );
    }

    if (error) {
        return <div className="as-error-message">{error}</div>;
    }

    return (
        <div className="agency-stuff-container">
            <div className="header-row">
                <h1 className="page-title">{t('agency.stuff.title')}</h1>
                <button className="btn-toggle-form" onClick={handleFormToggle}>
                    {showForm ? t('common.cancel') : `+ ${t('agency.stuff.add')}`}
                </button>
            </div>

            {showForm && (
                <form className="add-staff-form" onSubmit={handleAdd} noValidate>
                    {formError && <div className="form-error">{formError}</div>}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">{t('agency.stuff.fields.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder={t('agency.stuff.placeholders.email')}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fullName">{t('agency.stuff.fields.fullName')}</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder={t('agency.stuff.placeholders.fullName')}
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phoneNumber">{t('agency.stuff.fields.phoneNumber')}</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                placeholder={t('agency.stuff.placeholders.phoneNumber')}
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">{t('agency.stuff.fields.role')}</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="Owner">{t('agency.stuff.roles.owner')}</option>
                                <option value="Manager">{t('agency.stuff.roles.manager')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">{t('agency.stuff.fields.password')}</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder={t('agency.stuff.placeholders.password')}
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="picture">{t('agency.stuff.fields.picture')}</label>
                            <input
                                type="text"
                                id="picture"
                                name="picture"
                                placeholder={t('agency.stuff.placeholders.picture')}
                                value={formData.picture}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('common.saving') : t('agency.stuff.add')}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleFormToggle}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            )}

            {/* Table View for larger screens */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('agency.stuff.fields.fullName')}</th>
                            <th>{t('agency.stuff.fields.email')}</th>
                            <th>{t('agency.stuff.fields.phoneNumber')}</th>
                            <th>{t('agency.stuff.fields.role')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map((staff) => (
                            <tr key={staff.id}>
                                <td>{staff.fullName}</td>
                                <td>{staff.email}</td>
                                <td>{staff.phoneNumber || '—'}</td>
                                <td>{t(`agency.stuff.roles.${staff.role.toLowerCase()}`)}</td>
                                <td className="actions-cell">
                                    <button
                                        className="action-button btn-reset"
                                        onClick={() => handleResetPassword(staff.id)}
                                    >
                                        {t('agency.stuff.resetPassword')}
                                    </button>
                                    <button
                                        className="action-button btn-remove"
                                        onClick={() => handleRemove(staff.id)}
                                    >
                                        {t('agency.stuff.remove')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View for mobile screens */}
            <div className="cards-wrapper">
                {staffList.map((staff) => (
                    <div className="staff-card" key={staff.id}>
                        <div className="card-content">
                            <p className="card-field">
                                <span className="field-label">{t('agency.stuff.fields.fullName')}:</span>{' '}
                                {staff.fullName}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.stuff.fields.email')}:</span>{' '}
                                {staff.email}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.stuff.fields.phoneNumber')}:</span>{' '}
                                {staff.phoneNumber || '—'}
                            </p>
                            <p className="card-field">
                                <span className="field-label">{t('agency.stuff.fields.role')}:</span>{' '}
                                {t(`agency.stuff.roles.${staff.role.toLowerCase()}`)}
                            </p>
                        </div>
                        <div className="card-actions">
                            <button
                                className="card-btn btn-reset"
                                onClick={() => handleResetPassword(staff.id)}
                            >
                                {t('agency.stuff.resetPassword')}
                            </button>
                            <button
                                className="card-btn btn-remove"
                                onClick={() => handleRemove(staff.id)}
                            >
                                {t('agency.stuff.remove')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgencyStuff;
