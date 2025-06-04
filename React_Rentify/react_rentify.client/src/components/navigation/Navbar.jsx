// src/components/navigation/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LanguageSelector from '../ui/LanguageSelector';
import ThemeToggle from '../ui/ThemeToggle';
import SearchBar from '../ui/SearchBar';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
    const { user, logout } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const profileRef = useRef(null);
    const notificationsRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-2.5 lg:px-6`}>
            <div className="flex flex-wrap justify-between items-center">
                <div className="flex items-center">
                    {/* Hamburger button */}
                    <button
                        type="button"
                        className={`p-2 mr-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                        onClick={toggleSidebar}
                        aria-controls="sidebar"
                        aria-expanded={sidebarOpen}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>

                    {/* Logo - only show on large screens if sidebar is closed */}
                    <Link to="/dashboard" className={`flex items-center lg:ml-2.5 ${sidebarOpen ? 'hidden lg:flex' : ''}`}>
                        <img src="/logo.png" className="h-8 mr-3" alt="Rentify Logo" />
                        <span className="self-center text-xl font-semibold whitespace-nowrap">Rentify</span>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-xl mx-4">
                    <SearchBar />
                </div>

                <div className="flex items-center">
                    {/* Theme toggle */}
                    <ThemeToggle className="mr-2" />

                    {/* Language selector */}
                    <LanguageSelector className="mr-2" />

                    {/* Notifications */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            type="button"
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={`p-2 rounded-lg ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500'
                                }`}
                        >
                            <span className="sr-only">View notifications</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                            <div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full top-0 right-0">
                                3
                            </div>
                        </button>

                        {/* Notifications dropdown */}
                        {notificationsOpen && (
                            <div className={`absolute right-0 mt-2 w-80 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border`}>
                                <div className="px-4 py-3 text-sm border-b border-gray-200 font-medium">
                                    {t('notifications.recentNotifications')}
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    <a href="#" className={`flex px-4 py-3 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="w-full pl-3">
                                            <div className={`text-sm font-normal ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('notifications.newReservation')}
                                            </div>
                                            <div className="text-xs font-medium text-gray-500">
                                                15 {t('common.minutesAgo')}
                                            </div>
                                        </div>
                                    </a>
                                    <a href="#" className={`flex px-4 py-3 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-600'}`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="w-full pl-3">
                                            <div className={`text-sm font-normal ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('notifications.maintenanceReminder')}
                                            </div>
                                            <div className="text-xs font-medium text-gray-500">
                                                3 {t('common.hoursAgo')}
                                            </div>
                                        </div>
                                    </a>
                                    <a href="#" className={`flex px-4 py-3 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'}`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="w-full pl-3">
                                            <div className={`text-sm font-normal ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('notifications.paymentReceived')}
                                            </div>
                                            <div className="text-xs font-medium text-gray-500">
                                                1 {t('common.dayAgo')}
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <a href="#" className={`block py-2 text-sm font-medium text-center ${isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-50'}`}>
                                    {t('notifications.viewAll')}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Profile dropdown */}
                    <div className="relative ml-3" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex text-sm rounded-full focus:ring-2 focus:ring-primary-500"
                            id="user-menu-button"
                        >
                            <span className="sr-only">Open user menu</span>
                            {user?.picture ? (
                                <img className="w-8 h-8 rounded-full" src={user.picture} alt="User" />
                            ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <span className="text-lg font-medium">
                                        {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                        </button>

                        {profileOpen && (
                            <div className={`absolute right-0 mt-2 w-48 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border`}>
                                <div className="px-4 py-3 text-sm border-b border-gray-200">
                                    <div className="font-medium">{user?.fullName}</div>
                                    <div className="truncate">{user?.email}</div>
                                </div>
                                <ul>
                                    <li>
                                        <Link
                                            to="/profile"
                                            className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            {t('profile.myProfile')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/settings"
                                            className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            {t('settings.settings')}
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
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