// src/pages/Viewer/Viewer.jsx - Full Page Implementation
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

    // Full-page viewer effect - Add/remove body class
    useEffect(() => {
        // Add class to body to hide scroll and reset margins
        document.body.classList.add('viewer-active');

        // Cleanup function to restore normal body behavior
        return () => {
            document.body.classList.remove('viewer-active');
        };
    }, []);

    // Load initial reading progress
    useEffect(() => {
        const loadInitialProgress = async () => {
            if (!user || !id) return;

            try {
                const progress = await getReadingProgress(parseInt(id));
                if (progress && progress.lastReadPage !== undefined) {
                    setCurrentIndex(progress.lastReadPage);
                    setCurrentPageIndex(progress.lastReadPage);
                }
            } catch (error) {
                console.error('Error loading initial progress:', error);
            }
        };

        loadInitialProgress();
    }, [user, id, getReadingProgress]);

    // Load chapter and pages
    useEffect(() => {
        const loadChapter = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // Load chapter details
                const chapterData = await chapterService.getById(id);
                setChapter(chapterData.data);

                // Load pages
                const pagesData = await pageService.getByChapterId(id);
                if (pagesData.data && pagesData.data.length > 0) {
                    setPages(pagesData.data);
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

        loadChapter();
    }, [id]);

    // Save reading progress
    useEffect(() => {
        const saveProgress = async () => {
            if (!user || !id || !pages.length) return;

            try {
                await saveReadingProgress(parseInt(id), currentPageIndex);
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        };

        const debounceTimer = setTimeout(saveProgress, 1000);
        return () => clearTimeout(debounceTimer);
    }, [user, id, currentPageIndex, pages.length, saveReadingProgress]);

    // Handle mode change
    const handleModeChange = (newMode) => {
        setMode(newMode);
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

    // Handle back navigation
    const handleBack = () => {
        // Clean up body class before navigating
        document.body.classList.remove('viewer-active');
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="manga-viewer">
                <ViewerToolbar
                    title="Loading..."
                    onBack={handleBack}
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
                onBack={handleBack}
                onNextPage={goToNextPage}
                onPrevPage={goToPrevPage}
                onFirstPage={goToFirstPage}
                onLastPage={goToLastPage}
                showNavigation={mode !== 'infinite'}
            />

            {/* Content Area */}
            <div className="viewer-content" ref={contentRef}>
                {pages.length === 0 ? (
                    <NoPages onBack={handleBack} />
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