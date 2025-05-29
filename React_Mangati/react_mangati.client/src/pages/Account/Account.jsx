// src/pages/Account/Account.jsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { accountService } from '../../services/accountService';
import './Account.css';

const Account = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';
    const { user, updateProfile } = useAuth();

    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        address: '',
        profilePictureUrl: ''
    });
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [securityLoading, setSecurityLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Form validation state
    const [formErrors, setFormErrors] = useState({
        profile: {},
        security: {}
    });

    // Password strength indicator
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Load user data
    useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user]);

    const fetchUserProfile = async () => {
        try {
            setProfileLoading(true);
            const userData = await accountService.getUserProfile(user.id);
            setProfileData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phoneNumber: userData.phoneNumber || '',
                role: userData.role || '',
                address: userData.address || '',
                profilePictureUrl: userData.profilePictureUrl || ''
            });

            if (userData.profilePictureUrl) {
                setPreviewUrl(userData.profilePictureUrl);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setError(t('account.errors.loadingProfile'));
        } finally {
            setProfileLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSuccess(null);
        setError(null);
        // Clear form errors when changing tabs
        setFormErrors({
            profile: {},
            security: {}
        });
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
        // Clear error for this field if it exists
        if (formErrors.profile[name]) {
            setFormErrors({
                ...formErrors,
                profile: {
                    ...formErrors.profile,
                    [name]: null
                }
            });
        }
    };

    const handleSecurityChange = (e) => {
        const { name, value } = e.target;
        setSecurityData({
            ...securityData,
            [name]: value
        });

        // Clear error for this field if it exists
        if (formErrors.security[name]) {
            setFormErrors({
                ...formErrors,
                security: {
                    ...formErrors.security,
                    [name]: null
                }
            });
        }

        // Calculate password strength if the field is newPassword
        if (name === 'newPassword') {
            calculatePasswordStrength(value);
        }
    };

    const calculatePasswordStrength = (password) => {
        // Simple password strength calculation
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        setPasswordStrength(strength);
    };

    const passwordStrengthLabel = useMemo(() => {
        if (passwordStrength === 0) return t('account.security.passwordWeak');
        if (passwordStrength <= 2) return t('account.security.passwordModerate');
        if (passwordStrength <= 4) return t('account.security.passwordStrong');
        return t('account.security.passwordVeryStrong');
    }, [passwordStrength, t]);

    const passwordStrengthColor = useMemo(() => {
        if (passwordStrength === 0) return '#ef4444';
        if (passwordStrength <= 2) return '#f59e0b';
        if (passwordStrength <= 4) return '#10b981';
        return '#3b82f6';
    }, [passwordStrength]);

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!validTypes.includes(file.type)) {
                setError(t('account.errors.invalidImageType'));
                return;
            }

            if (file.size > maxSize) {
                setError(t('account.errors.imageTooLarge'));
                return;
            }

            setProfileImage(file);
            const imageUrl = URL.createObjectURL(file);
            setPreviewUrl(imageUrl);
            setError(null);
        }
    };

    const validateProfileForm = () => {
        const errors = {};

        if (!profileData.firstName.trim()) {
            errors.firstName = t('account.errors.requiredField');
        }

        if (!profileData.lastName.trim()) {
            errors.lastName = t('account.errors.requiredField');
        }

        // Phone number validation (simple format check)
        if (profileData.phoneNumber && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(profileData.phoneNumber)) {
            errors.phoneNumber = t('account.errors.invalidPhoneFormat');
        }

        setFormErrors({
            ...formErrors,
            profile: errors
        });

        return Object.keys(errors).length === 0;
    };

    const validateSecurityForm = () => {
        const errors = {};

        if (!securityData.currentPassword) {
            errors.currentPassword = t('account.errors.requiredField');
        }

        if (!securityData.newPassword) {
            errors.newPassword = t('account.errors.requiredField');
        } else if (securityData.newPassword.length < 8) {
            errors.newPassword = t('account.errors.passwordTooShort');
        }

        if (!securityData.confirmPassword) {
            errors.confirmPassword = t('account.errors.requiredField');
        } else if (securityData.newPassword !== securityData.confirmPassword) {
            errors.confirmPassword = t('account.errors.passwordMismatch');
        }

        setFormErrors({
            ...formErrors,
            security: errors
        });

        return Object.keys(errors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSuccess(null);
        setError(null);

        // Validate form
        if (!validateProfileForm()) {
            setError(t('account.errors.formValidation'));
            return;
        }

        try {
            setProfileLoading(true);

            // Create form data for file upload
            const formData = new FormData();
            formData.append('firstName', profileData.firstName);
            formData.append('lastName', profileData.lastName);
            formData.append('phoneNumber', profileData.phoneNumber || '');
            formData.append('address', profileData.address || '');

            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            const updatedProfile = await accountService.updateProfile(formData);

            // Update auth context
            await updateProfile(updatedProfile);

            setSuccess(t('account.profile.updateSuccess'));

            // Refresh profile data
            fetchUserProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message || t('account.errors.updateProfile'));
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        setSuccess(null);
        setError(null);

        // Validate form
        if (!validateSecurityForm()) {
            setError(t('account.errors.formValidation'));
            return;
        }

        try {
            setSecurityLoading(true);

            await accountService.changePassword({
                currentPassword: securityData.currentPassword,
                newPassword: securityData.newPassword
            });

            setSuccess(t('account.security.updateSuccess'));

            // Clear form
            setSecurityData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordStrength(0);
        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.message || t('account.errors.updateSecurity'));
        } finally {
            setSecurityLoading(false);
        }
    };

    // Derive user initials for avatar placeholder
    const userInitials = useMemo(() => {
        if (profileData.firstName && profileData.lastName) {
            return `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() || '?';
    }, [profileData.firstName, profileData.lastName, user?.email]);

    if (!user) {
        return (
            <div className="account__loading">
                <div className="account__spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="account" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="account__header">
                <h1 className="account__title">{t('account.title')}</h1>
                <p className="account__subtitle">{t('account.subtitle')}</p>
            </div>

            <div className="account__container">
                {/* Tabs */}
                <div className="account__tabs">
                    <button
                        className={`account__tab ${activeTab === 'profile' ? 'account__tab--active' : ''}`}
                        onClick={() => handleTabChange('profile')}
                        aria-selected={activeTab === 'profile'}
                        role="tab"
                    >
                        <svg className="account__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        {t('account.tabs.profile')}
                    </button>

                    <button
                        className={`account__tab ${activeTab === 'security' ? 'account__tab--active' : ''}`}
                        onClick={() => handleTabChange('security')}
                        aria-selected={activeTab === 'security'}
                        role="tab"
                    >
                        <svg className="account__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        {t('account.tabs.security')}
                    </button>

                    <button
                        className={`account__tab ${activeTab === 'notifications' ? 'account__tab--active' : ''}`}
                        onClick={() => handleTabChange('notifications')}
                        aria-selected={activeTab === 'notifications'}
                        role="tab"
                    >
                        <svg className="account__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        {t('account.tabs.notifications')}
                    </button>
                </div>

                {/* Content */}
                <div className="account__content" role="tabpanel">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="account__message account__message--success" role="alert">
                            <svg className="account__message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9 12l2 2 4-4"></path>
                            </svg>
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="account__message account__message--error" role="alert">
                            <svg className="account__message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form className="account__form" onSubmit={handleProfileSubmit}>
                            <div className="account__section">
                                <h2 className="account__section-title">{t('account.profile.personalInfo')}</h2>

                                <div className="account__avatar-section">
                                    <div className="account__avatar">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt={`${profileData.firstName} ${profileData.lastName}`}
                                                className="account__avatar-image"
                                            />
                                        ) : (
                                            <div className="account__avatar-placeholder">
                                                {userInitials}
                                            </div>
                                        )}
                                    </div>

                                    <div className="account__avatar-actions">
                                        <div className="account__avatar-info">
                                            <h3>{t('account.profile.profilePicture')}</h3>
                                            <p>{t('account.profile.imageRequirements')}</p>
                                        </div>

                                        <div className="account__avatar-buttons">
                                            <label className="account__button account__button--secondary">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    onChange={handleProfileImageChange}
                                                    className="account__file-input"
                                                    aria-label={t('account.profile.uploadNew')}
                                                />
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                                {t('account.profile.uploadNew')}
                                            </label>

                                            {previewUrl && (
                                                <button
                                                    type="button"
                                                    className="account__button account__button--danger"
                                                    onClick={() => {
                                                        setProfileImage(null);
                                                        setPreviewUrl('');
                                                    }}
                                                    aria-label={t('account.profile.removePhoto')}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                        <path d="M3 6h18"></path>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                    {t('account.profile.removePhoto')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="account__form-row">
                                    <div className="account__form-group">
                                        <label htmlFor="firstName" className="account__label">
                                            {t('account.profile.firstName')}
                                            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            className={`account__input ${formErrors.profile.firstName ? 'account__input--error' : ''}`}
                                            required
                                            aria-invalid={!!formErrors.profile.firstName}
                                            aria-describedby={formErrors.profile.firstName ? "firstName-error" : undefined}
                                        />
                                        {formErrors.profile.firstName && (
                                            <p id="firstName-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                                {formErrors.profile.firstName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="account__form-group">
                                        <label htmlFor="lastName" className="account__label">
                                            {t('account.profile.lastName')}
                                            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            className={`account__input ${formErrors.profile.lastName ? 'account__input--error' : ''}`}
                                            required
                                            aria-invalid={!!formErrors.profile.lastName}
                                            aria-describedby={formErrors.profile.lastName ? "lastName-error" : undefined}
                                        />
                                        {formErrors.profile.lastName && (
                                            <p id="lastName-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                                {formErrors.profile.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="account__form-row">
                                    <div className="account__form-group">
                                        <label htmlFor="email" className="account__label">
                                            {t('account.profile.email')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            className="account__input account__input--disabled"
                                            disabled
                                            readOnly
                                            aria-readonly="true"
                                        />
                                        <p className="account__input-help">
                                            {t('account.profile.emailHelp')}
                                        </p>
                                    </div>

                                    <div className="account__form-group">
                                        <label htmlFor="phoneNumber" className="account__label">
                                            {t('account.profile.phoneNumber')}
                                        </label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={profileData.phoneNumber || ''}
                                            onChange={handleProfileChange}
                                            className={`account__input ${formErrors.profile.phoneNumber ? 'account__input--error' : ''}`}
                                            placeholder="+1 (555) 000-0000"
                                            aria-invalid={!!formErrors.profile.phoneNumber}
                                            aria-describedby={formErrors.profile.phoneNumber ? "phoneNumber-error" : undefined}
                                        />
                                        {formErrors.profile.phoneNumber && (
                                            <p id="phoneNumber-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                                {formErrors.profile.phoneNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="account__form-group">
                                    <label htmlFor="address" className="account__label">
                                        {t('account.profile.address')}
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={profileData.address || ''}
                                        onChange={handleProfileChange}
                                        className="account__textarea"
                                        rows="3"
                                        placeholder={t('account.profile.addressPlaceholder')}
                                    ></textarea>
                                </div>

                                <div className="account__form-group">
                                    <label htmlFor="role" className="account__label">
                                        {t('account.profile.role')}
                                    </label>
                                    <input
                                        type="text"
                                        id="role"
                                        name="role"
                                        value={t(`roles.${profileData.role.toLowerCase()}`) || profileData.role}
                                        className="account__input account__input--disabled"
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="account__form-actions">
                                <button
                                    type="submit"
                                    className="account__button account__button--primary"
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? (
                                        <>
                                            <span className="account__spinner-small"></span>
                                            {t('account.profile.saving')}
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                            {t('account.profile.saveChanges')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <form className="account__form" onSubmit={handleSecuritySubmit}>
                            <div className="account__section">
                                <h2 className="account__section-title">{t('account.security.changePassword')}</h2>

                                <div className="account__form-group">
                                    <label htmlFor="currentPassword" className="account__label">
                                        {t('account.security.currentPassword')}
                                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={securityData.currentPassword}
                                        onChange={handleSecurityChange}
                                        className={`account__input ${formErrors.security.currentPassword ? 'account__input--error' : ''}`}
                                        required
                                        aria-invalid={!!formErrors.security.currentPassword}
                                        aria-describedby={formErrors.security.currentPassword ? "currentPassword-error" : undefined}
                                    />
                                    {formErrors.security.currentPassword && (
                                        <p id="currentPassword-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                            {formErrors.security.currentPassword}
                                        </p>
                                    )}
                                </div>

                                <div className="account__form-row">
                                    <div className="account__form-group">
                                        <label htmlFor="newPassword" className="account__label">
                                            {t('account.security.newPassword')}
                                            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={securityData.newPassword}
                                            onChange={handleSecurityChange}
                                            className={`account__input ${formErrors.security.newPassword ? 'account__input--error' : ''}`}
                                            required
                                            aria-invalid={!!formErrors.security.newPassword}
                                            aria-describedby={formErrors.security.newPassword ? "newPassword-error newPassword-strength" : "newPassword-strength"}
                                        />
                                        {formErrors.security.newPassword && (
                                            <p id="newPassword-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                                {formErrors.security.newPassword}
                                            </p>
                                        )}
                                        {securityData.newPassword && (
                                            <div id="newPassword-strength" style={{ marginTop: '8px' }}>
                                                <div style={{
                                                    height: '4px',
                                                    backgroundColor: '#e2e8f0',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden',
                                                    marginBottom: '4px'
                                                }}>
                                                    <div style={{
                                                        width: `${(passwordStrength / 5) * 100}%`,
                                                        height: '100%',
                                                        backgroundColor: passwordStrengthColor,
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                                <p className="account__input-help" style={{ color: passwordStrengthColor }}>
                                                    {passwordStrengthLabel}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="account__form-group">
                                        <label htmlFor="confirmPassword" className="account__label">
                                            {t('account.security.confirmPassword')}
                                            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={securityData.confirmPassword}
                                            onChange={handleSecurityChange}
                                            className={`account__input ${formErrors.security.confirmPassword ? 'account__input--error' : ''}`}
                                            required
                                            aria-invalid={!!formErrors.security.confirmPassword}
                                            aria-describedby={formErrors.security.confirmPassword ? "confirmPassword-error" : undefined}
                                        />
                                        {formErrors.security.confirmPassword && (
                                            <p id="confirmPassword-error" className="account__input-help" style={{ color: '#ef4444' }}>
                                                {formErrors.security.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="account__password-requirements">
                                    <h3 className="account__requirements-title">
                                        {t('account.security.passwordRequirements')}
                                    </h3>
                                    <ul className="account__requirements-list">
                                        <li>{t('account.security.requirement1')}</li>
                                        <li>{t('account.security.requirement2')}</li>
                                        <li>{t('account.security.requirement3')}</li>
                                        <li>{t('account.security.requirement4')}</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="account__form-actions">
                                <button
                                    type="submit"
                                    className="account__button account__button--primary"
                                    disabled={securityLoading}
                                >
                                    {securityLoading ? (
                                        <>
                                            <span className="account__spinner-small"></span>
                                            {t('account.security.updating')}
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                            {t('account.security.updatePassword')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="account__form">
                            <div className="account__section">
                                <h2 className="account__section-title">{t('account.notifications.title')}</h2>
                                <p className="account__section-description">{t('account.notifications.description')}</p>

                                <div className="account__notification-list">
                                    {/* Email Notifications */}
                                    <div className="account__notification-group">
                                        <h3 className="account__notification-title">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                            {t('account.notifications.email')}
                                        </h3>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.taskAssignments')}</h4>
                                                <p>{t('account.notifications.taskAssignmentsDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.comments')}</h4>
                                                <p>{t('account.notifications.commentsDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.projectUpdates')}</h4>
                                                <p>{t('account.notifications.projectUpdatesDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* In-App Notifications */}
                                    <div className="account__notification-group">
                                        <h3 className="account__notification-title">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                            </svg>
                                            {t('account.notifications.inApp')}
                                        </h3>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.taskReminders')}</h4>
                                                <p>{t('account.notifications.taskRemindersDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.mentions')}</h4>
                                                <p>{t('account.notifications.mentionsDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="account__notification-item">
                                            <div className="account__notification-info">
                                                <h4>{t('account.notifications.systemAnnouncements')}</h4>
                                                <p>{t('account.notifications.systemAnnouncementsDesc')}</p>
                                            </div>
                                            <label className="account__toggle">
                                                <input type="checkbox" className="account__toggle-input" defaultChecked />
                                                <span className="account__toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="account__form-actions">
                                    <button
                                        type="button"
                                        className="account__button account__button--primary"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        {t('account.notifications.savePreferences')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Account;