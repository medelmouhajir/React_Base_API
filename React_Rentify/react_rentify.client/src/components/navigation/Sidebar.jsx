// src/components/navigation/Sidebar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHammer } from '../../contexts/HammerContext';
import './Sidebar.css';

const icons = {
    dashboard: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    cars: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2M7 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2M7 4h10M9 16l2-2 4 4" />
        </svg>
    ),
    customers: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    tickets: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            <path d="M3 10h18" />
            <path d="M3 14h18" />
        </svg>
    ),
    reservations: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    maintenance: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    expenses: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    invoices: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    agencies: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    staff: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    gps: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    subscriptions: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    serviceAlerts: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    gadgets: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    reports: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    settings: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    idScanner: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {/* scan frame corners */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
            {/* ID card */}
            <rect x="7" y="9" width="10" height="8" rx="2" strokeWidth="2" />
            {/* photo circle */}
            <circle cx="10" cy="13" r="1.5" strokeWidth="2" />
            {/* text lines */}
            <path strokeLinecap="round" strokeWidth="2" d="M13 12h3M13 15h3" />
        </svg>
    ),
    carAccident: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {/* Car body */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h7.2a2 2 0 0 1 1.9 1.5L17 13H3z" />
            {/* Wheels */}
            <circle cx="6.5" cy="16.5" r="1.5" strokeWidth="2" />
            <circle cx="15.5" cy="16.5" r="1.5" strokeWidth="2" />
            {/* Crash impact lines */}
            <path strokeLinecap="round" strokeWidth="2"
                d="M18 10l2-1M19 8l2-2M18 6l1-2" />
            {/* Smoke or spark effect */}
            <path strokeLinecap="round" strokeWidth="2"
                d="M19.5 11.5c.5.5 1 1.5.5 2.5" />
        </svg>
    ),

};

// Dummy shortcuts data
const shortcuts = [
    { id: 'add-car', label: 'car.list.addCar', icon: icons.cars, action: () => window.location.href = '/cars/add' },
    { id: 'new-reservation', label: 'dashboard.newReservation', icon: icons.reservations, action: () => window.location.href = '/reservations/add' },
    { id: 'new-customer', label: 'customer.add.title', icon: icons.customers, action: () => window.location.href = '/customers/add' },
    { id: 'idscanner', label: 'gadgets.identity.name', icon: icons.idScanner, action: () => window.location.href = '/gadgets/identity' },
];

const shortcuts_Admin = [
    { id: 'add-agency', label: 'agency.list.createAgency', icon: icons.reservations, action: () => window.location.href = '/agencies/create' },
    { id: 'quick-agency', label: 'agencies.quickSetup.title', icon: icons.idScanner, action: () => window.location.href = '/agencies/quick' },
];

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const location = useLocation();
    const { attachSwipeHandler } = useHammer();
    const sidebarRef = useRef(null);

    // Handle swipe-to-close on mobile
    useEffect(() => {
        if (isMobile && sidebarRef.current && isOpen) {
            const cleanup = attachSwipeHandler(sidebarRef.current, 'left', () => {
                toggleSidebar();
            });
            return cleanup;
        }
    }, [isMobile, isOpen, toggleSidebar, attachSwipeHandler]);

    // Build menu items based on role
    const [menuItems, setMenuItems] = useState([]);
    const [shorcutItems, setShorcutItems] = useState([]);

    useEffect(() => {
        const adminItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'agencies', label: t('sidebar.agencies'), icon: icons.agencies, path: '/agencies' },
            { id: 'filters', label: t('sidebar.filters'), icon: icons.staff, path: '/filters' },
            { id: 'gps', label: t('sidebar.gpsTracking'), icon: icons.gps, path: '/gps/cars' },
            { id: 'subscriptions', label: t('sidebar.subscriptions'), icon: icons.subscriptions, path: '/subscriptions' },
            { id: 'tickets', label: t('sidebar.tickets'), icon: icons.tickets, path: '/tickets' },
        ];
        const managerItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'cars', label: t('sidebar.cars'), icon: icons.cars, path: '/cars' },
            { id: 'customers', label: t('sidebar.customers'), icon: icons.customers, path: '/customers' },
            { id: 'reservations', label: t('sidebar.reservations'), icon: icons.reservations, path: '/reservations' },
            { id: 'expenses', label: t('sidebar.expenses'), icon: icons.expenses, path: '/expenses' },
            { id: 'maintenance', label: t('sidebar.maintenances'), icon: icons.maintenance, path: '/maintenances' },
            { id: 'serviceAlerts', label: t('sidebar.serviceAlerts'), icon: icons.serviceAlerts, path: '/service-alerts' },
            { id: 'invoices', label: t('sidebar.invoices'), icon: icons.invoices, path: '/invoices' },
            { id: 'accidents', label: t('sidebar.accidents'), icon: icons.carAccident, path: '/accidents' },
            { id: 'gadgets', label: t('sidebar.gadgets'), icon: icons.gadgets, path: '/gadgets' },
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

        if (user) {
            switch (user.role) {
                case 'Admin':
                    setMenuItems(adminItems);
                    setShorcutItems(shortcuts_Admin);
                    break;
                case 'Owner':
                case 'Manager':
                    setMenuItems(managerItems);
                    setShorcutItems(shortcuts);
                    break;
                case 'Customer':
                    setMenuItems(customerItems);
                    break;
                default:
                    setMenuItems(customerItems);
            }
        }
    }, [user, t]);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Close sidebar when clicking outside or pressing escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                toggleSidebar();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent body scroll when sidebar is open
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, toggleSidebar]);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`}
                onClick={toggleSidebar}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`sidebar ${isOpen ? 'open' : ''} ${isDarkMode ? 'dark' : ''}`}
                aria-label={t('sidebar.brand')}
                role="navigation"
            >
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-title">
                        <div className="sidebar-logo">
                            <img src="/logo.png" alt="Rentify Logo" className="brand-icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        {t('sidebar.brand')}
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={toggleSidebar}
                        aria-label={t('common.close')}
                    >
                        {icons.close}
                    </button>
                </div>

                {/* Content */}
                <div className="sidebar-content">
                    {/* Navigation Section */}
                    <div className="nav-section">
                        <nav className="nav-items" aria-label="Main navigation">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive: activeFlag }) =>
                                        `nav-item ${activeFlag || isActive(item.path) ? 'active' : ''}`
                                    }
                                    onClick={toggleSidebar} // Close sidebar when navigating
                                    aria-label={item.label}
                                >
                                    <span className="nav-item-icon" aria-hidden="true">
                                        {item.icon}
                                    </span>
                                    <span className="nav-item-text">
                                        {item.label}
                                    </span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Shortcuts Section */}
                    <div className="shortcuts-section">
                        <div className="shortcuts-grid">
                            {shorcutItems.map((shortcut) => (
                                <button
                                    key={shortcut.id}
                                    className="shortcut-item"
                                    onClick={() => {
                                        shortcut.action();
                                        toggleSidebar(); // Close sidebar after action
                                    }}
                                    aria-label={shortcut.label}
                                >
                                    <div className="shortcut-icon" aria-hidden="true">
                                        {shortcut.icon}
                                    </div>
                                    <span className="shortcut-text">
                                        {t(shortcut.label)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;