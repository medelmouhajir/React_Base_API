import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import chapterService from '../../services/chapterService';
import './Viewer.css';
import { useAuth } from '../../contexts/AuthContext';
import useUserData from '../../hooks/useUserData';

const Viewer = () => {
    const { id } = useParams(); // chapterId
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [chapter, setChapter] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState('infinite'); // Changed default to infinite
    const [zoom, setZoom] = useState(100); // Zoom percentage
    const [loading, setLoading] = useState(true);
    const [zoomIndicatorVisible, setZoomIndicatorVisible] = useState(false);
    const contentRef = useRef(null);
    const hammerRef = useRef(null);
    const zoomTimeout = useRef(null);

    const MIN_ZOOM = 50;
    const MAX_ZOOM = 200;
    const ZOOM_STEP = 10;


    const { user } = useAuth();
    const { saveReadingProgress, getReadingProgress } = useUserData();
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Load initial reading progress
    useEffect(() => {
        const loadInitialProgress = async () => {
            if (!user || !id) return;

            try {
                const progress = await getReadingProgress(parseInt(id));
                if (progress && progress.lastReadPage >= 0) {
                    setCurrentPageIndex(progress.lastReadPage);
                }
            } catch (error) {
                console.error('Error loading reading progress:', error);
            }
        };

        loadInitialProgress();
    }, [user, id, getReadingProgress]);

    // Save reading progress periodically
    useEffect(() => {
        if (!user || !id || currentPageIndex < 0) return;

        const saveTimer = setTimeout(() => {
            saveReadingProgress(parseInt(id), currentPageIndex)
                .catch(error => console.error('Error saving reading progress:', error));
        }, 3000); // Save after 3 seconds of inactivity

        return () => clearTimeout(saveTimer);
    }, [user, id, currentPageIndex, saveReadingProgress]);

    // Save on page exit
    useEffect(() => {
        if (!user || !id) return;

        const handleBeforeUnload = () => {
            saveReadingProgress(parseInt(id), currentPageIndex);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [user, id, currentPageIndex, saveReadingProgress]);


    // Fetch chapter and pages data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch chapter details
                const chapterResponse = await chapterService.getById(id);
                setChapter(chapterResponse.data);

                // Fetch pages for this chapter
                const pagesResponse = await pageService.getByChapterId(id);
                const sortedPages = pagesResponse.data.sort((a, b) => a.order - b.order);
                setPages(sortedPages);
            } catch (error) {
                console.error('Error fetching chapter data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Set up touch gestures for non-infinite modes
    useEffect(() => {
        if (!contentRef.current || pages.length === 0 || mode === 'infinite') return;

        const setupHammer = async () => {
            try {
                const Hammer = (await import('hammerjs')).default;

                if (hammerRef.current) {
                    hammerRef.current.destroy();
                }

                hammerRef.current = new Hammer(contentRef.current);
                hammerRef.current.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

                hammerRef.current.on('swipeleft', () => {
                    if (currentIndex < pages.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                    }
                });

                hammerRef.current.on('swiperight', () => {
                    if (currentIndex > 0) {
                        setCurrentIndex(prev => prev - 1);
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
    }, [contentRef, pages, currentIndex, mode]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (mode === 'infinite') return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (currentIndex < pages.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (currentIndex > 0) {
                    setCurrentIndex(prev => prev - 1);
                }
            } else if (e.key === '+' || e.key === '=') {
                zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                zoomOut();
            } else if (e.key === '0') {
                resetZoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, pages, mode]);

    // Zoom functions
    const zoomIn = () => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
        showZoomIndicator();
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
        showZoomIndicator();
    };

    const resetZoom = () => {
        setZoom(100);
        showZoomIndicator();
    };

    const showZoomIndicator = () => {
        setZoomIndicatorVisible(true);

        if (zoomTimeout.current) {
            clearTimeout(zoomTimeout.current);
        }

        zoomTimeout.current = setTimeout(() => {
            setZoomIndicatorVisible(false);
        }, 1500);
    };

    // Navigation functions
    const goToNextPage = () => {
        if (currentIndex < pages.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            setCurrentPageIndex(newIndex);
        }
    };

    const goToPrevPage = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setCurrentPageIndex(newIndex);
        }
    };

    const goToFirstPage = () => {
        setCurrentIndex(0);
    };

    const goToLastPage = () => {
        setCurrentIndex(pages.length - 1);
    };

    // Handle mode change
    const handleModeChange = (e) => {
        const newMode = e.target.value;
        setMode(newMode);
        if (newMode === 'infinite') {
            // Reset to first page when switching to infinite
            setCurrentIndex(0);
        }
    };

    // Get current progress
    const getProgress = () => {
        if (pages.length === 0) return '0/0';
        return `${currentIndex + 1}/${pages.length}`;
    };

    // Render functions for different modes
    const renderHorizontalMode = () => (
        <div className="viewer-mode horizontal-mode" ref={contentRef}>
            <button
                className="nav-arrow nav-arrow--left"
                onClick={goToPrevPage}
                disabled={currentIndex === 0}
                aria-label="Previous page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.length > 0 && (
                <div className="page-container" style={{ transform: `scale(${zoom / 100})` }}>
                    <img
                        src={`${import.meta.env.VITE_API_URL}${pages[currentIndex].imageUrl}`}
                        alt={`Page ${currentIndex + 1}`}
                        className="manga-page"
                    />
                </div>
            )}

            <button
                className="nav-arrow nav-arrow--right"
                onClick={goToNextPage}
                disabled={currentIndex === pages.length - 1}
                aria-label="Next page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7-7" />
                </svg>
            </button>
        </div>
    );

    const renderVerticalMode = () => (
        <div className="viewer-mode vertical-mode" ref={contentRef}>
            <button
                className="nav-arrow nav-arrow--top"
                onClick={goToPrevPage}
                disabled={currentIndex === 0}
                aria-label="Previous page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>

            {pages.length > 0 && (
                <div className="page-container" style={{ transform: `scale(${zoom / 100})` }}>
                    <img
                        src={`${import.meta.env.VITE_API_URL}${pages[currentIndex].imageUrl}`}
                        alt={`Page ${currentIndex + 1}`}
                        className="manga-page"
                    />
                </div>
            )}

            <button
                className="nav-arrow nav-arrow--bottom"
                onClick={goToNextPage}
                disabled={currentIndex === pages.length - 1}
                aria-label="Next page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );

    const renderInfiniteMode = () => (
        <div className="viewer-mode infinite-mode" ref={contentRef}>
            <div className="infinite-scroll-container" style={{ transform: `scale(${zoom / 100})` }}>
                {pages.map((page, index) => (
                    <div key={page.id} className="page-wrapper">
                        <img
                            src={`${import.meta.env.VITE_API_URL}${page.imageUrl}`}
                            alt={`Page ${index + 1}`}
                            className="manga-page"
                            loading="lazy"
                        />
                        <div className="page-number">{index + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="manga-viewer">
                <div className="viewer-toolbar">
                    <button className="toolbar-btn toolbar-btn--icon" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="chapter-title">Loading...</h2>
                </div>
                <div className="viewer-content--loading">
                    <div className="loader">
                        <div className="loader-spinner"></div>
                        <p>Loading chapter...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="manga-viewer">
            {/* Enhanced Toolbar */}
            <div className="viewer-toolbar">
                <div className="toolbar-section toolbar-section--left">
                    <button
                        className="toolbar-btn toolbar-btn--icon"
                        onClick={() => navigate(-1)}
                        title="Back to series"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="toolbar-divider"></div>

                    <h2 className="chapter-title">
                        {chapter ? `Chapter ${chapter.number}: ${chapter.serie.title}` : 'Chapter'}
                    </h2>
                </div>

                <div className="toolbar-section toolbar-section--center">
                    {/* Reading Mode Selector */}
                    <div className="mode-selector">
                        <button
                            className={`mode-btn ${mode === 'infinite' ? 'mode-btn--active' : ''}`}
                            onClick={() => handleModeChange({ target: { value: 'infinite' } })}
                            title="Infinite scroll mode"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                            </svg>
                            <span>Scroll</span>
                        </button>
                        <button
                            className={`mode-btn ${mode === 'horizontal' ? 'mode-btn--active' : ''}`}
                            onClick={() => handleModeChange({ target: { value: 'horizontal' } })}
                            title="Horizontal page mode"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12m-12 5h12" />
                            </svg>
                            <span>Pages</span>
                        </button>
                        <button
                            className={`mode-btn ${mode === 'vertical' ? 'mode-btn--active' : ''}`}
                            onClick={() => handleModeChange({ target: { value: 'vertical' } })}
                            title="Vertical page mode"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                            </svg>
                            <span>Vertical</span>
                        </button>
                    </div>

                    <div className="toolbar-divider"></div>

                    {/* Zoom Controls */}
                    <div className="zoom-controls">
                        <button
                            className="toolbar-btn toolbar-btn--icon"
                            onClick={zoomOut}
                            disabled={zoom <= MIN_ZOOM}
                            title="Zoom out"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </button>
                        <button
                            className="toolbar-btn toolbar-btn--text"
                            onClick={resetZoom}
                            title="Reset zoom"
                        >
                            {zoom}%
                        </button>
                        <button
                            className="toolbar-btn toolbar-btn--icon"
                            onClick={zoomIn}
                            disabled={zoom >= MAX_ZOOM}
                            title="Zoom in"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="toolbar-section toolbar-section--right">
                    {/* Navigation Controls - Hidden in infinite mode */}
                    {mode !== 'infinite' && (
                        <>
                            <div className="nav-controls">
                                <button
                                    className="toolbar-btn toolbar-btn--icon"
                                    onClick={goToFirstPage}
                                    disabled={currentIndex === 0}
                                    title="First page"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 19.5l-7-7 7-7m-13 0v14" />
                                    </svg>
                                </button>
                                <button
                                    className="toolbar-btn toolbar-btn--icon"
                                    onClick={goToPrevPage}
                                    disabled={currentIndex === 0}
                                    title="Previous page"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <span className="page-indicator">
                                    {getProgress()}
                                </span>

                                <button
                                    className="toolbar-btn toolbar-btn--icon"
                                    onClick={goToNextPage}
                                    disabled={currentIndex === pages.length - 1}
                                    title="Next page"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    className="toolbar-btn toolbar-btn--icon"
                                    onClick={goToLastPage}
                                    disabled={currentIndex === pages.length - 1}
                                    title="Last page"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 19.5l7-7-7-7m13 0v14" />
                                    </svg>
                                </button>
                            </div>
                            <div className="toolbar-divider"></div>
                        </>
                    )}

                    {/* Full Screen Button */}
                    <button
                        className="toolbar-btn toolbar-btn--icon"
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen();
                            } else {
                                document.exitFullscreen();
                            }
                        }}
                        title="Toggle fullscreen"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="viewer-content">
                {pages.length === 0 ? (
                    <div className="no-pages">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <p>No pages found for this chapter.</p>
                        <button className="toolbar-btn" onClick={() => navigate(-1)}>
                            Go Back
                        </button>
                    </div>
                ) : (
                    <>
                        {mode === 'horizontal' && renderHorizontalMode()}
                        {mode === 'vertical' && renderVerticalMode()}
                        {mode === 'infinite' && renderInfiniteMode()}
                    </>
                )}
            </div>

            {/* Zoom Indicator */}
            <div className={`zoom-indicator ${zoomIndicatorVisible ? 'zoom-indicator--visible' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <span>{zoom}%</span>
            </div>
        </div>
    );
};

export default Viewer;