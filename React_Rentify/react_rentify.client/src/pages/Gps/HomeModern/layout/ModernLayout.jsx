import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Styles
import './ModernLayout.css';

const ModernLayout = ({
    isDarkMode,
    isMobile,
    isTablet,
    screenSize,
    isDrawerOpen,
    isFullScreenMap,
    activePanel,
    onToggleDrawer,
    bottomNavHeight = 80,
    selectedVehicle,
    onPanelChange,

    // Slots
    summarySlot,
    mapSlot,
    drawerSlot,
    mobileNavigationSlot,
    mobileCarouselSlot,
    floatingActionSlot,
    quickActionsSlot,
    alertDrawerSlot
}) => {
    const containerClasses = [
        'home-modern',
        isDarkMode ? 'dark' : 'light',
        screenSize,
        isFullScreenMap ? 'fullscreen-mode' : '',
        isDrawerOpen ? 'drawer-open' : 'drawer-closed'
    ].filter(Boolean).join(' ');

    const drawerVariants = {
        desktop: {
            closed: { width: '0px', opacity: 0 },
            open: { width: '420px', opacity: 1 }
        },
        mobile: {
            closed: { x: '100%', opacity: 0 },
            open: { x: '0%', opacity: 1 }
        }
    };

    const mapVariants = {
        normal: {
            scale: 1,
            borderRadius: 'var(--radius-2xl)',
            transition: { duration: 0.3 }
        },
        fullscreen: {
            scale: 1,
            borderRadius: '0px',
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={containerClasses}>
            {/* Summary Bar */}
            <AnimatePresence>
                {summarySlot && (
                    <motion.div
                        key="summary"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="home-modern__summary"
                    >
                        {summarySlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div
                className="home-modern__main"
                style={{
                    paddingBottom: isMobile && !isFullScreenMap ? `${bottomNavHeight}px` : '0'
                }}
            >
                {/* Map Container */}
                <motion.div
                    className="home-modern__map-container"
                    variants={mapVariants}
                    animate={isFullScreenMap ? 'fullscreen' : 'normal'}
                >
                    <div className="home-modern__map">
                        {mapSlot}

                        {/* Map Overlay Controls */}
                        {isFullScreenMap && (
                            <div className="map-overlay-controls">
                                <button
                                    className="overlay-btn exit-fullscreen"
                                    onClick={() => onToggleDrawer?.()}
                                    aria-label="Exit fullscreen"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Side Drawer */}
                <AnimatePresence>
                    {(isDrawerOpen || !isMobile) && (
                        <motion.aside
                            className={`home-modern__drawer glass ${isDrawerOpen ? 'open' : ''}`}
                            variants={drawerVariants[isMobile ? 'mobile' : 'desktop']}
                            initial="closed"
                            animate={isDrawerOpen ? "open" : "closed"}
                            exit="closed"
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            style={{
                                // Ensure visibility in mobile when open
                                ...(isMobile && isDrawerOpen && {
                                    visibility: 'visible',
                                    pointerEvents: 'auto'
                                })
                            }}
                        >
                            {/* Drawer Header */}
                            <div className="drawer-header">
                                <div className="drawer-tabs">
                                    <button
                                        className={`tab-btn ${activePanel === 'vehicles' ? 'active' : ''}`}
                                        onClick={() => onPanelChange?.('vehicles')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" />
                                            <path d="M19 6H5L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2-6z" fill="currentColor" />
                                        </svg>
                                        Vehicles
                                    </button>
                                    <button
                                        className={`tab-btn ${activePanel === 'routes' ? 'active' : ''}`}
                                        onClick={() => onPanelChange?.('routes')}
                                        disabled={!selectedVehicle}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L13.09 8.26L18 7L16.74 12.74L22 14L15.74 15.26L17 21L11.26 19.74L10 24L8.74 19.74L3 21L4.26 15.26L2 14L7.26 12.74L6 7L10.91 8.26L12 2Z" fill="currentColor" />
                                        </svg>
                                        Routes
                                    </button>
                                </div>

                                {/* Drawer Toggle Button */}
                                <button
                                    type="button"
                                    className="drawer-toggle-btn"
                                    onClick={onToggleDrawer}
                                    aria-expanded={isDrawerOpen}
                                    aria-label={isDrawerOpen ? 'Close drawer' : 'Open drawer'}
                                >
                                    <motion.div
                                        animate={{ rotate: isDrawerOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <motion.div
                                className="drawer-content"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{
                                    // Ensure content is visible
                                    ...(isMobile && isDrawerOpen && {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1
                                    })
                                }}
                            >
                                {drawerSlot}
                            </motion.div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Vehicle Carousel */}
            <AnimatePresence>
                {!isMobile && mobileCarouselSlot && (
                    <motion.div
                        key="mobile-carousel"
                        className="home-modern__mobile-carousel"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {mobileCarouselSlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation */}
            <AnimatePresence>
                {!isMobile && mobileNavigationSlot && (
                    <motion.div
                        key="bottom-nav"
                        className="home-modern__bottom-nav"
                        initial={{ y: bottomNavHeight }}
                        animate={{ y: 0 }}
                        exit={{ y: bottomNavHeight }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {mobileNavigationSlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <AnimatePresence>
                {floatingActionSlot && (
                    <motion.div
                        key="fab"
                        className="home-modern__fab"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {floatingActionSlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Actions Panel */}
            <AnimatePresence>
                {quickActionsSlot && (
                    <motion.div
                        key="quick-actions"
                        className="home-modern__quick-actions"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {quickActionsSlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alert Drawer */}
            <AnimatePresence>
                {alertDrawerSlot && (
                    <motion.div
                        key="alert-drawer"
                        className="home-modern__alert-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {alertDrawerSlot}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Drawer Backdrop */}
            <AnimatePresence>
                {isMobile && isDrawerOpen && (
                    <motion.div
                        key="backdrop"
                        className="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggleDrawer}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        style={{
                            touchAction: 'none',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModernLayout;