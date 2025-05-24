import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout = ({ children, showSidebar = true }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Hidden by default
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle sidebar toggle for desktop
    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    // Handle mobile sidebar toggle specifically
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Close mobile sidebar
    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    // Close sidebar on route change (you can implement this with React Router)
    const handleRouteChange = () => {
        if (isMobile && isMobileSidebarOpen) {
            closeMobileSidebar();
        }
    };

    // Determine content margin based on sidebar state
    const getContentClasses = () => {
        const baseClass = 'main-layout__content';

        if (!showSidebar) {
            return `${baseClass} main-layout__content--full-width`;
        }

        if (isMobile) {
            return `${baseClass} main-layout__content--full-width`;
        }

        return isSidebarOpen
            ? `${baseClass} main-layout__content--with-sidebar`
            : `${baseClass} main-layout__content--full-width`;
    };

    return (
        <div className="main-layout">
            {/* Header */}
            <Header
                onToggleSidebar={toggleSidebar}
                onToggleMobileSidebar={toggleMobileSidebar}
                showSidebarToggle={showSidebar}
                isSidebarOpen={isSidebarOpen}
                isMobileSidebarOpen={isMobileSidebarOpen}
            />

            <div className="main-layout__body">
                {/* Sidebar */}
                {showSidebar && (
                    <Sidebar
                        isOpen={isSidebarOpen}
                        isMobileOpen={isMobileSidebarOpen}
                        onClose={closeMobileSidebar}
                        onToggle={toggleSidebar}
                    />
                )}

                {/* Main Content */}
                <main className={getContentClasses()}>
                    <div className="main-layout__content-inner">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default MainLayout;