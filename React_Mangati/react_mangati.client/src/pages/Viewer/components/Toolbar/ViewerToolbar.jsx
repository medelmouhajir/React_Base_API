// src/pages/Viewer/components/Toolbar/ViewerToolbar.jsx
import React from 'react';
import './ViewerToolbar.css';

const ViewerToolbar = ({
    chapter,
    mode,
    onModeChange,
    zoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    currentPage,
    totalPages,
    onBack,
    onNextPage,
    onPrevPage,
    onFirstPage,
    onLastPage,
    showNavigation = true
}) => {
    return (
        <div className="viewer-toolbar">
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

            <div className="toolbar-section toolbar-section--center">
                {/* Reading Mode Selector */}
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${mode === 'infinite' ? 'mode-btn--active' : ''}`}
                        onClick={() => onModeChange('infinite')}
                        title="Infinite scroll mode"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                        </svg>
                        <span>Scroll</span>
                    </button>
                    <button
                        className={`mode-btn ${mode === 'horizontal' ? 'mode-btn--active' : ''}`}
                        onClick={() => onModeChange('horizontal')}
                        title="Horizontal page mode"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12m-12 5h12" />
                        </svg>
                        <span>Pages</span>
                    </button>
                    <button
                        className={`mode-btn ${mode === 'vertical' ? 'mode-btn--active' : ''}`}
                        onClick={() => onModeChange('vertical')}
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
                        onClick={onZoomOut}
                        disabled={zoom <= 50}
                        title="Zoom out"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                    </button>
                    <button
                        className="toolbar-btn toolbar-btn--text"
                        onClick={onResetZoom}
                        title="Reset zoom"
                    >
                        {zoom}%
                    </button>
                    <button
                        className="toolbar-btn toolbar-btn--icon"
                        onClick={onZoomIn}
                        disabled={zoom >= 200}
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
                {showNavigation && (
                    <>
                        <div className="nav-controls">
                            <button
                                className="toolbar-btn toolbar-btn--icon"
                                onClick={onFirstPage}
                                disabled={currentPage === 1}
                                title="First page"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 19.5l-7-7 7-7m-13 0v14" />
                                </svg>
                            </button>
                            <button
                                className="toolbar-btn toolbar-btn--icon"
                                onClick={onPrevPage}
                                disabled={currentPage === 1}
                                title="Previous page"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <span className="page-indicator">
                                {currentPage}/{totalPages}
                            </span>

                            <button
                                className="toolbar-btn toolbar-btn--icon"
                                onClick={onNextPage}
                                disabled={currentPage === totalPages}
                                title="Next page"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button
                                className="toolbar-btn toolbar-btn--icon"
                                onClick={onLastPage}
                                disabled={currentPage === totalPages}
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
    );
};

export default ViewerToolbar;