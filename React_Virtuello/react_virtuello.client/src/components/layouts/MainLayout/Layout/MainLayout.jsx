import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout = ({
    children,
    showSidebar = true,
    sidebarCollapsed = true,
    onSidebarToggle,
    className = '',
    pageTitle = '',
    breadcrumbs = []
}) => {
    const { t } = useTranslation();
    const { user, isAdmin, isManager } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [internalCollapsed, setInternalCollapsed] = useState(sidebarCollapsed);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            // Auto-close sidebar on mobile when screen size changes
            if (mobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile && sidebarOpen) {
            // Prevent body scroll when sidebar is open
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            // Restore body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        return () => {
            // Cleanup on unmount
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isMobile, sidebarOpen]);

    // Handle sidebar toggle
    const handleSidebarToggle = () => {
        console.log('Sidebar toggle clicked', { isMobile, sidebarOpen }); // Debug log

        if (isMobile) {
            const newSidebarOpen = !sidebarOpen;
            console.log('Setting sidebarOpen to:', newSidebarOpen); // Debug log
            setSidebarOpen(newSidebarOpen);
        } else {
            const newCollapsed = !internalCollapsed;
            setInternalCollapsed(newCollapsed);
            if (onSidebarToggle) {
                onSidebarToggle(newCollapsed);
            }
        }
    };

    // Handle mobile sidebar overlay click
    const handleOverlayClick = () => {
        if (isMobile && sidebarOpen) {
            setSidebarOpen(false);
        }
    };

    // Handle keyboard navigation for accessibility
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isMobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, sidebarOpen]);

    // Calculate content spacing based on sidebar state
    const getContentMargin = () => {
        if (!showSidebar) return '0';
        if (isMobile) return '0';
        if (internalCollapsed) return 'var(--sidebar-collapsed-width)';
        return 'var(--sidebar-width)';
    };

    return (
        <div className={`main-layout ${isMobile ? 'main-layout--mobile' : 'main-layout--desktop'} ${isMobile && sidebarOpen ? 'sidebar-open' : ''} ${className}`}>
            {/* Navigation Bar */}
            <Navbar
                user={user}
                onMenuToggle={handleSidebarToggle}
                showMenuButton={showSidebar}
                isMobile={isMobile}
                pageTitle={pageTitle}
                breadcrumbs={breadcrumbs}
                className="main-layout__navbar"
            />

            {/* Sidebar */}
            {showSidebar && (
                <Sidebar
                    user={user}
                    isOpen={isMobile ? sidebarOpen : true}
                    isCollapsed={isMobile ? false : internalCollapsed}
                    isMobile={isMobile}
                    onClose={() => setSidebarOpen(false)}
                    className="main-layout__sidebar"
                />
            )}

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && showSidebar && (
                <div
                    className="main-layout__overlay"
                    onClick={handleOverlayClick}
                    onTouchStart={handleOverlayClick} // Add touch support
                    aria-hidden="true"
                    role="button"
                    tabIndex={0}
                />
            )}

            {/* Main Content */}
            <main
                className="main-layout__content"
                style={{
                    marginLeft: getContentMargin(),
                }}
            >
                <div className="main-layout__content-inner">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;