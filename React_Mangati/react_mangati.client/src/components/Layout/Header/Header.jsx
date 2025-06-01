// src/components/Layout/Header/Header.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import LanguageSelector from '../../LanguageSelector/LanguageSelector';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import './Header.css';

const Header = ({
    onToggleSidebar,
    onToggleMobileSidebar,
    showSidebarToggle = true,
    isSidebarOpen,
    isMobileSidebarOpen
}) => {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const { user, logout } = useAuth();

    const languages = [
        {
            code: 'en',
            name: t('language.english'),
            nativeName: 'English',
            flag: '🇺🇸'
        },
        {
            code: 'fr',
            name: t('language.french'),
            nativeName: 'Français',
            flag: '🇫🇷'
        },
        {
            code: 'ar',
            name: t('language.arabic'),
            nativeName: 'العربية',
            flag: '🇲🇦'
        }
    ];

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setShowLanguageMenu(false); // Close language menu when user menu toggles
    };

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    const handleProfile = () => {
        navigate('/account');
        setIsUserMenuOpen(false);
    };


    const handleLanguageChange = async (languageCode) => {
        try {
            await i18n.changeLanguage(languageCode);

            // Update document direction for RTL languages
            if (languageCode === 'ar') {
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
            } else {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = languageCode;
            }

            setShowLanguageMenu(false);
            setIsUserMenuOpen(false);
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <header className="header">
            <div className="header__container">
                {/* Sidebar Toggle */}
                {showSidebarToggle && (
                    <button
                        className="header__sidebar-toggle"
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                )}

                {/* Logo */}
                <div className="header__logo">
                    <Link to="/" className="header__logo-link">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="header__logo-image">
                            <path
                                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="header__logo-text">{t('app.title')}</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
                    <ul className="header__nav-list">
                        <li className="header__nav-item">
                            <Link
                                to="/series"
                                className={`header__nav-link ${isActiveRoute('/series') ? 'header__nav-link--active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('navigation.series')}
                            </Link>
                        </li>
                        <li className="header__nav-item">
                            <Link
                                to="/search"
                                className={`header__nav-link ${isActiveRoute('/search') ? 'header__nav-link--active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('navigation.search')}
                            </Link>
                        </li>
                        <li className="header__nav-item">
                            <Link
                                to="/favorites"
                                className={`header__nav-link ${isActiveRoute('/favorites') ? 'header__nav-link--active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('navigation.favorites')}
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Controls section - Added for theme toggle and other controls */}
                <div className="header__controls">
                    {/* Theme Toggle */}
                    <ThemeToggle />
                </div>

                {/* User Menu */}
                {user && (
                    <div className="header__user">
                        <div className="header__user-menu">
                            <button
                                className="header__user-button"
                                onClick={toggleUserMenu}
                            >
                                <img
                                    src={user.profilePictureUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format"}
                                    alt="User Avatar"
                                    className="header__user-avatar"
                                />
                                <span className="header__user-name">
                                    {user.firstName} {user.lastName}
                                </span>
                                <svg
                                    className={`header__user-arrow ${isUserMenuOpen ? 'header__user-arrow--open' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isUserMenuOpen && (
                                <div className="header__user-dropdown">
                                    <button onClick={handleProfile} className="header__dropdown-item">
                                        <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {t('header.userMenu.profile')}
                                    </button>

                                    <div className="header__dropdown-divider"></div>

                                    {/* Language Selection */}
                                    <div className="header__dropdown-submenu">
                                        <button
                                            className="header__dropdown-item header__dropdown-item--submenu"
                                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                        >
                                            <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                            </svg>
                                            <span className="header__dropdown-language-current">
                                                <span className="header__dropdown-flag">{currentLanguage.flag}</span>
                                                {t('language.selectLanguage')}
                                            </span>
                                            <svg
                                                className={`header__dropdown-chevron ${showLanguageMenu ? 'header__dropdown-chevron--open' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>

                                        {showLanguageMenu && (
                                            <div className="header__dropdown-languages">
                                                {languages.map((language) => (
                                                    <button
                                                        key={language.code}
                                                        className={`header__dropdown-language ${language.code === i18n.language ? 'header__dropdown-language--active' : ''
                                                            }`}
                                                        onClick={() => handleLanguageChange(language.code)}
                                                    >
                                                        <span className="header__dropdown-flag">{language.flag}</span>
                                                        <div className="header__dropdown-language-text">
                                                            <span className="header__dropdown-language-native">
                                                                {language.nativeName}
                                                            </span>
                                                            <span className="header__dropdown-language-translated">
                                                                {language.name}
                                                            </span>
                                                        </div>
                                                        {language.code === i18n.language && (
                                                            <svg
                                                                className="header__dropdown-check"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="header__dropdown-divider"></div>

                                    <button onClick={handleLogout} className="header__dropdown-item header__dropdown-item--logout">
                                        <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        {t('header.userMenu.logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Menu Button */}
                <button
                    className="header__mobile-toggle"
                    onClick={onToggleMobileSidebar || toggleMenu}
                >
                    <span className={`header__hamburger ${isMenuOpen || isMobileSidebarOpen ? 'header__hamburger--open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
        </header>
    );
};

export default Header;