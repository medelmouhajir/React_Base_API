import { useState, useCallback, useEffect } from 'react';

export const useModernLayout = ({ isMobile, isTablet }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
    const [drawerMode, setDrawerMode] = useState(isMobile ? 'overlay' : 'sidebar');
    const [lastInteraction, setLastInteraction] = useState(Date.now());

    // Auto-close drawer on mobile after inactivity
    useEffect(() => {
        if (!isMobile || !isDrawerOpen) return;

        const timer = setTimeout(() => {
            if (Date.now() - lastInteraction > 10000) { // 10 seconds
                setIsDrawerOpen(false);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [isMobile, isDrawerOpen, lastInteraction]);

    // Update drawer mode based on screen size
    useEffect(() => {
        if (isMobile) {
            setDrawerMode('overlay');
        } else if (isTablet) {
            setDrawerMode('collapsible');
        } else {
            setDrawerMode('sidebar');
        }
    }, [isMobile, isTablet]);

    const toggleDrawer = useCallback(() => {
        setIsDrawerOpen(prev => !prev);
        setLastInteraction(Date.now());
    }, []);

    const closeDrawerForMobile = useCallback(() => {
        if (isMobile) {
            setIsDrawerOpen(false);
        }
        setLastInteraction(Date.now());
    }, [isMobile]);

    const openDrawer = useCallback(() => {
        setIsDrawerOpen(true);
        setLastInteraction(Date.now());
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setLastInteraction(Date.now());
    }, []);

    const preventMapTouch = useCallback((e) => {
        if (isMobile && isDrawerOpen) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, [isMobile, isDrawerOpen]);

    return {
        isDrawerOpen,
        drawerMode,
        toggleDrawer,
        closeDrawerForMobile,
        openDrawer,
        closeDrawer,
        setDrawerMode,
        preventMapTouch // Add this new function
    };
};