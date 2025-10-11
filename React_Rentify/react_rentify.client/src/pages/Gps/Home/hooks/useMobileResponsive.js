// src/pages/Gps/Home/hooks/useMobileResponsive.js
import { useState, useEffect, useCallback } from 'react';

const useMobileResponsive = () => {
    // Breakpoints
    const breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
    };

    // State
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    const [orientation, setOrientation] = useState(
        typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'portrait' : 'landscape'
    );

    const [deviceType, setDeviceType] = useState('desktop');
    const [isTouch, setIsTouch] = useState(false);

    // Calculate device type and capabilities
    const updateDeviceInfo = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update window size
        setWindowSize({ width, height });

        // Update orientation
        setOrientation(width < height ? 'portrait' : 'landscape');

        // Determine device type
        let newDeviceType;
        if (width <= breakpoints.mobile) {
            newDeviceType = 'mobile';
        } else if (width <= breakpoints.tablet) {
            newDeviceType = 'tablet';
        } else {
            newDeviceType = 'desktop';
        }
        setDeviceType(newDeviceType);

        // Detect touch capability
        const touchCapable = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;
        setIsTouch(touchCapable);
    }, []);

    // Debounced resize handler
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const debouncedUpdateDeviceInfo = useCallback(
        debounce(updateDeviceInfo, 150),
        [updateDeviceInfo]
    );

    // Effect to handle window resize
    useEffect(() => {
        updateDeviceInfo();

        window.addEventListener('resize', debouncedUpdateDeviceInfo);
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(updateDeviceInfo, 100);
        });

        return () => {
            window.removeEventListener('resize', debouncedUpdateDeviceInfo);
            window.removeEventListener('orientationchange', updateDeviceInfo);
        };
    }, [updateDeviceInfo, debouncedUpdateDeviceInfo]);

    // Computed properties
    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet';
    const isDesktop = deviceType === 'desktop';
    const isSmallScreen = windowSize.width <= breakpoints.mobile;
    const isMediumScreen = windowSize.width > breakpoints.mobile && windowSize.width <= breakpoints.tablet;
    const isLargeScreen = windowSize.width > breakpoints.tablet;
    const isPortrait = orientation === 'portrait';
    const isLandscape = orientation === 'landscape';

    // Mobile-specific checks
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobileDevice = isIOS || isAndroid;

    // Screen density
    const pixelRatio = window.devicePixelRatio || 1;
    const isRetinaDisplay = pixelRatio > 1;

    // Viewport calculations
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const availableHeight = viewportHeight - (isIOS ? 44 : 0); // Account for iOS status bar

    // Safe area calculations (for notched devices)
    const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)') || '0px';
    const safeAreaBottom = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-bottom)') || '0px';

    // Helper functions
    const getOptimalMapHeight = () => {
        if (isMobile) {
            // On mobile, leave room for bottom sheet and controls
            const headerHeight = 60;
            const bottomSheetHandle = 40;
            const safeAreaBottomPx = parseInt(safeAreaBottom.replace('px', '')) || 0;
            return viewportHeight - headerHeight - bottomSheetHandle - safeAreaBottomPx;
        } else {
            // On desktop, full height minus header
            return viewportHeight - 80;
        }
    };

    const getOptimalPanelWidth = () => {
        if (isDesktop) {
            return Math.min(350, windowSize.width * 0.25);
        } else if (isTablet) {
            return Math.min(300, windowSize.width * 0.3);
        } else {
            return windowSize.width; // Full width on mobile
        }
    };

    const shouldUseBottomSheet = () => {
        return isMobile || (isTablet && isPortrait);
    };

    const getGridColumns = (maxColumns = 4) => {
        if (isMobile) {
            return isPortrait ? 1 : 2;
        } else if (isTablet) {
            return isPortrait ? 2 : 3;
        } else {
            return Math.min(maxColumns, Math.floor(windowSize.width / 300));
        }
    };

    // Touch and gesture helpers
    const getTouchGestureHandlers = () => {
        return {
            // Prevent default touch behaviors that might interfere with map
            touchStart: (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault(); // Prevent pinch-to-zoom on non-map elements
                }
            },

            // Handle swipe gestures for bottom sheet
            handleSwipeGesture: (element, onSwipeUp, onSwipeDown) => {
                if (!isTouch) return;

                let startY = null;
                let startTime = null;

                const handleTouchStart = (e) => {
                    startY = e.touches[0].clientY;
                    startTime = Date.now();
                };

                const handleTouchMove = (e) => {
                    if (!startY) return;

                    const currentY = e.touches[0].clientY;
                    const diff = startY - currentY;

                    // Prevent scrolling during swipe
                    if (Math.abs(diff) > 10) {
                        e.preventDefault();
                    }
                };

                const handleTouchEnd = (e) => {
                    if (!startY || !startTime) return;

                    const endY = e.changedTouches[0].clientY;
                    const endTime = Date.now();
                    const diff = startY - endY;
                    const timeDiff = endTime - startTime;

                    // Check for swipe (minimum distance and maximum time)
                    if (Math.abs(diff) > 50 && timeDiff < 500) {
                        if (diff > 0 && onSwipeUp) {
                            onSwipeUp();
                        } else if (diff < 0 && onSwipeDown) {
                            onSwipeDown();
                        }
                    }

                    startY = null;
                    startTime = null;
                };

                element.addEventListener('touchstart', handleTouchStart, { passive: false });
                element.addEventListener('touchmove', handleTouchMove, { passive: false });
                element.addEventListener('touchend', handleTouchEnd, { passive: false });

                // Return cleanup function
                return () => {
                    element.removeEventListener('touchstart', handleTouchStart);
                    element.removeEventListener('touchmove', handleTouchMove);
                    element.removeEventListener('touchend', handleTouchEnd);
                };
            }
        };
    };

    return {
        // Device info
        windowSize,
        orientation,
        deviceType,
        isTouch,
        pixelRatio,
        isRetinaDisplay,

        // Device type booleans
        isMobile,
        isTablet,
        isDesktop,
        isSmallScreen,
        isMediumScreen,
        isLargeScreen,
        isPortrait,
        isLandscape,

        // Platform detection
        isIOS,
        isAndroid,
        isMobileDevice,

        // Viewport info
        viewportHeight,
        viewportWidth,
        availableHeight,
        safeAreaTop,
        safeAreaBottom,

        // Layout helpers
        getOptimalMapHeight,
        getOptimalPanelWidth,
        shouldUseBottomSheet,
        getGridColumns,

        // Touch helpers
        getTouchGestureHandlers,

        // Breakpoints (for CSS-in-JS or styled components)
        breakpoints,

        // CSS classes for conditional styling
        responsiveClasses: {
            mobile: isMobile ? 'mobile' : '',
            tablet: isTablet ? 'tablet' : '',
            desktop: isDesktop ? 'desktop' : '',
            portrait: isPortrait ? 'portrait' : '',
            landscape: isLandscape ? 'landscape' : '',
            touch: isTouch ? 'touch' : 'no-touch',
            ios: isIOS ? 'ios' : '',
            android: isAndroid ? 'android' : '',
            retina: isRetinaDisplay ? 'retina' : ''
        },

        // Media query strings for styled-components
        mediaQueries: {
            mobile: `@media (max-width: ${breakpoints.mobile - 1}px)`,
            tablet: `@media (min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
            desktop: `@media (min-width: ${breakpoints.tablet}px)`,
            largeDesktop: `@media (min-width: ${breakpoints.desktop}px)`,
            portrait: '@media (orientation: portrait)',
            landscape: '@media (orientation: landscape)',
            retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
        }
    };
};

export default useMobileResponsive;