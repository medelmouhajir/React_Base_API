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

    const [sidebarOpen, setSidebarOpen] = useState(false); // Changed: default to false
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Close sidebar by default on all devices now (since it's full-screen)
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Sidebar should be closed by default on all devices now
            setSidebarOpen(false);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-close sidebar when navigating (for all devices now)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

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

            {/* Main content - no longer needs margin adjustments since sidebar is overlay */}
            <div className="main-content">
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

        </div>
    );
};

export default MainLayout;