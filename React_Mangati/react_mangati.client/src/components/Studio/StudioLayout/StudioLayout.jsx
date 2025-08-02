// src/components/Studio/StudioLayout/StudioLayout.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import StudioHeader from '../StudioHeader/StudioHeader';
import StudioSidebar from '../StudioSidebar/StudioSidebar';
import './StudioLayout.css';

export const StudioLayout = ({ children }) => {
    const { user, hasRole } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedSerie, setSelectedSerie] = useState(null);

    // Check if user has Writer role
    if (!user || !hasRole('Writer')) {
        return <Navigate to="/home" replace />;
    }

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

    // Handle serie selection from header or sidebar
    const handleSerieSelect = (serie) => {
        setSelectedSerie(serie);
        // You can also store this in context or localStorage
        localStorage.setItem('studioSelectedSerie', JSON.stringify(serie));
    };

    // Load selected serie from localStorage on mount
    useEffect(() => {
        const storedSerie = localStorage.getItem('studioSelectedSerie');
        if (storedSerie) {
            try {
                setSelectedSerie(JSON.parse(storedSerie));
            } catch (error) {
                console.error('Error loading selected serie:', error);
            }
        }
    }, []);



    // Determine content margin based on sidebar state
    const getContentClasses = () => {
        const baseClass = 'studio-layout__content';

        if (isMobile) {
            return `${baseClass} studio-layout__content--full-width`;
        }

        return isSidebarOpen
            ? `${baseClass} studio-layout__content--with-sidebar`
            : `${baseClass} studio-layout__content--sidebar-collapsed`;
    };

    return (
        <div className="studio-layout">
            {/* Header */}
            <StudioHeader
                onToggleSidebar={toggleSidebar}
                onToggleMobileSidebar={toggleMobileSidebar}
                isSidebarOpen={isSidebarOpen}
                isMobileSidebarOpen={isMobileSidebarOpen}
                selectedSerie={selectedSerie}
                onSerieSelect={handleSerieSelect}
            />

            <div className="studio-layout__body">
                {/* Sidebar */}
                <StudioSidebar
                    isOpen={isSidebarOpen}
                    isMobileOpen={isMobileSidebarOpen}
                    onClose={closeMobileSidebar}
                    onToggle={toggleSidebar}
                    selectedSerie={selectedSerie}
                />

                {/* Main Content */}
                <main className={getContentClasses()}>
                    <div className="studio-layout__content-inner">
                        {/* Pass selectedSerie to children */}
                        {children && typeof children === 'function' 
                            ? children({ selectedSerie, onSerieSelect: handleSerieSelect })
                            : children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="studio-layout__overlay"
                    onClick={closeMobileSidebar}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};
