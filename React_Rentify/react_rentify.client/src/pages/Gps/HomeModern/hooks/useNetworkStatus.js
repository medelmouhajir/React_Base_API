export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionType, setConnectionType] = useState(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const updateConnectionType = () => {
            if ('connection' in navigator) {
                setConnectionType(navigator.connection.effectiveType);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', updateConnectionType);
            updateConnectionType();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if ('connection' in navigator) {
                navigator.connection.removeEventListener('change', updateConnectionType);
            }
        };
    }, []);

    return { isOnline, connectionType };
};