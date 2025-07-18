import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import customerService from '../../../services/customerService';
import blacklistService from '../../../services/blacklistService';
import './CustomerEdit.css';

const CustomerEdit = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        FullName: '',
        PhoneNumber: '',
        Email: '',
        NationalId: '',
        PassportId: '',
        LicenseNumber: '',
        DateOfBirth: '',
        Address: '',
        IsBlacklisted: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [showBlacklistModal, setShowBlacklistModal] = useState(false);
    const [blacklistResults, setBlacklistResults] = useState([]);

    // Load customer data on component mount
    useEffect(() => {
        const loadCustomer = async () => {
            try {
                setIsLoading(true);
                const customer = await customerService.getById(id);

                // Format date for input field
                const dateOfBirth = customer.dateOfBirth
                    ? new Date(customer.dateOfBirth).toISOString().split('T')[0]
                    : '';

                setFormData({
                    FullName: customer.fullName || '',
                    PhoneNumber: customer.phoneNumber || '',
                    Email: customer.email || '',
                    NationalId: customer.nationalId || '',
                    PassportId: customer.passportId || '',
                    LicenseNumber: customer.licenseNumber || '',
                    DateOfBirth: dateOfBirth,
                    Address: customer.address || '',
                    IsBlacklisted: customer.isBlacklisted || false,
                });
            } catch (err) {
                console.error('❌ Error loading customer:', err);
                setError(t('customer.edit.loadError'));
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadCustomer();
        }
    }, [id, t]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};

        // Required fields validation
        if (!formData.FullName.trim()) {
            errors.FullName = t('validation.required');
        }

        if (!formData.PhoneNumber.trim()) {
            errors.PhoneNumber = t('validation.required');
        }

        // At least one ID field is required
        if (!formData.NationalId.trim() && !formData.PassportId.trim()) {
            errors.NationalId = t('validation.atLeastOneIdRequired');
            errors.PassportId = t('validation.atLeastOneIdRequired');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const checkBlacklist = async () => {
        try {
            const searchParams = {
                nationalId: formData.NationalId || '',
                passportId: formData.PassportId || '',
                licenseNumber: formData.LicenseNumber || '',
            };

            const results = await blacklistService.search(searchParams);
            setBlacklistResults(results || []);

            if (results && results.length > 0) {
                setShowBlacklistModal(true);
                return true; // Blacklisted
            }

            return false; // Not blacklisted
        } catch (err) {
            console.error('❌ Error checking blacklist:', err);
            return false; // Error treated as not blacklisted
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form first
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Check blacklist before saving if not already blacklisted
            if (!formData.IsBlacklisted) {
                const isBlacklisted = await checkBlacklist();
                if (isBlacklisted) {
                    // Modal will be shown, submission will be paused
                    setIsSubmitting(false);
                    return;
                }
            }

            // Proceed with update
            await saveCustomer();
        } catch (err) {
            console.error('❌ Error in submission process:', err);
            setError(t('customer.edit.error'));
            setIsSubmitting(false);
        }
    };

    const saveCustomer = async () => {
        try {
            const payload = {
                Id: id,
                AgencyId: agencyId,
                FullName: formData.FullName,
                PhoneNumber: formData.PhoneNumber,
                Email: formData.Email,
                NationalId: formData.NationalId || null,
                PassportId: formData.PassportId || null,
                LicenseNumber: formData.LicenseNumber,
                DateOfBirth: formData.DateOfBirth
                    ? new Date(formData.DateOfBirth).toISOString()
                    : null,
                Address: formData.Address,
                IsBlacklisted: formData.IsBlacklisted,
            };

            await customerService.update(id, payload);
            navigate('/customers');
        } catch (err) {
            console.error('❌ Error updating customer:', err);
            setError(t('customer.edit.error'));
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/customers');
    };

    const handleContinueWithBlacklisted = () => {
        setShowBlacklistModal(false);
        saveCustomer();
    };

    const handleCancelBlacklisted = () => {
        setShowBlacklistModal(false);
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className={`editcustomer-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-spinner"></div>
                <p>{t('customer.loading')}</p>
            </div>
        );
    }

    return (
        <div className={`editcustomer-container ${isDarkMode ? 'dark' : ''}`}>
            <h1 className="editcustomer-title">{t('customer.edit.title')}</h1>

            {error && <div className="editcustomer-error">{error}</div>}

            <form
                className="editcustomer-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Full Name */}
                <div className={`form-group ${validationErrors.FullName ? 'has-error' : ''}`}>
                    <label htmlFor="FullName">
                        {t('customer.fields.fullName')} *
                    </label>
                    <input
                        type="text"
                        id="FullName"
                        name="FullName"
                        placeholder={t('customer.placeholders.fullName')}
                        value={formData.FullName}
                        onChange={handleChange}
                        required
                    />
                    {validationErrors.FullName && (
                        <div className="error-message">{validationErrors.FullName}</div>
                    )}
                </div>

                {/* Phone Number */}
                <div className={`form-group ${validationErrors.PhoneNumber ? 'has-error' : ''}`}>
                    <label htmlFor="PhoneNumber">
                        {t('customer.fields.phoneNumber')} *
                    </label>
                    <input
                        type="tel"
                        id="PhoneNumber"
                        name="PhoneNumber"
                        placeholder={t('customer.placeholders.phoneNumber')}
                        value={formData.PhoneNumber}
                        onChange={handleChange}
                        required
                    />
                    {validationErrors.PhoneNumber && (
                        <div className="error-message">{validationErrors.PhoneNumber}</div>
                    )}
                </div>

                {/* Email */}
                <div className="form-group">
                    <label htmlFor="Email">
                        {t('customer.fields.email')}
                    </label>
                    <input
                        type="email"
                        id="Email"
                        name="Email"
                        placeholder={t('customer.placeholders.email')}
                        value={formData.Email}
                        onChange={handleChange}
                    />
                </div>

                {/* ID Fields Section */}
                <div className="ids-section">
                    <div className="ids-header">
                        <div className="ids-title">{t('customer.sections.identification')}</div>
                        <div className="ids-note">{t('customer.idRequirement')}</div>
                    </div>

                    {/* National ID */}
                    <div className={`form-group ${validationErrors.NationalId ? 'has-error' : ''}`}>
                        <label htmlFor="NationalId">
                            {t('customer.fields.nationalId')}
                        </label>
                        <input
                            type="text"
                            id="NationalId"
                            name="NationalId"
                            placeholder={t('customer.placeholders.nationalId')}
                            value={formData.NationalId}
                            onChange={handleChange}
                        />
                        {validationErrors.NationalId && (
                            <div className="error-message">{validationErrors.NationalId}</div>
                        )}
                    </div>

                    {/* Passport ID */}
                    <div className={`form-group ${validationErrors.PassportId ? 'has-error' : ''}`}>
                        <label htmlFor="PassportId">
                            {t('customer.fields.passportId')}
                        </label>
                        <input
                            type="text"
                            id="PassportId"
                            name="PassportId"
                            placeholder={t('customer.placeholders.passportId')}
                            value={formData.PassportId}
                            onChange={handleChange}
                        />
                        {validationErrors.PassportId && (
                            <div className="error-message">{validationErrors.PassportId}</div>
                        )}
                    </div>
                </div>

                {/* License Number */}
                <div className="form-group">
                    <label htmlFor="LicenseNumber">
                        {t('customer.fields.licenseNumber')}
                    </label>
                    <input
                        type="text"
                        id="LicenseNumber"
                        name="LicenseNumber"
                        placeholder={t('customer.placeholders.licenseNumber')}
                        value={formData.LicenseNumber}
                        onChange={handleChange}
                    />
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                    <label htmlFor="DateOfBirth">
                        {t('customer.fields.dateOfBirth')}
                    </label>
                    <input
                        type="date"
                        id="DateOfBirth"
                        name="DateOfBirth"
                        value={formData.DateOfBirth}
                        onChange={handleChange}
                    />
                </div>

                {/* Address */}
                <div className="form-group">
                    <label htmlFor="Address">
                        {t('customer.fields.address')}
                    </label>
                    <input
                        type="text"
                        id="Address"
                        name="Address"
                        placeholder={t('customer.placeholders.address')}
                        value={formData.Address}
                        onChange={handleChange}
                    />
                </div>

                {/* Blacklisted Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsBlacklisted"
                        name="IsBlacklisted"
                        checked={formData.IsBlacklisted}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsBlacklisted">
                        {t('customer.fields.isBlacklisted')}
                    </label>
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
                        {isSubmitting
                            ? t('common.updating')
                            : t('common.update')}
                    </button>
                </div>
            </form>

            {/* Blacklist Check Modal */}
            {showBlacklistModal && (
                <div className="modal-overlay">
                    <div className="blacklist-modal">
                        <h2 className="blacklist-modal-title">{t('customer.blacklist.warning')}</h2>

                        <div className="blacklist-content">
                            <p className="blacklist-description">
                                {t('customer.blacklist.description')}
                            </p>

                            <div className="blacklist-entries">
                                {blacklistResults.map(entry => (
                                    <div key={entry.id} className="blacklist-entry">
                                        <div className="entry-name">{entry.fullName}</div>
                                        <div className="entry-reason">{entry.reason}</div>
                                        <div className="entry-agency">
                                            {t('customer.blacklist.reportedBy')}: {entry.reportedByAgencyName}
                                        </div>
                                        <div className="entry-date">
                                            {new Date(entry.dateAdded).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="blacklist-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCancelBlacklisted}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleContinueWithBlacklisted}
                            >
                                {t('customer.blacklist.continue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerEdit;