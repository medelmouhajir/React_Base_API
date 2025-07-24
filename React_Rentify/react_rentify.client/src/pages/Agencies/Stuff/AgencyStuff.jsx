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
            <div className="agency-stuff-loading">
                <div className="loading-spinner" />
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="agency-stuff-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button
                    className="btn-retry"
                    onClick={() => window.location.reload()}
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="agency-stuff-container">
            {/* Header Section */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">{t('agency.stuff.title')}</h1>
                    <p className="page-subtitle">
                        {t('agency.stuff.subtitle', { count: staffList.length })}
                    </p>
                </div>
                <button className="btn-add-staff" onClick={handleFormToggle}>
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {showForm ? t('common.cancel') : t('agency.stuff.add')}
                </button>
            </div>

            {/* Add Staff Form */}
            {showForm && (
                <div className="form-card">
                    <div className="form-header">
                        <h2 className="form-title">{t('agency.stuff.addNew')}</h2>
                        <p className="form-description">{t('agency.stuff.formDescription')}</p>
                    </div>

                    <form className="staff-form" onSubmit={handleAdd} noValidate>
                        {formError && (
                            <div className="form-error">
                                <svg className="error-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                {formError}
                            </div>
                        )}

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">
                                    {t('agency.stuff.fields.email')}
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    placeholder={t('agency.stuff.placeholders.email')}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="fullName" className="form-label">
                                    {t('agency.stuff.fields.fullName')}
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    className="form-input"
                                    placeholder={t('agency.stuff.placeholders.fullName')}
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber" className="form-label">
                                    {t('agency.stuff.fields.phoneNumber')}
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    className="form-input"
                                    placeholder={t('agency.stuff.placeholders.phoneNumber')}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role" className="form-label">
                                    {t('agency.stuff.fields.role')}
                                    <span className="required">*</span>
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    className="form-select"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Manager">{t('agency.stuff.roles.manager')}</option>
                                    <option value="Employee">{t('agency.stuff.roles.employee')}</option>
                                    <option value="Admin">{t('agency.stuff.roles.admin')}</option>
                                </select>
                            </div>

                            <div className="form-group form-group-full">
                                <label htmlFor="password" className="form-label">
                                    {t('agency.stuff.fields.password')}
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    placeholder={t('agency.stuff.placeholders.password')}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="btn-spinner" />
                                        {t('common.saving')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('agency.stuff.add')}
                                    </>
                                )}
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
                </div>
            )}

            {/* Staff List */}
            <div className="staff-content">
                {staffList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3>{t('agency.stuff.noStaff')}</h3>
                        <p>{t('agency.stuff.noStaffDescription')}</p>
                        <button className="btn-primary" onClick={handleFormToggle}>
                            {t('agency.stuff.addFirst')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="table-wrapper desktop-table">
                            <table className="staff-table">
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
                                        <tr key={staff.id} className="table-row">
                                            <td className="staff-name">
                                                <div className="name-cell">
                                                    <div className="avatar">
                                                        {staff.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{staff.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="staff-email">{staff.email}</td>
                                            <td className="staff-phone">{staff.phoneNumber || '—'}</td>
                                            <td className="staff-role">
                                                <span className={`role-badge role-${staff.role.toLowerCase()}`}>
                                                    {t(`agency.stuff.roles.${staff.role.toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="staff-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn btn-reset"
                                                        onClick={() => handleResetPassword(staff.id)}
                                                        title={t('agency.stuff.resetPassword')}
                                                    >
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="action-btn btn-remove"
                                                        onClick={() => handleRemove(staff.id)}
                                                        title={t('agency.stuff.remove')}
                                                    >
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="mobile-cards">
                            {staffList.map((staff) => (
                                <div key={staff.id} className="staff-card">
                                    <div className="card-header">
                                        <div className="staff-info">
                                            <div className="avatar">
                                                {staff.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="staff-details">
                                                <h3 className="staff-name">{staff.fullName}</h3>
                                                <span className={`role-badge role-${staff.role.toLowerCase()}`}>
                                                    {t(`agency.stuff.roles.${staff.role.toLowerCase()}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <div className="field-group">
                                            <label className="field-label">
                                                {t('agency.stuff.fields.email')}:
                                            </label>
                                            <span className="field-value">{staff.email}</span>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                {t('agency.stuff.fields.phoneNumber')}:
                                            </label>
                                            <span className="field-value">{staff.phoneNumber || '—'}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="card-btn btn-reset"
                                            onClick={() => handleResetPassword(staff.id)}
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            {t('agency.stuff.resetPassword')}
                                        </button>
                                        <button
                                            className="card-btn btn-remove"
                                            onClick={() => handleRemove(staff.id)}
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            {t('agency.stuff.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AgencyStuff;