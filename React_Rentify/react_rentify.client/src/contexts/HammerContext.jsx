// src/contexts/HammerContext.jsx
import { createContext, useEffect, useContext } from 'react';
import Hammer from 'hammerjs';

const HammerContext = createContext(null);

export const useHammer = () => {
    const context = useContext(HammerContext);
    if (!context) {
        throw new Error('useHammer must be used within a HammerProvider');
    }
    return context;
};

export const HammerProvider = ({ children }) => {
    useEffect(() => {
        // Add global swipe support for mobile navigation
        if (window.innerWidth < 1024) {
            const hammer = new Hammer(document.body);

            // Configure Hammer
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

            // Event listeners
            hammer.on('swiperight', (e) => {
                // Handle swipe right (e.g., open sidebar)
                document.dispatchEvent(new CustomEvent('app:swiperight', { detail: e }));
            });

            hammer.on('swipeleft', (e) => {
                // Handle swipe left (e.g., close sidebar)
                document.dispatchEvent(new CustomEvent('app:swipeleft', { detail: e }));
            });

            return () => {
                // Clean up
                hammer.destroy();
            };
        }
    }, []);

    const attachSwipeHandler = (element, direction, handler) => {
        if (!element) return () => { };

        const hammer = new Hammer(element);
        hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

        const eventName = direction === 'right' ? 'swiperight' : 'swipeleft';
        hammer.on(eventName, handler);

        return () => {
            hammer.off(eventName, handler);
            hammer.destroy();
        };
    };

    return (
        <HammerContext.Provider value={{ attachSwipeHandler }}>
            {children}
        </HammerContext.Provider>
    );
};