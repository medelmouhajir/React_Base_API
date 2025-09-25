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
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    cars: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2M7 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2M7 4h10M9 16l2-2 4 4" />
        </svg>
    ),
    customers: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    tickets: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            <path d="M3 10h18" />
            <path d="M3 14h18" />
        </svg>
    ),
    reservations: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    maintenance: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    serviceAlerts: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    expenses: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    invoices: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    gadgets: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    reports: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    agencies: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    staff: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    gps: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    settings: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    subscriptions: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" >
            <rect x="3" y="5" width="18" height="14"
                rx="2"
                ry="2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
};

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const location = useLocation();
    const { attachSwipeHandler } = useHammer();
    const sidebarRef = useRef(null);

    // Handle swipe-to-close on mobile
    useEffect(() => {
        if (isMobile && sidebarRef.current) {
            const cleanup = attachSwipeHandler(sidebarRef.current, 'left', () => {
                if (isOpen) toggleSidebar();
            });
            return cleanup;
        }
    }, [isMobile, isOpen, toggleSidebar, attachSwipeHandler]);

    // Build menu items based on role
    const [menuItems, setMenuItems] = useState([]);
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

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Split menu into two halves for above/below logo
    const half = Math.ceil(menuItems.length / 2);
    const topItems = menuItems.slice(0, half);
    const bottomItems = menuItems.slice(half);

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isMobile && isOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                ref={sidebarRef}
                className={`
                    sidebar
                    ${isMobile ? (isOpen ? 'mobile-open' : 'mobile-closed') : (isOpen ? 'expanded' : 'collapsed')}
                    ${isDarkMode ? 'dark' : ''}
                `}
                aria-label={t('sidebar.brand')}
                role="navigation"
            >
                <div className="sidebar-inner">
                    {/* Top navigation items */}
                    <nav className="menu-section top-section" aria-label="Main navigation">
                        {topItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive: activeFlag }) =>
                                    `sidebar-item ${activeFlag ? 'active' : ''}`
                                }
                                title={!isOpen || isMobile ? item.label : undefined}
                                aria-label={item.label}
                            >
                                <span className="item-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                <span className={`item-text ${(!isOpen && !isMobile) ? 'collapsed' : ''}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logo section */}
                    <div className="logo-section">
                        <div className="logo-container">
                            <div className="logo-icon">
                                <img src="/logo.png" alt="Rentify Logo" className="brand-icon" />
                            </div>
                            <span className={`logo-text ${(!isOpen && !isMobile) ? 'collapsed' : ''}`}>
                                {t('sidebar.brand')}
                            </span>
                        </div>
                    </div>

                    {/* Bottom navigation items */}
                    <nav className="menu-section bottom-section" aria-label="Secondary navigation">
                        {bottomItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive: activeFlag }) =>
                                    `sidebar-item ${activeFlag ? 'active' : ''}`
                                }
                                title={!isOpen || isMobile ? item.label : undefined}
                                aria-label={item.label}
                            >
                                <span className="item-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                <span className={`item-text ${(!isOpen && !isMobile) ? 'collapsed' : ''}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Collapse/Expand toggle for desktop */}
                    {!isMobile && (
                        <button
                            className="toggle-button"
                            onClick={toggleSidebar}
                            aria-label={isOpen ? t('sidebar.collapse') : t('sidebar.expand')}
                            title={isOpen ? t('sidebar.collapse') : t('sidebar.expand')}
                        >
                            <svg
                                className={`toggle-icon ${isOpen ? 'expanded' : 'collapsed'}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;