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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4.5A2.5 2.5 0 017.5 2H16a2.5 2.5 0 012.5 2.5M5 20a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v13a2 2 0 01-2 2H5z" />
        </svg>
    ),
    customers: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    tickets: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
            <path d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" /> <path d="M3 10h18" /> <path d="M3 14h18" />
        </svg>
    ),
    reservations: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    maintenance: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    invoices: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    gadgets: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M11.049 2.927c.3-1.14 1.908-1.14 2.207 0l.133.507a2.253 2.253 0 002.108 1.66h.541
                 c1.12 0 1.662 1.354.784 2.082l-.451.37a2.25 2.25 0 00-.728 2.478l.264.598
                 c.586 1.328-.823 2.56-1.858 1.76l-.483-.396a2.25 2.25 0 00-2.884 0l-.483.396
                 c-1.035.8-2.444-.432-1.858-1.76l.264-.598a2.25 2.25 0 00-.728-2.478l-.451-.37
                 c-.878-.728-.336-2.082.784-2.082h.541a2.25 2.25 0 002.108-1.66l.133-.507z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    reports: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
        </svg>
    ),
    agencies: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        </svg>
    ),
    staff: (
        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
            { id: 'settings', label: t('sidebar.settings'), icon: icons.settings, path: '/settings' },
            { id: 'tickets', label: t('sidebar.tickets'), icon: icons.tickets, path: '/tickets' },
        ];
        const managerItems = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: icons.dashboard, path: '/dashboard' },
            { id: 'cars', label: t('sidebar.cars'), icon: icons.cars, path: '/cars' },
            { id: 'customers', label: t('sidebar.customers'), icon: icons.customers, path: '/customers' },
            { id: 'reservations', label: t('sidebar.reservations'), icon: icons.reservations, path: '/reservations' },
            { id: 'maintenance', label: t('sidebar.maintenances'), icon: icons.maintenance, path: '/maintenances' },
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
            {isMobile && isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar} />}

            <aside
                ref={sidebarRef}
                className={`
          sidebar
          ${isMobile ? (isOpen ? 'mobile-open' : 'mobile-closed') : (isOpen ? 'expanded' : 'collapsed')}
          ${isDarkMode ? 'dark' : ''}
        `}
            >
                <div className="sidebar-inner">
                    {/* Top half of menu */}
                    <div className="menu-section top-section">
                        {topItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive: activeFlag }) =>
                                    `sidebar-item ${activeFlag ? 'active' : ''}`
                                }
                            >
                                <div className="item-icon">{item.icon}</div>
                                {isOpen && <div className="item-text">{item.label}</div>}
                                {!isOpen && <span className="tooltip">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    {/* Logo in center */}
                    <div className="logo-section">
                        <img src="/logo.png" alt="Rentify Logo" className="logo-img" />
                        {isOpen && <span className="logo-text">Rentify</span>}
                        {!isOpen && <span className="tooltip-logo">Rentify</span>}
                    </div>

                    {/* Bottom half of menu */}
                    <div className="menu-section bottom-section">
                        {bottomItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive: activeFlag }) =>
                                    `sidebar-item ${activeFlag ? 'active' : ''}`
                                }
                            >
                                <div className="item-icon">{item.icon}</div>
                                {isOpen && <div className="item-text">{item.label}</div>}
                                {!isOpen && <span className="tooltip">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    {/* Collapse/Expand button (non-mobile) */}
                    {!isMobile && (
                        <button className="collapse-btn" onClick={toggleSidebar} aria-label={isOpen ? 'Collapse' : 'Expand'}>
                            {isOpen ? (
                                <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6m6-6l-6 6m6 6l-6-6" />
                                </svg>
                            ) : (
                                <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h12m-6-6l6 6m-6 6l6-6" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
