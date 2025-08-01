// src/pages/Viewer/components/ViewingModes/InfiniteScrollViewer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import useUserData from '../../../../hooks/useUserData';
import './ViewingModes.css';

/**
 * InfiniteScrollViewer component with fluid progressive image loading
 * Downloads first image immediately, then loads others based on viewport proximity
 */
const InfiniteScrollViewer = ({ pages, zoom, baseUrl, chapter, currentIndex = 0 }) => {
    // Track loading states: 'pending', 'loading', 'loaded', 'error'
    const [imageStates, setImageStates] = useState({});
    const [visibleIndexes, setVisibleIndexes] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(currentIndex);
    const [loadQueue, setLoadQueue] = useState([]);
    const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false);
    const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const loadingObserverRef = useRef(null);
    const imageRefs = useRef({});
    const progressSaveTimeoutRef = useRef(null);

    const { user } = useAuth();
    const { saveReadingProgress } = useUserData();

    // Initialize current page index when prop changes
    useEffect(() => {
        if (currentIndex !== undefined && currentIndex !== currentPageIndex) {
            setCurrentPageIndex(currentIndex);
        }
    }, [currentIndex]);

    // Initialize first image loading immediately
    useEffect(() => {
        if (pages.length > 0) {
            // Determine which image to load first based on currentIndex
            const initialImageIndex = Math.max(0, currentIndex || 0);

            // Always load the first image (index 0) immediately for smooth experience
            // Also load the current page if it's different from 0
            const imagesToLoad = [0];
            if (initialImageIndex > 0) {
                imagesToLoad.push(initialImageIndex);
            }

            // Load initial images immediately for fluid reading experience
            setImageStates(prev => {
                const newStates = { ...prev };
                imagesToLoad.forEach(index => {
                    newStates[index] = 'loading';
                });
                return newStates;
            });
            setLoadQueue(imagesToLoad);
        }
    }, [pages.length, currentIndex]);

    // Scroll to initial position after images are loaded and DOM is ready
    useEffect(() => {
        if (pages.length > 0 && containerRef.current && !hasScrolledToInitial && currentIndex > 0) {
            const scrollToInitialPosition = () => {
                const targetElement = containerRef.current.querySelector(`[data-index="${currentIndex}"]`);
                if (targetElement) {
                    // Use smooth scroll to the target element
                    targetElement.scrollIntoView({
                        behavior: 'auto', // Use auto for immediate positioning, smooth for animated
                        block: 'start',
                        inline: 'nearest'
                    });
                    setHasScrolledToInitial(true);
                } else {
                    // If element not found, try again after a short delay
                    setTimeout(scrollToInitialPosition, 100);
                }
            };

            // Give some time for DOM to render
            const timeoutId = setTimeout(scrollToInitialPosition, 150);
            return () => clearTimeout(timeoutId);
        }
    }, [pages.length, currentIndex, hasScrolledToInitial]);

    // Progressive loading queue management
    const processLoadQueue = useCallback(() => {
        if (loadQueue.length === 0) return;

        const indexToLoad = loadQueue[0];
        const newQueue = loadQueue.slice(1);
        setLoadQueue(newQueue);

        if (imageStates[indexToLoad] === 'loading') {
            // Image is already being processed, continue with next
            if (newQueue.length > 0) {
                setTimeout(processLoadQueue, 100);
            }
        }
    }, [loadQueue, imageStates]);

    // Process queue when it changes
    useEffect(() => {
        if (loadQueue.length > 0) {
            const timeoutId = setTimeout(processLoadQueue, isFirstImageLoaded ? 200 : 0);
            return () => clearTimeout(timeoutId);
        }
    }, [loadQueue, processLoadQueue, isFirstImageLoaded]);

    // Determine which images should be prioritized for loading
    const determineLoadPriority = useCallback(() => {
        if (visibleIndexes.length === 0) return [];

        const minVisible = Math.min(...visibleIndexes);
        const maxVisible = Math.max(...visibleIndexes);

        // Priority loading strategy:
        // 1. Currently visible images (highest priority)
        // 2. Next 2 images after visible range (medium priority)
        // 3. Previous 1 image before visible range (low priority)
        const priorities = [];

        // Add visible images with highest priority
        for (let i = minVisible; i <= maxVisible; i++) {
            if (imageStates[i] === undefined) {
                priorities.push({ index: i, priority: 3 });
            }
        }

        // Add upcoming images
        for (let i = maxVisible + 1; i <= Math.min(maxVisible + 2, pages.length - 1); i++) {
            if (imageStates[i] === undefined) {
                priorities.push({ index: i, priority: 2 });
            }
        }

        // Add previous image
        if (minVisible > 0 && imageStates[minVisible - 1] === undefined) {
            priorities.push({ index: minVisible - 1, priority: 1 });
        }

        // Sort by priority (highest first) and return indexes
        return priorities
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.index);
    }, [visibleIndexes, imageStates, pages.length]);

    // Update load queue when visible indexes change
    useEffect(() => {
        const newIndexesToLoad = determineLoadPriority();
        if (newIndexesToLoad.length > 0) {
            setLoadQueue(prevQueue => {
                const combinedQueue = [...prevQueue, ...newIndexesToLoad];
                // Remove duplicates while preserving order
                return combinedQueue.filter((index, pos) =>
                    combinedQueue.indexOf(index) === pos
                );
            });

            // Mark new images as loading
            setImageStates(prev => {
                const updated = { ...prev };
                newIndexesToLoad.forEach(index => {
                    if (updated[index] === undefined) {
                        updated[index] = 'loading';
                    }
                });
                return updated;
            });
        }
    }, [determineLoadPriority]);

    // Setup Intersection Observer for viewport tracking
    useEffect(() => {
        if (!containerRef.current || pages.length === 0) return;

        // Observer for tracking visible pages
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const newVisibleIndexes = [];
                let newCurrentPageIndex = currentPageIndex;

                entries.forEach((entry) => {
                    const index = parseInt(entry.target.dataset.index);
                    if (entry.isIntersecting) {
                        newVisibleIndexes.push(index);

                        // Update current page to the topmost visible page
                        if (entry.intersectionRatio > 0.5) {
                            newCurrentPageIndex = index;
                        }
                    }
                });

                setVisibleIndexes(newVisibleIndexes);

                if (newCurrentPageIndex !== currentPageIndex) {
                    setCurrentPageIndex(newCurrentPageIndex);

                    // Debounced progress saving
                    if (progressSaveTimeoutRef.current) {
                        clearTimeout(progressSaveTimeoutRef.current);
                    }

                    progressSaveTimeoutRef.current = setTimeout(() => {
                        if (user && chapter?.id) {
                            saveReadingProgress(chapter.id, newCurrentPageIndex + 1);
                        }
                    }, 1000);
                }
            },
            {
                root: containerRef.current,
                rootMargin: '50px 0px 150px 0px', // Preload area
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        // Observe all page wrappers
        const pageWrappers = containerRef.current.querySelectorAll('.page-wrapper');
        pageWrappers.forEach(el => {
            observerRef.current.observe(el);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (progressSaveTimeoutRef.current) {
                clearTimeout(progressSaveTimeoutRef.current);
            }
        };
    }, [pages.length, currentPageIndex, user, chapter, saveReadingProgress]);

    // Handle successful image load
    const handleImageLoaded = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'loaded'
        }));

        if (index === 0) {
            setIsFirstImageLoaded(true);
        }
    }, []);

    // Handle image load error
    const handleImageError = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'error'
        }));
    }, []);

    // Retry loading an image
    const retryImageLoad = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'loading'
        }));
    }, []);

    // Render image component based on its loading state
    const renderImageContent = (page, index) => {
        const state = imageStates[index];

        switch (state) {
            case 'loaded':
                return (
                    <img
                        ref={el => imageRefs.current[index] = el}
                        src={`${baseUrl}${page.imageUrl}`}
                        alt={`Page ${index + 1}`}
                        className="manga-page manga-page--loaded"
                        loading="lazy"
                        decoding="async"
                    />
                );

            case 'loading':
                return (
                    <>
                        <img
                            ref={el => imageRefs.current[index] = el}
                            src={`${baseUrl}${page.imageUrl}`}
                            alt={`Page ${index + 1}`}
                            className="manga-page manga-page--loading"
                            onLoad={() => handleImageLoaded(index)}
                            onError={() => handleImageError(index)}
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="manga-page-placeholder">
                            <div className="placeholder-spinner"></div>
                            <div className="placeholder-text">
                                Loading page {index + 1}...
                            </div>
                        </div>
                    </>
                );

            case 'error':
                return (
                    <div className="manga-page-placeholder manga-page-placeholder--error">
                        <div className="placeholder-icon">⚠️</div>
                        <div className="placeholder-text">
                            Failed to load page {index + 1}
                        </div>
                        <button
                            className="placeholder-retry"
                            onClick={() => retryImageLoad(index)}
                        >
                            Retry
                        </button>
                    </div>
                );

            default: // 'pending' or undefined
                return (
                    <div className="manga-page-placeholder manga-page-placeholder--light">
                        <div className="placeholder-content">
                            <div className="placeholder-icon">📖</div>
                            <div className="placeholder-text">Page {index + 1}</div>
                        </div>
                    </div>
                );
        }
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
                        key={`${page.id}-${index}`}
                        className={`page-wrapper ${currentPageIndex === index ? 'page-wrapper--current' : ''
                            }`}
                        data-index={index}
                    >
                        {renderImageContent(page, index)}

                        <div className="page-number">
                            {index + 1}
                        </div>

                        {/* Progress indicator for current page */}
                        {currentPageIndex === index && (
                            <div className="current-page-indicator">
                                <div className="indicator-dot"></div>
                            </div>
                        )}
                    </div>
                ))}

                {/* End of chapter indicator */}
                {pages.length > 0 && (
                    <div className="chapter-end-indicator">
                        <div className="end-content">
                            <div className="end-icon">📚</div>
                            <h3>End of Chapter</h3>
                            <p>You've reached the end of this chapter</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfiniteScrollViewer;