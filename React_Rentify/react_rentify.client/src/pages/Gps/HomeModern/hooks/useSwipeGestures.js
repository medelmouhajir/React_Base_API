import { useEffect, useRef } from 'react';

const useSwipeGestures = (elementRef, callbacks = {}) => {
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const isSwipingRef = useRef(false);

    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        velocityThreshold = 0.5,
        ignoreSelectors = []
    } = callbacks;

    useEffect(() => {
        const element = elementRef?.current;
        if (!element) return;

        const shouldIgnoreEvent = (target) => {
            if (!ignoreSelectors?.length || !target?.closest) return false;
            return ignoreSelectors.some((selector) => target.closest(selector));
        };

        const handleTouchStart = (e) => {

            if (shouldIgnoreEvent(e.target)) {
                touchStartRef.current = null;
                touchEndRef.current = null;
                isSwipingRef.current = false;
                return;
            }

            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                timestamp: Date.now()
            };
            isSwipingRef.current = true;
        };

        const handleTouchMove = (e) => {
            if (shouldIgnoreEvent(e.target)) {
                return;
            }

            if (!touchStartRef.current || !isSwipingRef.current) return;

            touchEndRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                timestamp: Date.now()
            };

            // Prevent default scrolling during horizontal swipes
            const deltaX = Math.abs(touchEndRef.current.x - touchStartRef.current.x);
            const deltaY = Math.abs(touchEndRef.current.y - touchStartRef.current.y);

            if (deltaX > deltaY && deltaX > 20) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = (e) => {
            if (shouldIgnoreEvent(e.target)) {
                touchStartRef.current = null;
                touchEndRef.current = null;
                isSwipingRef.current = false;
                return;
            }

            if (!touchStartRef.current || !touchEndRef.current || !isSwipingRef.current) {
                isSwipingRef.current = false;
                return;
            }

            const deltaX = touchEndRef.current.x - touchStartRef.current.x;
            const deltaY = touchEndRef.current.y - touchStartRef.current.y;
            const deltaTime = touchEndRef.current.timestamp - touchStartRef.current.timestamp;

            const distanceX = Math.abs(deltaX);
            const distanceY = Math.abs(deltaY);
            const velocity = Math.max(distanceX, distanceY) / deltaTime;

            // Check if swipe meets threshold requirements
            if (velocity >= velocityThreshold) {
                if (distanceX > distanceY && distanceX > threshold) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        onSwipeRight?.();
                    } else {
                        onSwipeLeft?.();
                    }
                } else if (distanceY > distanceX && distanceY > threshold) {
                    // Vertical swipe
                    if (deltaY > 0) {
                        onSwipeDown?.();
                    } else {
                        onSwipeUp?.();
                    }
                }
            }

            touchStartRef.current = null;
            touchEndRef.current = null;
            isSwipingRef.current = false;
        };

        const handleTouchCancel = () => {
            touchStartRef.current = null;
            touchEndRef.current = null;
            isSwipingRef.current = false;
        };

        // Add event listeners
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold, ignoreSelectors]);
};

export default useSwipeGestures;