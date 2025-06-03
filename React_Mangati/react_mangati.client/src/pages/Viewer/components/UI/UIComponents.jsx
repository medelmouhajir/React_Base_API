// src/pages/Viewer/components/UI/UIComponents.jsx
import React from 'react';
import './UI.css';

export const ZoomIndicator = ({ zoom, visible }) => {
    return (
        <div className={`zoom-indicator ${visible ? 'zoom-indicator--visible' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <span>{zoom}%</span>
        </div>
    );
};

// src/pages/Viewer/components/UI/LoadingState.jsx
export const LoadingState = ({ message = 'Loading...' }) => {
    return (
        <div className="viewer-content--loading">
            <div className="loader">
                <div className="loader-spinner"></div>
                <p>{message}</p>
            </div>
        </div>
    );
};

// src/pages/Viewer/components/UI/NoPages.jsx
export const NoPages = ({ onBack }) => {
    return (
        <div className="no-pages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p>No pages found for this chapter.</p>
            <button className="toolbar-btn" onClick={onBack}>
                Go Back
            </button>
        </div>
    );
};

export default {
    ZoomIndicator,
    LoadingState,
    NoPages
};