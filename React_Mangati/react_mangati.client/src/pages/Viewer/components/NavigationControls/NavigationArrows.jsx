// src/pages/Viewer/components/NavigationControls/NavigationArrows.jsx
import React from 'react';
import './NavigationControls.css';

const NavigationArrows = ({
    direction = 'horizontal',
    onNext,
    onPrev,
    disableNext = false,
    disablePrev = false
}) => {
    if (direction === 'horizontal') {
        return (
            <>
                <button
                    className="nav-arrow nav-arrow--left"
                    onClick={onPrev}
                    disabled={disablePrev}
                    aria-label="Previous page"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    className="nav-arrow nav-arrow--right"
                    onClick={onNext}
                    disabled={disableNext}
                    aria-label="Next page"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </>
        );
    }

    return (
        <>
            <button
                className="nav-arrow nav-arrow--top"
                onClick={onPrev}
                disabled={disablePrev}
                aria-label="Previous page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
            <button
                className="nav-arrow nav-arrow--bottom"
                onClick={onNext}
                disabled={disableNext}
                aria-label="Next page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </>
    );
};

export default NavigationArrows;