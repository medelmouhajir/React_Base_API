// src/components/navigation/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import LanguageSelector from '../ui/LanguageSelector';
import ThemeToggle from '../ui/ThemeToggle';
import SearchBar from '../ui/SearchBar';
import './Navbar.css';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
    const { user, logout } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [profileOpen, setProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const profileRef = useRef(null);

    // Track scroll position for navbar styling
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success(t('auth.logoutSuccess'));
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error(t('auth.logoutError'));
        }
    };


    return (
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} ${isDarkMode ? 'dark' : ''}`}>
            <div className="navbar-container">
                {/* Left section with hamburger and logo */}
                <div className="navbar-left">
                    <button
                        type="button"
                        className={`hamburger-button ${sidebarOpen ? 'hamburger-active' : ''}`}
                        onClick={toggleSidebar}
                        aria-controls="sidebar"
                        aria-expanded={sidebarOpen}
                    >
                        <span className="sr-only">Toggle sidebar</span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>

                    {/* Logo */}
                    <Link to="/dashboard" className="navbar-logo-link">
                        <img src="/logo.png" alt="Renter Logo" className="navbar-logo-image" />
                        <span className="navbar-logo-text">Renter</span>
                    </Link>
                </div>

                {/* Search */}
                <div className="navbar-search">
                    <SearchBar />
                </div>

                {/* Right section with actions */}
                <div className="navbar-actions">
                    {/* Theme toggle */}
                    <ThemeToggle className="navbar-action-button" />

                    {/* Language selector */}
                    <LanguageSelector className="navbar-action-button" />

                    {/* Profile dropdown */}
                    <div className="navbar-user-menu" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="user-avatar"
                            id="user-menu-button"
                            aria-expanded={profileOpen}
                        >
                            <span className="sr-only">Open user menu</span>
                            {user?.picture ? (
                                <img className="user-avatar" src={user.picture} alt={user.fullName || 'User'} />
                            ) : (
                                <div className={`user-avatar placeholder ${isDarkMode ? 'dark' : ''}`}>
                                    <span>{user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
                                </div>
                            )}
                        </button>

                        {profileOpen && (
                            <div className={`dropdown-content user-menu-dropdown ${isDarkMode ? 'dark' : ''}`}>
                                <div className="dropdown-header">
                                    <div className="header-name">{user?.fullName}</div>
                                    <div className="header-email">{user?.email}</div>
                                </div>
                                <ul className="dropdown-list">
                                    <li>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                                            <svg className="w-4 h-4 icon-left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                ></path>
                                            </svg>
                                            {t('profile.myProfile')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                                            <svg className="w-4 h-4 icon-left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                ></path>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                            {t('settings.settings')}
                                        </Link>
                                    </li>
                                    <li className="dropdown-separator">
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                handleLogout();
                                            }}
                                            className="dropdown-item logout-item"
                                        >
                                            <svg className="w-4 h-4 icon-left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                ></path>
                                            </svg>
                                            {t('auth.logout')}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
