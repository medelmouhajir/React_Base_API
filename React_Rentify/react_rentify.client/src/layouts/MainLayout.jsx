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

    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                className={`main-content`} // Simplified - no need for sidebar width adjustments since it's full screen
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

            </div>

        </div>
    );
};

export default MainLayout;
