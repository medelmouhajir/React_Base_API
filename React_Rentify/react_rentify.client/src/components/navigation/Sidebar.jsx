// src/components/navigation/Sidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useHammer } from '../../contexts/HammerContext';
import './Sidebar.css';

// Enhanced icons with more variety for shortcuts
const icons = {
    // Navigation icons
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <rect x="3" y="3" width="7" height="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="3" width="7" height="5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="12" width="7" height="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="16" width="7" height="5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    cars: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    customers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    reservations: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    expenses: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    maintenance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    agencies: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9,22 9,12 15,12 15,22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    staff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    serviceAlerts: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    invoices: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14,2 14,8 20,8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="10,9 9,9 8,9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    gadgets: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    reports: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    gps: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <polygon points="3,11 22,2 13,21 11,13 3,11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    subscriptions: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="3.27,6.96 12,12.01 20.73,6.96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="22.08" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    tickets: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12h1m9-9v1m8 8h1m-9 8v1M9 21v1M15 3v1M3 9h1M21 15h1M12 3c-6 0-9 3-9 9s3 9 9 9 9-3 9-9-3-9-9-9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    // Shortcut icons
    calculator: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="18" x2="16" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    calendar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    notes: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14,2 14,8 20,8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="10,9 9,9 8,9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    camera: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    phone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    weather: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    clock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    mail: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-svg">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="22,6 12,13 2,6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    
    // Carousel state
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Touch tracking for carousel
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

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

    // Shortcut items for second page
    const shortcutItems = [
        { id: 'calculator', label: 'Calculator', icon: icons.calculator, action: () => window.open('calculator://', '_blank') },
        { id: 'calendar', label: 'Calendar', icon: icons.calendar, action: () => window.open('/calendar', '_blank') },
        { id: 'notes', label: 'Notes', icon: icons.notes, action: () => window.open('/notes', '_blank') },
        { id: 'camera', label: 'Camera', icon: icons.camera, action: () => console.log('Open camera') },
        { id: 'phone', label: 'Phone', icon: icons.phone, action: () => window.open('tel:', '_blank') },
        { id: 'weather', label: 'Weather', icon: icons.weather, action: () => window.open('https://weather.com', '_blank') },
        { id: 'clock', label: 'Clock', icon: icons.clock, action: () => console.log('Open clock') },
        { id: 'mail', label: 'Mail', icon: icons.mail, action: () => window.open('mailto:', '_blank') },
    ];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Carousel navigation
    const goToPage = (pageIndex) => {
        if (pageIndex === currentPage) return;

        setIsAnimating(true);
        setCurrentPage(pageIndex);

        setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };

    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentPage < 1) {
            goToPage(currentPage + 1);
        }
        if (isRightSwipe && currentPage > 0) {
            goToPage(currentPage - 1);
        }
    };

    const handleShortcutClick = (item) => {
        if (item.action) {
            item.action();
        }
        // Close sidebar after clicking shortcut
        toggleSidebar();
    };

    const handleNavClick = () => {
        // Close sidebar after navigation on mobile
        if (isMobile) {
            toggleSidebar();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isMobile && (
                <div
                    className="sidebar-backdrop"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                ref={sidebarRef}
                className={`
                    sidebar-fullscreen
                    ${isDarkMode ? 'dark' : ''}
                    ${isAnimating ? 'animating' : ''}
                `}
                aria-label={t('sidebar.brand')}
                role="navigation"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header with close button and page indicators */}
                <div className="sidebar-header">
                    <div className="sidebar-header-content">
                        <div className="logo-section">
                            <div className="logo-container">
                                <div className="logo-icon">
                                    <img src="/logo.png" alt="Rentify Logo" className="brand-icon" />
                                </div>
                                <span className="logo-text">
                                    {t('sidebar.brand')}
                                </span>
                            </div>
                        </div>
                        
                        <button
                            className="close-button"
                            onClick={toggleSidebar}
                            aria-label="Close menu"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="close-icon">
                                <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Page indicators */}
                    <div className="page-indicators">
                        <button
                            className={`page-dot ${currentPage === 0 ? 'active' : ''}`}
                            onClick={() => goToPage(0)}
                            aria-label="Navigation page"
                        />
                        <button
                            className={`page-dot ${currentPage === 1 ? 'active' : ''}`}
                            onClick={() => goToPage(1)}
                            aria-label="Shortcuts page"
                        />
                    </div>
                </div>

                {/* Carousel container */}
                <div className="carousel-container">
                    <div 
                        className="carousel-track"
                        style={{
                            transform: `translateX(-${currentPage * 100}%)`,
                            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                        }}
                    >
                        {/* Page 1: Navigation Items */}
                        <div className="carousel-page">
                            <div className="page-title">
                                <h2>{t('sidebar.navigation')}</h2>
                            </div>
                            
                            <div className="grid-container">
                                {menuItems.map((item) => (
                                    <NavLink
                                        key={item.id}
                                        to={item.path}
                                        className={({ isActive: activeFlag }) =>
                                            `grid-item ${activeFlag ? 'active' : ''}`
                                        }
                                        onClick={handleNavClick}
                                        aria-label={item.label}
                                    >
                                        <div className="item-icon-container">
                                            {item.icon}
                                        </div>
                                        <span className="item-label">
                                            {item.label}
                                        </span>
                                        {isActive(item.path) && (
                                            <div className="active-indicator" />
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Page 2: Shortcuts */}
                        <div className="carousel-page">
                            <div className="page-title">
                                <h2>{t('sidebar.shortcuts')}</h2>
                            </div>
                            
                            <div className="grid-container">
                                {shortcutItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className="grid-item shortcut-item"
                                        onClick={() => handleShortcutClick(item)}
                                        aria-label={item.label}
                                    >
                                        <div className="item-icon-container">
                                            {item.icon}
                                        </div>
                                        <span className="item-label">
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom navigation */}
                <div className="sidebar-footer">
                    <div className="footer-content">
                        <span className="page-info">
                            {currentPage === 0 ? t('sidebar.navigation') : t('sidebar.shortcuts')}
                        </span>
                        <span className="swipe-hint">
                            {t('sidebar.swipeToNavigate')}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;