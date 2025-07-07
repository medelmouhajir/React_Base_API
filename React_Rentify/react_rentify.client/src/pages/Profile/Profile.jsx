// src/pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import LoadingScreen from '../../components/ui/LoadingScreen';

// Styles
import './Profile.css';

const Profile = () => {
    const { t } = useTranslation();
    const { user, loading, error, updateProfile, changePassword, clearError } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // Profile form state
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Form submission states
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Populate profile form with user data when available
    useEffect(() => {
        if (user) {
            // Split full name into first and last name
            const nameParts = user.fullName ? user.fullName.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setProfileData({
                firstName,
                lastName,
                phoneNumber: user.phoneNumber || '',
            });
        }
    }, [user]);

    // Handle profile form input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
        if (profileError) setProfileError(null);
    };

    // Handle password form input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
        if (passwordError) setPasswordError(null);
        if (passwordSuccess) setPasswordSuccess(false);
    };

    // Handle profile form submission
    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!profileData.firstName.trim()) {
            setProfileError(t('profile.errors.firstNameRequired'));
            return;
        }

        setProfileSubmitting(true);
        setProfileError(null);

        try {
            const result = await updateProfile(profileData);

            if (result.success) {
                toast.success(t('profile.notifications.profileUpdated'));
            } else {
                setProfileError(result.error || t('profile.errors.updateFailed'));
            }
        } catch (err) {
            setProfileError(err.message || t('profile.errors.updateFailed'));
        } finally {
            setProfileSubmitting(false);
        }
    };

    // Handle password form submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError(t('profile.errors.passwordsDoNotMatch'));
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError(t('profile.errors.passwordTooShort'));
            return;
        }

        setPasswordSubmitting(true);
        setPasswordError(null);

        try {
            const result = await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            if (result.success) {
                setPasswordSuccess(true);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                toast.success(t('profile.notifications.passwordChanged'));
            } else {
                setPasswordError(result.error || t('profile.errors.passwordChangeFailed'));
            }
        } catch (err) {
            setPasswordError(err.message || t('profile.errors.passwordChangeFailed'));
        } finally {
            setPasswordSubmitting(false);
        }
    };

    // If not authenticated, redirect to login
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [loading, user, navigate]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className={`profile-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="profile-title">{t('profile.title')}</h1>

            {/* Profile Section */}
            <section className="profile-section">
                <h2 className="section-title">{t('profile.personalInformation')}</h2>

                {profileError && (
                    <div className="profile-error-message">
                        <p>{profileError}</p>
                    </div>
                )}

                <form className="profile-form" onSubmit={handleProfileSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">{t('profile.firstName')}</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={profileData.firstName}
                                onChange={handleProfileChange}
                                placeholder={t('profile.firstNamePlaceholder')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">{t('profile.lastName')}</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={profileData.lastName}
                                onChange={handleProfileChange}
                                placeholder={t('profile.lastNamePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">{t('profile.phoneNumber')}</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={handleProfileChange}
                            placeholder={t('profile.phoneNumberPlaceholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">{t('profile.email')}</label>
                        <input
                            type="email"
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="input-disabled"
                        />
                        <p className="input-help-text">{t('profile.emailNotEditable')}</p>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={profileSubmitting}
                        >
                            {profileSubmitting ? t('common.saving') : t('common.saveChanges')}
                        </button>
                    </div>
                </form>
            </section>

            {/* Change Password Section */}
            <section className="profile-section">
                <h2 className="section-title">{t('profile.changePassword')}</h2>

                {passwordError && (
                    <div className="profile-error-message">
                        <p>{passwordError}</p>
                    </div>
                )}

                {passwordSuccess && (
                    <div className="profile-success-message">
                        <p>{t('profile.passwordChangeSuccess')}</p>
                    </div>
                )}

                <form className="profile-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <label htmlFor="currentPassword">{t('profile.currentPassword')}</label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder={t('profile.currentPasswordPlaceholder')}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="newPassword">{t('profile.newPassword')}</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder={t('profile.newPasswordPlaceholder')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('profile.confirmPassword')}</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder={t('profile.confirmPasswordPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="password-requirements">
                        <h3 className="requirements-title">{t('profile.passwordRequirements')}</h3>
                        <ul className="requirements-list">
                            <li>{t('profile.passwordRequirement1')}</li>
                            <li>{t('profile.passwordRequirement2')}</li>
                            <li>{t('profile.passwordRequirement3')}</li>
                        </ul>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={passwordSubmitting}
                        >
                            {passwordSubmitting ? t('common.updating') : t('profile.updatePassword')}
                        </button>
                    </div>
                </form>
            </section>

            {/* Account Security Section */}
            <section className="profile-section">
                <h2 className="section-title">{t('profile.accountSecurity')}</h2>

                <div className="security-info">
                    <div className="security-item">
                        <div className="security-icon">
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="security-content">
                            <h3 className="security-title">{t('profile.lastLogin')}</h3>
                            <p className="security-text">{t('profile.lastLoginInfo')}</p>
                        </div>
                    </div>

                    <div className="security-item">
                        <div className="security-icon">
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div className="security-content">
                            <h3 className="security-title">{t('profile.twoFactorAuthentication')}</h3>
                            <p className="security-text">{t('profile.twoFactorAuthenticationInfo')}</p>
                            <button className="btn-text">{t('profile.setupTwoFactor')}</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Profile Picture Section (Future Implementation) */}
            <section className="profile-section">
                <h2 className="section-title">{t('profile.profilePicture')}</h2>

                <div className="profile-picture-container">
                    <div className="profile-picture">
                        {user?.picture ? (
                            <img src={user.picture} alt={t('profile.profilePictureAlt')} />
                        ) : (
                            <div className="profile-initial">
                                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>

                    <div className="profile-picture-actions">
                        <p className="profile-picture-info">{t('profile.profilePictureInfo')}</p>
                        <div className="picture-buttons">
                            <button className="btn-secondary">{t('profile.uploadPicture')}</button>
                            {user?.picture && (
                                <button className="btn-text">{t('profile.removePicture')}</button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="profile-section danger-zone">
                <h2 className="section-title danger-title">{t('profile.dangerZone')}</h2>

                <div className="danger-actions">
                    <div className="danger-info">
                        <h3 className="danger-action-title">{t('profile.deleteAccount')}</h3>
                        <p className="danger-action-info">{t('profile.deleteAccountInfo')}</p>
                    </div>

                    <button className="btn-danger">{t('profile.deleteAccountButton')}</button>
                </div>
            </section>
        </div>
    );
};

export default Profile;