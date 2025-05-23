import { useState } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout = ({ children, showSidebar = true, sidebarCollapsed = false }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(!sidebarCollapsed);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="main-layout">
            {/* Header */}
            <Header
                onToggleSidebar={toggleSidebar}
                onToggleMobileSidebar={toggleMobileSidebar}
                showSidebarToggle={showSidebar}
            />

            <div className="main-layout__body">
                {/* Sidebar */}
                {showSidebar && (
                    <>
                        <Sidebar
                            isOpen={isSidebarOpen}
                            isMobileOpen={isMobileSidebarOpen}
                            onClose={closeMobileSidebar}
                        />
                        {/* Mobile Sidebar Overlay */}
                        {isMobileSidebarOpen && (
                            <div
                                className="main-layout__overlay"
                                onClick={closeMobileSidebar}
                            />
                        )}
                    </>
                )}

                {/* Main Content */}
                <main
                    className={`main-layout__content ${showSidebar ?
                            (isSidebarOpen ? 'main-layout__content--with-sidebar' : 'main-layout__content--sidebar-collapsed')
                            : 'main-layout__content--full-width'
                        }`}
                >
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