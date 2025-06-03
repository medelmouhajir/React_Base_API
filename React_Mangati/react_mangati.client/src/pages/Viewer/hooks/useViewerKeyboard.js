// src/pages/Viewer/hooks/useViewerKeyboard.js
import { useEffect } from 'react';

/**
 * Hook to handle keyboard navigation in the viewer
 */
const useViewerKeyboard = ({
    mode,
    currentIndex,
    totalPages,
    setCurrentIndex,
    zoomIn,
    zoomOut,
    resetZoom
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (mode === 'infinite') return;

            // Navigation keys
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (currentIndex < totalPages - 1) {
                    setCurrentIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (currentIndex > 0) {
                    setCurrentIndex(prev => prev - 1);
                }
            }

            // Zoom controls
            else if (e.key === '+' || e.key === '=') {
                zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                zoomOut();
            } else if (e.key === '0') {
                resetZoom();
            }

            // Page number keys
            else if (e.key >= '1' && e.key <= '9') {
                // Calculate target page based on percentage
                const targetPercent = parseInt(e.key) / 10;
                const targetPage = Math.floor(targetPercent * totalPages);
                setCurrentIndex(Math.min(targetPage, totalPages - 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, currentIndex, totalPages, setCurrentIndex, zoomIn, zoomOut, resetZoom]);

    // No return value needed as this hook only adds an effect
};

export default useViewerKeyboard;