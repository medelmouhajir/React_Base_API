// src/layouts/MainLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import Loading from '../components/Loading/Loading';
import './MainLayout.css';

const MainLayout = () => {
    const { user, loading } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);


    // Handle swipe gestures for mobile
    useEffect(() => {
        const handleSwipeRight = () => {
            if (isMobile && !sidebarOpen) {
                setSidebarOpen(true);
            }
        };
        const handleSwipeLeft = () => {
            if (isMobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('app:swiperight', handleSwipeRight);
        document.addEventListener('app:swipeleft', handleSwipeLeft);

        return () => {
            document.removeEventListener('app:swiperight', handleSwipeRight);
            document.removeEventListener('app:swipeleft', handleSwipeLeft);
        };
    }, [isMobile, sidebarOpen]);

    // Close sidebar by default on mobile
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirect to landing page if not authenticated
    useEffect(() => {
        if (!loading && !user && location.pathname !== '/login') {
            navigate('/');
        }
    }, [user, loading, navigate, location]);

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className={`loading-screen-wrapper ${isDarkMode ? 'dark' : ''}`}>
                <Loading type="pulse" showText={true} text={t('common.loading')} />
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className={`main-layout ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />

            {/* Main content */}
            <div
                className={`main-content ${isMobile
                        ? ''
                        : sidebarOpen
                            ? 'main-content-with-sidebar'
                            : 'main-content-with-collapsed-sidebar'
                    }`}
            >
                {/* Navbar */}
                <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

                {/* Page area */}
                <main className="main-content-area">
                    <div className="content-inner-wrapper">
                        <div className="page-transition-enter page-transition-enter-active">
                            <Outlet />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className={`main-footer ${isDarkMode ? 'dark' : ''}`}>
                    <div className="footer-text">
                        &copy; {new Date().getFullYear()} Rentify. {t('common.allRightsReserved')}
                    </div>
                </footer>
            </div>

            {/* Mobile sidebar overlay */}
            {isMobile && (
                <div
                    className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-visible' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
