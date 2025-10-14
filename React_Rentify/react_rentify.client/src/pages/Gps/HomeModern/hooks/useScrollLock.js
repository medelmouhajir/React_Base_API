import { useEffect } from 'react';

export const useScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            // Store current scroll position
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Apply styles to prevent scrolling
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll position and remove styles
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.width = '';
                document.body.style.height = '';
                document.body.style.overflow = '';

                // Restore scroll position
                window.scrollTo(scrollX, scrollY);
            };
        }
    }, [isLocked]);
};
export default useScrollLock;