import React from 'react';

const ModernLayout = ({
    isDarkMode,
    isMobile,
    isTablet,
    isDrawerOpen,
    onToggleDrawer,
    summarySlot,
    mapSlot,
    drawerSlot,
    mobileCarouselSlot,
    alertDrawerSlot
}) => {
    const className = [
        'home-modern',
        isDarkMode ? 'dark' : 'light',
        isMobile ? 'mobile' : 'desktop',
        isTablet ? 'tablet' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={className}>
            {summarySlot}

            <div className="home-modern__main">
                <div className="home-modern__map">
                    {mapSlot}
                </div>
                <aside className={`home-modern__drawer glass ${isDrawerOpen ? 'open' : ''}`}>
                    <button
                        type="button"
                        className="home-modern__drawer-toggle ghost-btn"
                        onClick={onToggleDrawer}
                        aria-expanded={isDrawerOpen}
                    >
                        {isDrawerOpen ? '⟩' : '⟨'}
                    </button>
                    <div className="home-modern__drawer-content">
                        {drawerSlot}
                    </div>
                </aside>
            </div>

            {isMobile && (
                <div className="home-modern__mobile-rail">
                    {mobileCarouselSlot}
                </div>
            )}

            {alertDrawerSlot}
        </div>
    );
};

export default ModernLayout;