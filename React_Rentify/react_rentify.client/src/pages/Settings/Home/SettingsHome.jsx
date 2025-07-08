// src/pages/Settings/Home/SettingsHome.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import './SettingsHome.css';

const SettingsHome = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    // Settings card items
    const settingsCards = [
        {
            key: 'agency',
            title: t('settings.agency.title', 'Agency Settings'),
            description: t('settings.agency.description', 'Manage your agency details, contact information, and preferences'),
            route: '/settings/agency',
            icon: (
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                </svg>
            ),
        },
        {
            key: 'profile',
            title: t('settings.profile.title', 'Profile Settings'),
            description: t('settings.profile.description', 'Update your personal information, change password, and manage account preferences'),
            route: '/profile',
            icon: (
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            ),
        },
        {
            key: 'features',
            title: t('settings.features.title', 'Additional Features'),
            description: t('settings.features.description', 'Coming soon - Manage additional app features and integrations'),
            route: '#',
            disabled: true,
            icon: (
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                </svg>
            ),
        },
    ];

    const handleNavigate = (route, disabled) => {
        if (!disabled) {
            navigate(route);
        }
    };

    return (
        <div className={`settingsHome-container ${isDarkMode ? 'dark' : ''}`}>
            <h1 className="settingsHome-title">{t('settings.pageTitle', 'Settings')}</h1>
            <p className="settingsHome-description">
                {t('settings.pageDescription', 'Configure your application preferences and account settings')}
            </p>

            <div className="settings-grid">
                {settingsCards.map((card) => (
                    <div
                        key={card.key}
                        className={`settings-card ${card.disabled ? 'disabled' : ''}`}
                        onClick={() => handleNavigate(card.route, card.disabled)}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">{card.icon}</div>
                        </div>
                        <div className="card-content">
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-description">{card.description}</p>
                        </div>
                        {!card.disabled ? (
                            <div className="card-footer">
                                <span className="card-link">
                                    {t('common.open', 'Open')}
                                    <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        ) : (
                            <div className="card-footer">
                                <span className="coming-soon-badge">
                                    {t('common.comingSoon', 'Coming Soon')}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsHome;