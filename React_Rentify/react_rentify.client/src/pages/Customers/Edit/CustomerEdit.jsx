import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import customerService from '../../../services/customerService';
import './CustomerEdit.css';

const CustomerEdit = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
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
        AgencyId: agencyId || '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch existing customer on mount
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const dto = await customerService.getById(id);
                // Convert DateOfBirth to YYYY-MM-DD string for <input type="date" />
                const dobString = dto.DateOfBirth
                    ? new Date(dto.DateOfBirth).toISOString().split('T')[0]
                    : '';
                setFormData({
                    FullName: dto.FullName || '',
                    PhoneNumber: dto.PhoneNumber || '',
                    Email: dto.Email || '',
                    NationalId: dto.NationalId || '',
                    PassportId: dto.PassportId || '',
                    LicenseNumber: dto.LicenseNumber || '',
                    DateOfBirth: dobString,
                    Address: dto.Address || '',
                    IsBlacklisted: dto.IsBlacklisted || false,
                    AgencyId: dto.AgencyId || agencyId || '',
                });
            } catch (err) {
                console.error('❌ Error fetching customer:', err);
                setError(t('customer.fetch.error'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomer();
    }, [id, agencyId, t]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

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
                // Note: Attachments are omitted here. If you need to update attachments,
                // add a field `Attachments: [...]` matching your UpdateCustomerDto format.
            };

            await customerService.update(id, payload);
            navigate('/customers');
        } catch (err) {
            console.error('❌ Error updating customer:', err);
            setError(t('customer.edit.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/customers');
    };

    if (isLoading) {
        return (
            <div className="editcustomer-loading">
                {t('customer.loading')}
            </div>
        );
    }

    return (
        <div className="editcustomer-container">
            <h1 className="editcustomer-title">{t('customer.edit.title')}</h1>

            {error && <div className="editcustomer-error">{error}</div>}

            <form
                className="editcustomer-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Full Name */}
                <div className="form-group">
                    <label htmlFor="FullName">
                        {t('customer.fields.fullName')}
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
                </div>

                {/* Phone Number */}
                <div className="form-group">
                    <label htmlFor="PhoneNumber">
                        {t('customer.fields.phoneNumber')}
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
                        required
                    />
                </div>

                {/* National ID */}
                <div className="form-group">
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
                </div>

                {/* Passport ID */}
                <div className="form-group">
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
                        required
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
                        required
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
                        required
                    />
                </div>

                {/* Is Blacklisted */}
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

                {/* Actions */}
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
                            ? t('common.saving')
                            : t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerEdit;
