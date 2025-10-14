export const useVisibilityChange = (callback) => {
    useEffect(() => {
        const handleVisibilityChange = () => {
            callback(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [callback]);
};