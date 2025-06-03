// src/pages/Viewer/Viewer.jsx - Main container component
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import chapterService from '../../services/chapterService';
import { useAuth } from '../../contexts/AuthContext';
import useUserData from '../../hooks/useUserData';

// Import components
import {
    ViewerToolbar,
    HorizontalViewer,
    VerticalViewer,
    InfiniteScrollViewer,
    LoadingState,
    NoPages,
    ZoomIndicator
} from './components';

// Import hooks
import { useViewerKeyboard, useViewerZoom } from './hooks';

import './Viewer.css';

const Viewer = () => {
    const { id } = useParams(); // chapterId
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [chapter, setChapter] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState('infinite'); // Default viewing mode
    const [loading, setLoading] = useState(true);
    const contentRef = useRef(null);
    const observerRef = useRef(null);

    const { user } = useAuth();
    const { saveReadingProgress, getReadingProgress } = useUserData();
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Use custom hooks
    const { zoom, zoomIn, zoomOut, resetZoom, zoomIndicatorVisible } = useViewerZoom();

    // Register keyboard navigation
    useViewerKeyboard({
        mode,
        currentIndex,
        totalPages: pages.length,
        setCurrentIndex,
        zoomIn,
        zoomOut,
        resetZoom
    });

    // Load initial reading progress
    useEffect(() => {
        const loadInitialProgress = async () => {
            if (!user || !id) return;

            try {
                const progress = await getReadingProgress(parseInt(id));
                if (progress && progress.lastReadPage >= 0) {
                    setCurrentPageIndex(progress.lastReadPage);
                    setCurrentIndex(progress.lastReadPage);
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

    // Set up initial scroll position
    useEffect(() => {
        if (mode === 'infinite' && pages.length > 0 && !loading && currentPageIndex > 0) {
            const timer = setTimeout(() => {
                const pageElements = document.querySelectorAll('.page-wrapper');
                if (pageElements.length > currentPageIndex) {
                    pageElements[currentPageIndex].scrollIntoView({ behavior: 'auto' });
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [mode, pages.length, loading, currentPageIndex]);

    // Set up intersection observer for infinite scroll mode
    useEffect(() => {
        if (mode !== 'infinite' || pages.length === 0) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pageIndex = parseInt(entry.target.dataset.index);
                        setCurrentPageIndex(pageIndex);
                    }
                });
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            }
        );

        const pageElements = document.querySelectorAll('.page-wrapper');
        pageElements.forEach(el => {
            observerRef.current.observe(el);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [mode, pages]);

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

    // Handle mode change
    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === 'infinite') {
            // Reset to first page when switching to infinite
            setCurrentIndex(0);
        }
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
        setCurrentPageIndex(0);
    };

    const goToLastPage = () => {
        const lastIndex = pages.length - 1;
        setCurrentIndex(lastIndex);
        setCurrentPageIndex(lastIndex);
    };

    if (loading) {
        return (
            <div className="manga-viewer">
                <ViewerToolbar
                    title="Loading..."
                    onBack={() => navigate(-1)}
                />
                <LoadingState message="Loading chapter..." />
            </div>
        );
    }

    return (
        <div className="manga-viewer">
            {/* Toolbar */}
            <ViewerToolbar
                chapter={chapter}
                mode={mode}
                onModeChange={handleModeChange}
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                currentPage={currentIndex + 1}
                totalPages={pages.length}
                onBack={() => navigate(-1)}
                onNextPage={goToNextPage}
                onPrevPage={goToPrevPage}
                onFirstPage={goToFirstPage}
                onLastPage={goToLastPage}
                showNavigation={mode !== 'infinite'}
            />

            {/* Content Area */}
            <div className="viewer-content" ref={contentRef}>
                {pages.length === 0 ? (
                    <NoPages onBack={() => navigate(-1)} />
                ) : (
                    <>
                        {mode === 'horizontal' && (
                            <HorizontalViewer
                                pages={pages}
                                currentIndex={currentIndex}
                                zoom={zoom}
                                baseUrl={import.meta.env.VITE_API_URL}
                                onNextPage={goToNextPage}
                                onPrevPage={goToPrevPage}
                            />
                        )}
                        {mode === 'vertical' && (
                            <VerticalViewer
                                pages={pages}
                                currentIndex={currentIndex}
                                zoom={zoom}
                                baseUrl={import.meta.env.VITE_API_URL}
                                onNextPage={goToNextPage}
                                onPrevPage={goToPrevPage}
                            />
                        )}
                        {mode === 'infinite' && (
                            <InfiniteScrollViewer
                                pages={pages}
                                zoom={zoom}
                                baseUrl={import.meta.env.VITE_API_URL}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Zoom Indicator */}
            <ZoomIndicator zoom={zoom} visible={zoomIndicatorVisible} />
        </div>
    );
};

export default Viewer;