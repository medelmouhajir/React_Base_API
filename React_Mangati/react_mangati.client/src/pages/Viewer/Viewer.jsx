// src/pages/Viewer/Viewer.jsx - Enhanced InfiniteScroll Only Implementation
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import chapterService from '../../services/chapterService';
import { useAuth } from '../../contexts/AuthContext';
import useUserData from '../../hooks/useUserData';

// Import components
import {
    ViewerToolbar,
    InfiniteScrollViewer,
    LoadingState,
    NoPages,
    ZoomIndicator
} from './components';

// Import hooks
import { useViewerZoom } from './hooks';

import './Viewer.css';

const Viewer = () => {
    const { id } = useParams(); // chapterId
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [chapter, setChapter] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const contentRef = useRef(null);

    const { user } = useAuth();
    const { saveReadingProgress, getReadingProgress } = useUserData();
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Use custom hooks
    const { zoom, zoomIn, zoomOut, resetZoom, zoomIndicatorVisible } = useViewerZoom();

    // Add body class for full page mode when component mounts
    useEffect(() => {
        document.body.classList.add('viewer-active');

        return () => {
            document.body.classList.remove('viewer-active');
        };
    }, []);

    // Load chapter data
    useEffect(() => {
        const loadChapter = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // Load chapter details
                const chapterData = await chapterService.getById(id);
                setChapter(chapterData.data);

                // Load pages
                const pagesData = await pageService.getByChapterId(id);
                setPages(pagesData.data || []);

                // Load reading progress if user is authenticated
                if (user) {
                    try {
                        const progress = await getReadingProgress(id);
                        if (progress && progress.currentPage) {
                            setCurrentIndex(progress.currentPage);
                            setCurrentPageIndex(progress.currentPage);
                        }
                    } catch (progressError) {
                        console.warn('Could not load reading progress:', progressError);
                    }
                }
            } catch (err) {
                console.error('Error loading chapter:', err);
                setError(err.message || 'Failed to load chapter');
            } finally {
                setLoading(false);
            }
        };

        loadChapter();
    }, [id, user, getReadingProgress]);

    // Save reading progress when current page changes
    useEffect(() => {
        if (user && chapter && currentPageIndex >= 0) {
            const timeoutId = setTimeout(() => {
                saveReadingProgress(chapter.id, currentPageIndex)
                    .catch(err => console.warn('Could not save reading progress:', err));
            }, 1000); // Debounce saves

            return () => clearTimeout(timeoutId);
        }
    }, [user, chapter, currentPageIndex, saveReadingProgress]);

    // Keyboard navigation for zoom controls only (page navigation handled by InfiniteScrollViewer)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Zoom controls
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                zoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                resetZoom();
            }
            // ESC to go back
            else if (e.key === 'Escape') {
                e.preventDefault();
                handleBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomIn, zoomOut, resetZoom]);

    // Navigation handlers
    const handleBack = () => {
        if (chapter?.serie?.id) {
            navigate(`/series/${chapter.serie.id}`);
        } else {
            navigate('/');
        }
    };

    // Error handling
    if (error) {
        return (
            <div className="manga-viewer">
                <ViewerToolbar
                    chapter={chapter}
                    onBack={handleBack}
                    zoom={zoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onResetZoom={resetZoom}
                    currentPage={currentPageIndex + 1}
                    totalPages={pages.length}
                    showNavigation={false}
                />
                <div className="viewer-content">
                    <div className="error-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h3>Error Loading Chapter</h3>
                        <p>{error}</p>
                        <button className="toolbar-btn" onClick={handleBack}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="manga-viewer">
                <ViewerToolbar
                    chapter={chapter}
                    onBack={handleBack}
                    zoom={zoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onResetZoom={resetZoom}
                    currentPage={1}
                    totalPages={0}
                    showNavigation={false}
                />
                <div className="viewer-content">
                    <LoadingState message="Loading chapter..." />
                </div>
            </div>
        );
    }

    // No pages state
    if (!pages || pages.length === 0) {
        return (
            <div className="manga-viewer">
                <ViewerToolbar
                    chapter={chapter}
                    onBack={handleBack}
                    zoom={zoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onResetZoom={resetZoom}
                    currentPage={0}
                    totalPages={0}
                    showNavigation={false}
                />
                <div className="viewer-content">
                    <NoPages onBack={handleBack} />
                </div>
            </div>
        );
    }

    // Base URL for images
    const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:7081';

    return (
        <div className="manga-viewer">
            <ViewerToolbar
                chapter={chapter}
                onBack={handleBack}
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                currentPage={currentPageIndex + 1}
                totalPages={pages.length}
                showNavigation={false}
            />

            <div className="viewer-content" ref={contentRef}>
                <InfiniteScrollViewer
                    pages={pages}
                    zoom={zoom}
                    baseUrl={baseUrl}
                    chapter={chapter}
                    currentIndex={currentIndex}
                    onPageChange={setCurrentPageIndex}
                />
            </div>

            {/* Zoom Indicator */}
            <ZoomIndicator zoom={zoom} visible={zoomIndicatorVisible} />
        </div>
    );
};

export default Viewer;