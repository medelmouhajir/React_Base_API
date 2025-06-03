// src/pages/Viewer/components/ViewingModes/InfiniteScrollViewer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ViewingModes.css';

/**
 * InfiniteScrollViewer component with advanced lazy loading
 * Only loads images when they are near the viewport
 */
const InfiniteScrollViewer = ({ pages, zoom, baseUrl }) => {
    // Keep track of which images are loaded or loading
    const [loadedImages, setLoadedImages] = useState({});
    const [visibleIndexes, setVisibleIndexes] = useState([]);
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const loadingObserverRef = useRef(null);

    // Determine the range of images to preload (current visible + buffer)
    const getImagesToLoad = useCallback(() => {
        if (visibleIndexes.length === 0) return [];

        // Find min and max of visible indexes
        const minVisible = Math.min(...visibleIndexes);
        const maxVisible = Math.max(...visibleIndexes);

        // Create a range that includes a buffer of images before and after
        // Here we load current visible images plus 1 before and 2 after
        const preloadBuffer = 2;
        const startIndex = Math.max(0, minVisible - 1);
        const endIndex = Math.min(pages.length - 1, maxVisible + preloadBuffer);

        const indexesToLoad = [];
        for (let i = startIndex; i <= endIndex; i++) {
            indexesToLoad.push(i);
        }

        return indexesToLoad;
    }, [visibleIndexes, pages.length]);

    // Update the loadedImages state when visible images change
    useEffect(() => {
        const imagesToLoad = getImagesToLoad();

        // Skip if no images to load
        if (imagesToLoad.length === 0) return;

        // Update loaded images state
        setLoadedImages(prevLoaded => {
            const newLoaded = { ...prevLoaded };

            // Mark images that should be loaded
            imagesToLoad.forEach(index => {
                if (newLoaded[index] === undefined) {
                    newLoaded[index] = 'loading';
                }
            });

            return newLoaded;
        });
    }, [getImagesToLoad]);

    // Set up intersection observer for visibility detection
    useEffect(() => {
        if (!containerRef.current) return;

        // Create intersection observer to detect which pages are visible
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const newVisibleIndexes = [];

                entries.forEach(entry => {
                    const index = parseInt(entry.target.dataset.index);

                    // If page is intersecting (visible)
                    if (entry.isIntersecting) {
                        newVisibleIndexes.push(index);
                    }
                });

                if (newVisibleIndexes.length > 0) {
                    setVisibleIndexes(newVisibleIndexes);
                }
            },
            {
                root: null,
                rootMargin: '100px 0px', // Start loading when within 100px of viewport
                threshold: 0.1 // 10% visibility triggers the callback
            }
        );

        // Observe all page wrapper elements
        const pageWrappers = containerRef.current.querySelectorAll('.page-wrapper');
        pageWrappers.forEach(el => {
            observerRef.current.observe(el);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [pages.length]);

    // Handle image load success
    const handleImageLoaded = (index) => {
        setLoadedImages(prev => ({
            ...prev,
            [index]: 'loaded'
        }));
    };

    // Handle image load error
    const handleImageError = (index) => {
        setLoadedImages(prev => ({
            ...prev,
            [index]: 'error'
        }));
    };

    // Create a placeholder for images not yet loaded
    const renderPlaceholder = (index, page) => {
        return (
            <div className="manga-page-placeholder">
                <div className="placeholder-spinner"></div>
                <div className="placeholder-text">Loading page {index + 1}...</div>
            </div>
        );
    };

    return (
        <div className="viewer-mode infinite-mode">
            <div
                className="infinite-scroll-container"
                style={{ transform: `scale(${zoom / 100})` }}
                ref={containerRef}
            >
                {pages.map((page, index) => (
                    <div
                        key={page.id}
                        className="page-wrapper"
                        data-index={index}
                    >
                        {loadedImages[index] === undefined ? (
                            // Not yet ready to load - show light placeholder
                            <div className="manga-page-placeholder manga-page-placeholder--light">
                                <div className="placeholder-text">Page {index + 1}</div>
                            </div>
                        ) : loadedImages[index] === 'loading' || loadedImages[index] === 'loaded' ? (
                            // Loading or loaded - render image with proper loading state
                            <>
                                <img
                                    src={`${baseUrl}${page.imageUrl}`}
                                    alt={`Page ${index + 1}`}
                                    className={`manga-page ${loadedImages[index] === 'loaded' ? 'manga-page--loaded' : 'manga-page--loading'}`}
                                    onLoad={() => handleImageLoaded(index)}
                                    onError={() => handleImageError(index)}
                                    style={{
                                        opacity: loadedImages[index] === 'loaded' ? 1 : 0
                                    }}
                                />
                                {loadedImages[index] === 'loading' && renderPlaceholder(index, page)}
                            </>
                        ) : (
                            // Error loading - show error placeholder
                            <div className="manga-page-placeholder manga-page-placeholder--error">
                                <div className="placeholder-icon">⚠️</div>
                                <div className="placeholder-text">Error loading page {index + 1}</div>
                                <button
                                    className="placeholder-retry"
                                    onClick={() => setLoadedImages(prev => ({
                                        ...prev,
                                        [index]: 'loading'
                                    }))}
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        <div className="page-number">{index + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InfiniteScrollViewer;