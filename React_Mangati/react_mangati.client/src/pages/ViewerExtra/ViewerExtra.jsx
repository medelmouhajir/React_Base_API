// src/pages/ViewerExtra/ViewerExtra.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import pageService from '../../services/pageService';
import chapterService from '../../services/chapterService';
import './ViewerExtra.css';

const ViewerExtra = () => {
    const { t } = useTranslation();
    const { id } = useParams(); // chapterId
    const navigate = useNavigate();
    const { user } = useAuth();

    // State management
    const [pages, setPages] = useState([]);
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageStates, setImageStates] = useState({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [fullscreen, setFullscreen] = useState(false);

    // Refs
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const imageRefs = useRef({});
    const toolbarTimeoutRef = useRef(null);
    const lastScrollTimeRef = useRef(0);

    // Load chapter and pages data
    useEffect(() => {
        const loadChapterData = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // Load chapter details
                const chapterData = await chapterService.getById(id);
                setChapter(chapterData.data);

                // Load pages
                const pagesData = await pageService.getByChapterId(id);
                if (pagesData.data && pagesData.data.length > 0) {
                    const sortedPages = pagesData.data.sort((a, b) => a.order - b.order);
                    setPages(sortedPages);

                    // Initialize image states
                    const initialStates = {};
                    sortedPages.forEach((_, index) => {
                        initialStates[index] = index < 3 ? 'loading' : 'pending';
                    });
                    setImageStates(initialStates);
                } else {
                    setPages([]);
                }
            } catch (error) {
                console.error('Error loading chapter:', error);
                setPages([]);
            } finally {
                setLoading(false);
            }
        };

        loadChapterData();
    }, [id]);

    // Setup intersection observer for page visibility and lazy loading
    useEffect(() => {
        if (!containerRef.current || pages.length === 0) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = parseInt(entry.target.dataset.index);

                    if (entry.isIntersecting) {
                        // Update current page if more than 60% visible
                        if (entry.intersectionRatio > 0.6) {
                            setCurrentPageIndex(index);
                        }

                        // Load images progressively
                        loadNearbyImages(index);
                    }
                });
            },
            {
                root: containerRef.current,
                rootMargin: '100px 0px',
                threshold: [0, 0.3, 0.6, 1]
            }
        );

        // Observe all page elements
        const pageElements = containerRef.current.querySelectorAll('.page-container');
        pageElements.forEach(el => observerRef.current.observe(el));

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [pages.length]);

    // Progressive image loading
    const loadNearbyImages = useCallback((centerIndex) => {
        const loadRange = 2; // Load 2 images before and after current
        const startIndex = Math.max(0, centerIndex - loadRange);
        const endIndex = Math.min(pages.length - 1, centerIndex + loadRange);

        setImageStates(prev => {
            const newStates = { ...prev };
            for (let i = startIndex; i <= endIndex; i++) {
                if (newStates[i] === 'pending') {
                    newStates[i] = 'loading';
                }
            }
            return newStates;
        });
    }, [pages.length]);

    // Handle image load success
    const handleImageLoad = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'loaded'
        }));
    }, []);

    // Handle image load error
    const handleImageError = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'error'
        }));
    }, []);

    // Retry loading failed image
    const retryImageLoad = useCallback((index) => {
        setImageStates(prev => ({
            ...prev,
            [index]: 'loading'
        }));
    }, []);

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 25));
    const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 25));
    const handleZoomReset = () => setZoom(100);

    // Fullscreen toggle
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setFullscreen(true);
            } else {
                await document.exitFullscreen();
                setFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    // Toolbar auto-hide functionality
    const handleUserActivity = useCallback(() => {
        setIsToolbarVisible(true);

        if (toolbarTimeoutRef.current) {
            clearTimeout(toolbarTimeoutRef.current);
        }

        toolbarTimeoutRef.current = setTimeout(() => {
            setIsToolbarVisible(false);
        }, 3000);
    }, []);

    // Handle scroll for toolbar auto-hide
    const handleScroll = useCallback(() => {
        const now = Date.now();
        if (now - lastScrollTimeRef.current > 100) {
            handleUserActivity();
            lastScrollTimeRef.current = now;
        }
    }, [handleUserActivity]);

    // Setup scroll and activity listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        container.addEventListener('touchstart', handleUserActivity, { passive: true });
        container.addEventListener('click', handleUserActivity);

        // Initial activity
        handleUserActivity();

        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('touchstart', handleUserActivity);
            container.removeEventListener('click', handleUserActivity);

            if (toolbarTimeoutRef.current) {
                clearTimeout(toolbarTimeoutRef.current);
            }
        };
    }, [handleScroll, handleUserActivity]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove('viewer-extra-active');
        };
    }, []);

    // Apply fullscreen body class
    useEffect(() => {
        if (fullscreen) {
            document.body.classList.add('viewer-extra-fullscreen');
        } else {
            document.body.classList.remove('viewer-extra-fullscreen');
        }
    }, [fullscreen]);

    // Render image based on loading state
    const renderPageImage = (page, index) => {
        const state = imageStates[index];
        const baseUrl = import.meta.env.VITE_API_URL;

        switch (state) {
            case 'loaded':
                return (
                    <img
                        ref={el => imageRefs.current[index] = el}
                        src={`${baseUrl}${page.imageUrl}`}
                        alt={t('viewer.pageAlt', { page: index + 1 })}
                        className="page-image page-image--loaded"
                        style={{ transform: `scale(${zoom / 100})` }}
                        loading="lazy"
                        decoding="async"
                    />
                );

            case 'loading':
                return (
                    <div className="page-loading">
                        <img
                            ref={el => imageRefs.current[index] = el}
                            src={`${baseUrl}${page.imageUrl}`}
                            alt={t('viewer.pageAlt', { page: index + 1 })}
                            className="page-image page-image--loading"
                            style={{ transform: `scale(${zoom / 100})` }}
                            onLoad={() => handleImageLoad(index)}
                            onError={() => handleImageError(index)}
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <span>{t('viewer.loading')}</span>
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className="page-error">
                        <div className="error-icon">⚠️</div>
                        <p>{t('viewer.loadError')}</p>
                        <button
                            className="retry-btn"
                            onClick={() => retryImageLoad(index)}
                        >
                            {t('viewer.retry')}
                        </button>
                    </div>
                );

            default:
                return (
                    <div className="page-placeholder">
                        <div className="placeholder-icon">📄</div>
                        <span>{t('viewer.pageNum', { page: index + 1 })}</span>
                    </div>
                );
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="viewer-extra viewer-extra--loading">
                <div className="loading-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                    <p>{t('viewer.loadingChapter')}</p>
                </div>
            </div>
        );
    }

    // No pages state
    if (!pages.length) {
        return (
            <div className="viewer-extra viewer-extra--empty">
                <div className="empty-container">
                    <div className="empty-icon">📖</div>
                    <h2>{t('viewer.noPages')}</h2>
                    <p>{t('viewer.noPagesDesc')}</p>
                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        {t('viewer.goBack')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="viewer-extra">
            {/* Enhanced Toolbar */}
            <div className={`viewer-toolbar ${isToolbarVisible ? 'viewer-toolbar--visible' : ''}`}>
                <div className="toolbar-left">
                    <button
                        className="toolbar-btn toolbar-btn--back"
                        onClick={() => navigate(-1)}
                        title={t('viewer.back')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5m7-7l-7 7 7 7" />
                        </svg>
                        <span className="btn-text">{t('viewer.back')}</span>
                    </button>

                    <div className="chapter-info">
                        <h1 className="chapter-title">
                            {chapter ? `${t('viewer.chapter')} ${chapter.number}` : t('viewer.chapter')}
                        </h1>
                        {chapter?.serie && (
                            <p className="series-title">{chapter.serie.title}</p>
                        )}
                    </div>
                </div>

                <div className="toolbar-center">
                    <div className="page-indicator">
                        <span className="current-page">{currentPageIndex + 1}</span>
                        <span className="page-separator">/</span>
                        <span className="total-pages">{pages.length}</span>
                    </div>
                </div>

                <div className="toolbar-right">
                    <div className="zoom-controls">
                        <button
                            className="toolbar-btn"
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            title={t('viewer.zoomOut')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 11h6" />
                            </svg>
                        </button>

                        <span className="zoom-level">{zoom}%</span>

                        <button
                            className="toolbar-btn"
                            onClick={handleZoomIn}
                            disabled={zoom >= 200}
                            title={t('viewer.zoomIn')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M11 8v6m-3-3h6" />
                            </svg>
                        </button>

                        <button
                            className="toolbar-btn"
                            onClick={handleZoomReset}
                            title={t('viewer.zoomReset')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                    </div>

                    <button
                        className="toolbar-btn"
                        onClick={toggleFullscreen}
                        title={fullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {fullscreen ? (
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                            ) : (
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div
                ref={containerRef}
                className="viewer-content"
            >
                <div className="pages-container">
                    {pages.map((page, index) => (
                        <div
                            key={page.id}
                            className={`page-container ${currentPageIndex === index ? 'page-container--current' : ''}`}
                            data-index={index}
                        >
                            <div className="page-wrapper">
                                {renderPageImage(page, index)}

                                <div className="page-number">
                                    {index + 1}
                                </div>

                                {currentPageIndex === index && (
                                    <div className="current-indicator">
                                        <div className="indicator-dot"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* End of chapter */}
                    <div className="chapter-end">
                        <div className="end-content">
                            <div className="end-icon">🎯</div>
                            <h3>{t('viewer.endOfChapter')}</h3>
                            <p>{t('viewer.endOfChapterDesc')}</p>
                            <button
                                className="next-chapter-btn"
                                onClick={() => navigate(-1)}
                            >
                                {t('viewer.backToSeries')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Touch Indicators */}
            <div className="touch-hints">
                <div className="touch-hint touch-hint--swipe">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14m-7-7l7-7 7 7" />
                    </svg>
                    <span>{t('viewer.swipeToScroll')}</span>
                </div>
            </div>
        </div>
    );
};

export default ViewerExtra;