// src/pages/Viewer/components/ViewingModes/VerticalViewer.jsx
import React, { useRef, useEffect } from 'react';
import NavigationArrows from '../NavigationControls/NavigationArrows';
import './ViewingModes.css';

const VerticalViewer = ({
    pages,
    currentIndex,
    zoom,
    baseUrl,
    onNextPage,
    onPrevPage
}) => {
    const viewerRef = useRef(null);
    const hammerRef = useRef(null);

    // Set up touch gestures
    useEffect(() => {
        if (!viewerRef.current || pages.length === 0) return;

        const setupHammer = async () => {
            try {
                const Hammer = (await import('hammerjs')).default;

                if (hammerRef.current) {
                    hammerRef.current.destroy();
                }

                hammerRef.current = new Hammer(viewerRef.current);
                hammerRef.current.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

                hammerRef.current.on('swipeup', () => {
                    if (currentIndex < pages.length - 1) {
                        onNextPage();
                    }
                });

                hammerRef.current.on('swipedown', () => {
                    if (currentIndex > 0) {
                        onPrevPage();
                    }
                });
            } catch (err) {
                console.error('Error setting up Hammer.js:', err);
            }
        };

        setupHammer();

        return () => {
            if (hammerRef.current) {
                hammerRef.current.destroy();
                hammerRef.current = null;
            }
        };
    }, [viewerRef, pages, currentIndex, onNextPage, onPrevPage]);

    return (
        <div className="viewer-mode vertical-mode" ref={viewerRef}>
            <NavigationArrows
                direction="vertical"
                onNext={onNextPage}
                onPrev={onPrevPage}
                disableNext={currentIndex === pages.length - 1}
                disablePrev={currentIndex === 0}
            />

            {pages.length > 0 && (
                <div className="page-container" style={{ transform: `scale(${zoom / 100})` }}>
                    <img
                        src={`${baseUrl}${pages[currentIndex].imageUrl}`}
                        alt={`Page ${currentIndex + 1}`}
                        className="manga-page"
                    />
                </div>
            )}
        </div>
    );
};

export default VerticalViewer;