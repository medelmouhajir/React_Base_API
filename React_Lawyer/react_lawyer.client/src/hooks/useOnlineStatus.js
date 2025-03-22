import { useState, useEffect } from 'react';

// Custom hook to track online/offline status
function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Update network status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Clean up event listeners
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export default useOnlineStatus;