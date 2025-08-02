import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import LanguageSelector from '../../LanguageSelector/LanguageSelector';
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
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // State management
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSerieMenuOpen, setIsSerieMenuOpen] = useState(false);
    const [isSerieModalOpen, setIsSerieModalOpen] = useState(false);
    const [studioSeries, setStudioSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Refs for click outside detection
    const userMenuRef = useRef(null);
    const serieMenuRef = useRef(null);
    const modalRef = useRef(null);

    const image_base_url = import.meta.env.VITE_API_URL;

    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            // Close desktop dropdown if switching to mobile
            if (mobile && isSerieMenuOpen) {
                setIsSerieMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isSerieMenuOpen]);

    // Load studio series on mount
    useEffect(() => {
        loadStudioSeries();
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (serieMenuRef.current && !serieMenuRef.current.contains(event.target)) {
                setIsSerieMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle escape key for modal
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isSerieModalOpen) {
                setIsSerieModalOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isSerieModalOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isSerieModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isSerieModalOpen]);

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
        if (isMobile) {
            setIsSerieModalOpen(true);
        } else {
            setIsSerieMenuOpen(!isSerieMenuOpen);
            setIsUserMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSerieSelect = (serie) => {
        onSerieSelect(serie);
        setIsSerieMenuOpen(false);
        setIsSerieModalOpen(false);
    };

    const handleCreateNewSerie = () => {
        navigate('/series/create?studio=true');
        setIsSerieMenuOpen(false);
        setIsSerieModalOpen(false);
    };

    const SeriesList = ({ className = "" }) => (
        <div className={`studio-header__serie-list ${className}`}>
            {loadingSeries ? (
                <div className="studio-header__serie-loading">
                    <div className="studio-header__spinner"></div>
                </div>
            ) : studioSeries.length > 0 ? (
                <>
                    {studioSeries.map((serie) => (
                        <button
                            key={serie.id}
                            className={`studio-header__serie-item ${selectedSerie?.id === serie.id ? 'studio-header__serie-item--active' : ''
                                }`}
                            onClick={() => handleSerieSelect(serie)}
                        >
                            <div className="studio-header__serie-thumbnail">
                                {serie.coverImageUrl ? (
                                    <img
                                        src={`${image_base_url}${serie.coverImageUrl}`}
                                        alt={serie.title}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="studio-header__serie-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <path d="M21 15l-5-5L5 21" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="studio-header__serie-details">
                                <span className="studio-header__serie-title">{serie.title}</span>
                                <span className="studio-header__serie-meta">
                                    {serie.chaptersCount || 0} {t('studio.header.chapters')}
                                </span>
                            </div>
                            {selectedSerie?.id === serie.id && (
                                <svg className="studio-header__serie-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                            )}
                        </button>
                    ))}
                    <button
                        className="studio-header__serie-item studio-header__serie-item--create"
                        onClick={handleCreateNewSerie}
                    >
                        <div className="studio-header__serie-thumbnail studio-header__serie-thumbnail--create">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <div className="studio-header__serie-details">
                            <span className="studio-header__serie-title">{t('studio.header.createNewSerie')}</span>
                            <span className="studio-header__serie-meta">{t('studio.header.startNewProject')}</span>
                        </div>
                    </button>
                </>
            ) : (
                <div className="studio-header__serie-empty">
                    <div className="studio-header__serie-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                    <p className="studio-header__serie-empty-text">
                        {t('studio.header.noSeries')}
                    </p>
                    <button
                        className="studio-header__serie-empty-button"
                        onClick={handleCreateNewSerie}
                    >
                        {t('studio.header.createFirstSerie')}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            <header className="studio-header">
                <div className="studio-header__container">
                    {/* Sidebar Toggle */}
                    <button
                        className="studio-header__sidebar-toggle"
                        onClick={onToggleSidebar}
                        aria-label={t('studio.header.toggleSidebar')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <div className="studio-header__logo">
                        <Link to="/studio" className="studio-header__logo-link">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="studio-header__logo-icon">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" />
                                <path d="m2 17 10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                            <span className="studio-header__logo-text">
                                {t('studio.header.title')}
                            </span>
                        </Link>
                    </div>

                    {/* Serie Selector */}
                    <div className="studio-header__serie-selector" ref={serieMenuRef}>
                        <button
                            className="studio-header__serie-button"
                            onClick={toggleSerieMenu}
                            aria-expanded={isSerieMenuOpen}
                            aria-haspopup="true"
                            aria-label={t('studio.header.selectSerie')}
                        >
                            <svg className="studio-header__serie-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            <span className="studio-header__serie-name">
                                {selectedSerie ? selectedSerie.title : t('studio.header.selectSerie')}
                            </span>
                            <svg
                                className={`studio-header__arrow ${isSerieMenuOpen ? 'studio-header__arrow--open' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>

                        {/* Desktop Dropdown */}
                        {!isMobile && isSerieMenuOpen && (
                            <div className="studio-header__serie-dropdown">
                                <div className="studio-header__serie-dropdown-header">
                                    {t('studio.header.selectProject')}
                                </div>
                                <SeriesList />
                            </div>
                        )}
                    </div>

                    {/* Studio Stats - Contains BackgroundTasksIndicator */}
                    <div className="studio-header__stats">
                        <BackgroundTasksIndicator />
                    </div>

                    {/* Controls */}
                    <div className="studio-header__controls">
                        {/* Language Selector */}
                        <LanguageSelector variant="header" />

                        {/* Theme Toggle */}
                        <ThemeToggle className="studio-header__theme-toggle" />

                        {/* Exit Studio */}
                        <Link
                            to="/home"
                            className="studio-header__exit-btn"
                            title={t('studio.header.exitStudio')}
                            aria-label={t('studio.header.exitStudio')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="studio-header__user" ref={userMenuRef}>
                        <button
                            className="studio-header__user-button"
                            onClick={toggleUserMenu}
                            aria-expanded={isUserMenuOpen}
                            aria-haspopup="true"
                            aria-label={t('studio.header.userMenu')}
                        >
                            <img
                                src={user.profilePictureUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format"}
                                alt={t('studio.header.userAvatar')}
                                className="studio-header__user-avatar"
                            />
                            <span className="studio-header__user-name">
                                {user.firstName} {user.lastName}
                            </span>
                            <svg
                                className={`studio-header__arrow ${isUserMenuOpen ? 'studio-header__arrow--open' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>

                        {/* User Dropdown */}
                        {isUserMenuOpen && (
                            <div className="studio-header__dropdown">
                                <Link to="/account" className="studio-header__dropdown-item">
                                    <svg className="studio-header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {t('studio.header.userMenu.profile')}
                                </Link>

                                <div className="studio-header__dropdown-divider"></div>

                                <button
                                    onClick={handleLogout}
                                    className="studio-header__dropdown-item studio-header__dropdown-item--logout"
                                >
                                    <svg className="studio-header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {t('studio.header.userMenu.logout')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="studio-header__mobile-toggle"
                        onClick={onToggleMobileSidebar}
                        aria-label={t('studio.header.toggleMobileMenu')}
                    >
                        <span className={`studio-header__hamburger ${isMobileSidebarOpen ? 'studio-header__hamburger--open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                </div>
            </header>

            {/* Mobile Serie Selection Modal */}
            {isMobile && isSerieModalOpen && (
                <div
                    className="studio-header__modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsSerieModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="studio-header__modal"
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="serie-modal-title"
                    >
                        <div className="studio-header__modal-header">
                            <h2 id="serie-modal-title" className="studio-header__modal-title">
                                {t('studio.header.selectProject')}
                            </h2>
                            <button
                                className="studio-header__modal-close"
                                onClick={() => setIsSerieModalOpen(false)}
                                aria-label={t('common.close')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="studio-header__modal-content">
                            <SeriesList className="studio-header__modal-series" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudioHeader;