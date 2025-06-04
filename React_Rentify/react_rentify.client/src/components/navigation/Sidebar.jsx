// src/components/navigation/Sidebar.jsx
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Icons for menu items
const icons = {
    dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
    ),
    cars: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 4h-4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2zm0 0H5a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
        </svg>
    ),
    customers: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
    ),
    reservations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
    ),
    maintenance: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
    ),
    invoices: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
    ),
    reports: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
    ),
    agencies: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
    ),
    staff: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
    ),
    gps: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
    ),
    settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
    ),
};

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const location = useLocation();

    // Menu items based on user role
    const [menuItems, setMenuItems] = useState([]);

    // Handle menu items based on user role
    useEffect(() => {
        const adminItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'agencies', label: t('sidebar.agencies'), icon: icons.agencies, path: '/agencies' },
            { id: 'staff', label: t('sidebar.staff'), icon: icons.staff, path: '/staff' },
            { id: 'settings', label: t('sidebar.settings'), icon: icons.settings, path: '/settings' },
        ];

        const managerItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'cars', label: t('sidebar.cars'), icon: icons.cars, path: '/cars' },
            { id: 'customers', label: t('sidebar.customers'), icon: icons.customers, path: '/customers' },
            { id: 'reservations', label: t('sidebar.reservations'), icon: icons.reservations, path: '/reservations' },
            { id: 'maintenance', label: t('sidebar.maintenance'), icon: icons.maintenance, path: '/maintenance' },
            { id: 'invoices', label: t('sidebar.invoices'), icon: icons.invoices, path: '/invoices' },
            { id: 'reports', label: t('sidebar.reports'), icon: icons.reports, path: '/reports' },
            { id: 'gps', label: t('sidebar.gpsTracking'), icon: icons.gps, path: '/gps' },
            { id: 'settings', label: t('sidebar.settings'), icon: icons.settings, path: '/settings' },
        ];

        const customerItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'reservations', label: t('sidebar.myReservations'), icon: icons.reservations, path: '/my-reservations' },
            { id: 'invoices', label: t('sidebar.myInvoices'), icon: icons.invoices, path: '/my-invoices' },
            { id: 'settings', label: t('sidebar.settings'), icon: icons.settings, path: '/settings' },
        ];

        // Set menu items based on user role
        if (user) {
            switch (user.role) {
                case 'Admin':
                    setMenuItems(adminItems);
                    break;
                case 'Owner':
                case 'Manager':
                    setMenuItems(managerItems);
                    break;
                case 'Customer':
                    setMenuItems(customerItems);
                    break;
                default:
                    setMenuItems(customerItems);
            }
        }
    }, [user, t]);

    // Handle active menu item
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    // Render sidebar with transition
    return (
        <>
            {/* Sidebar for desktop */}
            <aside
                id="sidebar"
                className={`fixed top-0 left-0 z-30 h-screen transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${isMobile ? 'w-64' : 'w-64 lg:w-20 hover:w-64'
                    } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    } border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    } lg:block`}
                aria-label="Sidebar"
                style={{ transition: 'width 0.3s ease-in-out, transform 0.3s ease-in-out' }}
            >
                <div className="h-full flex flex-col justify-between overflow-y-auto">
                    <div>
                        {/* Logo and company name */}
                        <div className={`flex items-center justify-between px-3 py-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                            <div className="flex items-center">
                                <img src="/logo.png" className="h-8 w-8" alt="Rentify Logo" />
                                <span className={`ml-2 text-xl font-bold transition-opacity duration-200 ${isMobile || isOpen ? 'opacity-100' : 'lg:opacity-0 lg:group-hover:opacity-100'}`}>
                                    Rentify
                                </span>
                            </div>
                            {isMobile && (
                                <button
                                    type="button"
                                    className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    onClick={toggleSidebar}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Navigation items */}
                        <ul className="space-y-1 px-3 py-4">
                            {menuItems.map(item => (
                                <li key={item.id} className="group">
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center p-2 rounded-lg ${isActive
                                                ? `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`
                                                : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                                            } transition-colors`
                                        }
                                    >
                                        <span className="inline-flex items-center justify-center w-6 h-6">
                                            {item.icon}
                                        </span>
                                        <span
                                            className={`ml-3 transition-opacity duration-200 ${isMobile || isOpen ? 'opacity-100' : 'lg:opacity-0 lg:group-hover:opacity-100'
                                                }`}
                                        >
                                            {item.label}
                                        </span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* User info at bottom */}
                    <div className={`mt-auto px-3 py-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                        <div className="flex items-center">
                            {user?.picture ? (
                                <img className="w-8 h-8 rounded-full" src={user.picture} alt="User" />
                            ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <span className="text-lg font-medium">
                                        {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className={`ml-3 transition-opacity duration-200 ${isMobile || isOpen ? 'opacity-100' : 'lg:opacity-0 lg:group-hover:opacity-100'}`}>
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;