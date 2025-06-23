import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import BackgroundTasksIndicator from '../BackgroundTasksIndicator/BackgroundTasksIndicator';
import aiStudioService from '../../../services/aiStudioService';
import './StudioHeader.css';

const StudioHeader = ({
    onToggleSidebar,
    onToggleMobileSidebar,
    isSidebarOpen,
    isMobileSidebarOpen,
    selectedSerie,
    onSerieSelect
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSerieMenuOpen, setIsSerieMenuOpen] = useState(false);
    const [studioSeries, setStudioSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const image_base_url = import.meta.env.VITE_API_URL;

    // Load studio series on mount
    useEffect(() => {
        loadStudioSeries();
    }, []);

    const loadStudioSeries = async () => {
        try {
            setLoadingSeries(true);
            const series = await aiStudioService.getStudioSeries();
            setStudioSeries(series);
        } catch (error) {
            console.error('Error loading studio series:', error);
        } finally {
            setLoadingSeries(false);
        }
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setIsSerieMenuOpen(false);
    };

    const toggleSerieMenu = () => {
        setIsSerieMenuOpen(!isSerieMenuOpen);
        setIsUserMenuOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSerieSelect = (serie) => {
        onSerieSelect(serie);
        setIsSerieMenuOpen(false);
    };

    const handleCreateNewSerie = () => {
        navigate('/series/create?studio=true');
    };

    return (
        <header className="studio-header">
            <div className="studio-header__container">
                {/* Sidebar Toggle */}
                <button
                    className="studio-header__sidebar-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="studio-header__logo">
                    <Link to="/studio" className="studio-header__logo-link">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="studio-header__logo-icon">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/>
                        </svg>
                        <span className="studio-header__logo-text">Mangati Studio</span>
                    </Link>
                </div>

                {/* Serie Selector */}
                <div className="studio-header__serie-selector">
                    <button
                        className="studio-header__serie-button"
                        onClick={toggleSerieMenu}
                        aria-expanded={isSerieMenuOpen}
                    >
                        <svg className="studio-header__serie-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="9"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        <span className="studio-header__serie-name">
                            {selectedSerie ? selectedSerie.title : t('studio.selectSerie')}
                        </span>
                        <svg className={`studio-header__arrow ${isSerieMenuOpen ? 'studio-header__arrow--open' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </button>

                    {isSerieMenuOpen && (
                        <div className="studio-header__serie-dropdown">
                            <div className="studio-header__serie-dropdown-header">
                                {t('studio.yourStudioSeries')}
                            </div>
                            {loadingSeries ? (
                                <div className="studio-header__serie-loading">
                                    <div className="studio-header__spinner"></div>
                                </div>
                            ) : studioSeries.length > 0 ? (
                                <>
                                    {studioSeries.map((serie) => (
                                        <button
                                            key={serie.id}
                                            className={`studio-header__serie-item ${selectedSerie?.id === serie.id ? 'studio-header__serie-item--active' : ''}`}
                                            onClick={() => handleSerieSelect(serie)}
                                        >
                                            {serie.coverImageUrl && (
                                                <img 
                                                    src={image_base_url + serie.coverImageUrl} 
                                                    alt={serie.title}
                                                    className="studio-header__serie-thumbnail"
                                                />
                                            )}
                                            <div className="studio-header__serie-info">
                                                <span className="studio-header__serie-title">{serie.title}</span>
                                                <span className="studio-header__serie-status">{serie.status}</span>
                                            </div>
                                            {selectedSerie?.id === serie.id && (
                                                <svg className="studio-header__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20,6 9,17 4,12"></polyline>
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="studio-header__serie-empty">
                                    {t('studio.createNewSerie')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Studio Stats - Now contains BackgroundTasksIndicator */}
                <div className="studio-header__stats">
                    <BackgroundTasksIndicator />
                </div>

                {/* Controls */}
                <div className="studio-header__controls">
                    {/* Theme Toggle */}
                    <ThemeToggle className="studio-header__theme-toggle" />

                    {/* Exit Studio */}
                    <Link to="/home" className="studio-header__exit-btn" title={t('studio.exitStudio')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </Link>
                </div>

                {/* User Menu */}
                <div className="studio-header__user">
                    <button
                        className="studio-header__user-button"
                        onClick={toggleUserMenu}
                        aria-expanded={isUserMenuOpen}
                    >
                        <img
                            src={user.profilePictureUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format"}
                            alt="User Avatar"
                            className="studio-header__user-avatar"
                        />
                        <span className="studio-header__user-name">
                            {user.firstName} {user.lastName}
                        </span>
                        <svg
                            className={`studio-header__arrow ${isUserMenuOpen ? 'studio-header__arrow--open' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isUserMenuOpen && (
                        <div className="studio-header__user-dropdown">
                            <Link to="/account" className="studio-header__dropdown-item">
                                <svg className="studio-header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {t('header.userMenu.profile')}
                            </Link>

                            <Link to="/studio/settings" className="studio-header__dropdown-item">
                                <svg className="studio-header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t('studio.settings')}
                            </Link>

                            <div className="studio-header__dropdown-divider"></div>

                            <button onClick={handleLogout} className="studio-header__dropdown-item studio-header__dropdown-item--logout">
                                <svg className="studio-header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {t('header.userMenu.logout')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="studio-header__mobile-toggle"
                    onClick={onToggleMobileSidebar}
                >
                    <span className={`studio-header__hamburger ${isMobileSidebarOpen ? 'studio-header__hamburger--open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
        </header>
    );
};

export default StudioHeader;