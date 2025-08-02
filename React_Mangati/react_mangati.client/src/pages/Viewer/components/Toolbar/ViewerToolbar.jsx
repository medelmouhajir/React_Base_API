// src/pages/Viewer/components/Toolbar/ViewerToolbar.jsx - InfiniteScroll Only
import React from 'react';
import './ViewerToolbar.css';

const ViewerToolbar = ({
    chapter,
    zoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    currentPage,
    totalPages,
    onBack,
    showNavigation = false // Not used for infinite scroll but kept for consistency
}) => {
    return (
        <div className="viewer-toolbar">
            {/* Left Section - Back button and title */}
            <div className="toolbar-section toolbar-section--left">
                <button
                    className="toolbar-btn toolbar-btn--icon"
                    onClick={onBack}
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

            {/* Center Section - Reading mode indicator (InfiniteScroll only) */}
            <div className="toolbar-section toolbar-section--center">
                <div className="reading-mode-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                    </svg>
                    <span>Infinite Scroll</span>
                </div>
            </div>

            {/* Right Section - Controls */}
            <div className="toolbar-section toolbar-section--right">
                {/* Page Progress Indicator */}
                <div className="page-progress">
                    <span className="page-indicator">
                        {currentPage} / {totalPages}
                    </span>
                </div>

                <div className="toolbar-divider"></div>

                {/* Zoom Controls */}
                <div className="zoom-controls">
                    <button
                        className="toolbar-btn toolbar-btn--icon toolbar-btn--small"
                        onClick={onZoomOut}
                        disabled={zoom <= 50}
                        title="Zoom out"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>

                    <button
                        className="toolbar-btn toolbar-btn--text toolbar-btn--small"
                        onClick={onResetZoom}
                        title="Reset zoom"
                    >
                        {zoom}%
                    </button>

                    <button
                        className="toolbar-btn toolbar-btn--icon toolbar-btn--small"
                        onClick={onZoomIn}
                        disabled={zoom >= 200}
                        title="Zoom in"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Settings Button */}
                <button
                    className="toolbar-btn toolbar-btn--icon"
                    onClick={() => {
                        // Future: Open settings modal
                        console.log('Settings clicked');
                    }}
                    title="Reading settings"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="m12 1v6m0 6v6" />
                        <path d="m12 1l4 4m-8 0l4-4" />
                        <path d="m12 23l4-4m-8 0l4 4" />
                        <path d="m1 12h6m6 0h6" />
                        <path d="m1 12l4-4m0 8l-4-4" />
                        <path d="m23 12l-4-4m0 8l4-4" />
                    </svg>
                </button>

                {/* Full Screen Button */}
                <button
                    className="toolbar-btn toolbar-btn--icon"
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen().catch(err => {
                                console.warn('Could not enter fullscreen:', err);
                            });
                        } else {
                            document.exitFullscreen().catch(err => {
                                console.warn('Could not exit fullscreen:', err);
                            });
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
    );
};

export default ViewerToolbar;