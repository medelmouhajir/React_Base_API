/**
 * ZoomControls Component - Map Zoom Control Interface
 * Provides zoom in/out, reset, and fit bounds controls for the map
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './zoomcontrols.css';

const ZoomControls = ({
    onZoomIn,
    onZoomOut,
    onZoomToFit,
    onResetView,
    onZoomToLocation,
    currentZoom = 13,
    minZoom = 1,
    maxZoom = 18,
    zoomStep = 1,
    showZoomLevel = true,
    showResetButton = true,
    showFitButton = true,
    showLocationButton = true,
    orientation = 'vertical', // 'vertical' | 'horizontal'
    position = 'topright',
    className = '',
    theme = 'light',
    disabled = false,
    userLocation = null,
    bounds = null
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [isZooming, setIsZooming] = useState(false);
    const [zoomDirection, setZoomDirection] = useState(null); // 'in' | 'out'
    const [lastZoomTime, setLastZoomTime] = useState(0);

    // Refs for continuous zoom
    const zoomTimeoutRef = useRef(null);
    const zoomIntervalRef = useRef(null);

    // =============================================================================
    // ZOOM CALCULATIONS
    // =============================================================================

    /**
     * Check if zoom in is possible
     */
    const canZoomIn = useCallback(() => {
        return currentZoom < maxZoom && !disabled;
    }, [currentZoom, maxZoom, disabled]);

    /**
     * Check if zoom out is possible
     */
    const canZoomOut = useCallback(() => {
        return currentZoom > minZoom && !disabled;
    }, [currentZoom, minZoom, disabled]);

    /**
     * Format zoom level for display
     */
    const formatZoomLevel = useCallback((zoom) => {
        return `${Math.round(zoom * 10) / 10}x`;
    }, []);

    /**
     * Get zoom percentage (relative to min/max range)
     */
    const getZoomPercentage = useCallback(() => {
        const range = maxZoom - minZoom;
        const current = currentZoom - minZoom;
        return Math.round((current / range) * 100);
    }, [currentZoom, minZoom, maxZoom]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle zoom in
     */
    const handleZoomIn = useCallback(() => {
        if (!canZoomIn()) return;

        setIsZooming(true);
        setZoomDirection('in');
        setLastZoomTime(Date.now());

        if (onZoomIn) {
            onZoomIn(zoomStep);
        }

        // Reset zoom state after animation
        setTimeout(() => {
            setIsZooming(false);
            setZoomDirection(null);
        }, 150);
    }, [canZoomIn, onZoomIn, zoomStep]);

    /**
     * Handle zoom out
     */
    const handleZoomOut = useCallback(() => {
        if (!canZoomOut()) return;

        setIsZooming(true);
        setZoomDirection('out');
        setLastZoomTime(Date.now());

        if (onZoomOut) {
            onZoomOut(zoomStep);
        }

        // Reset zoom state after animation
        setTimeout(() => {
            setIsZooming(false);
            setZoomDirection(null);
        }, 150);
    }, [canZoomOut, onZoomOut, zoomStep]);

    /**
     * Handle continuous zoom (mouse hold)
     */
    const handleContinuousZoom = useCallback((direction) => {
        const zoomFunction = direction === 'in' ? handleZoomIn : handleZoomOut;
        const canZoom = direction === 'in' ? canZoomIn() : canZoomOut();

        if (!canZoom) return;

        // Initial zoom
        zoomFunction();

        // Set up continuous zoom after delay
        zoomTimeoutRef.current = setTimeout(() => {
            zoomIntervalRef.current = setInterval(() => {
                const stillCanZoom = direction === 'in' ? canZoomIn() : canZoomOut();
                if (stillCanZoom) {
                    zoomFunction();
                } else {
                    clearInterval(zoomIntervalRef.current);
                }
            }, 100); // Continuous zoom every 100ms
        }, 500); // Start continuous zoom after 500ms hold
    }, [handleZoomIn, handleZoomOut, canZoomIn, canZoomOut]);

    /**
     * Stop continuous zoom
     */
    const stopContinuousZoom = useCallback(() => {
        if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
            zoomTimeoutRef.current = null;
        }
        if (zoomIntervalRef.current) {
            clearInterval(zoomIntervalRef.current);
            zoomIntervalRef.current = null;
        }
    }, []);

    /**
     * Handle reset view
     */
    const handleResetView = useCallback(() => {
        if (disabled || !onResetView) return;

        setIsZooming(true);
        onResetView();

        setTimeout(() => {
            setIsZooming(false);
        }, 300);
    }, [disabled, onResetView]);

    /**
     * Handle zoom to fit
     */
    const handleZoomToFit = useCallback(() => {
        if (disabled || !onZoomToFit || !bounds) return;

        setIsZooming(true);
        onZoomToFit(bounds);

        setTimeout(() => {
            setIsZooming(false);
        }, 300);
    }, [disabled, onZoomToFit, bounds]);

    /**
     * Handle zoom to user location
     */
    const handleZoomToLocation = useCallback(() => {
        if (disabled || !onZoomToLocation || !userLocation) return;

        setIsZooming(true);
        onZoomToLocation(userLocation);

        setTimeout(() => {
            setIsZooming(false);
        }, 300);
    }, [disabled, onZoomToLocation, userLocation]);

    // =============================================================================
    // KEYBOARD SUPPORT
    // =============================================================================

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (disabled) return;

            // Only handle if no input element is focused
            if (document.activeElement?.tagName === 'INPUT') return;

            switch (event.key) {
                case '+':
                case '=':
                    event.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    event.preventDefault();
                    handleZoomOut();
                    break;
                case '0':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handleResetView();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled, handleZoomIn, handleZoomOut, handleResetView]);

    // =============================================================================
    // CLEANUP
    // =============================================================================

    useEffect(() => {
        return () => {
            stopContinuousZoom();
        };
    }, [stopContinuousZoom]);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    /**
     * Render zoom level indicator
     */
    const renderZoomLevel = useCallback(() => {
        if (!showZoomLevel) return null;

        return (
            <div className="zoom-controls__level">
                <div className="zoom-controls__level-text">
                    {formatZoomLevel(currentZoom)}
                </div>
                <div className="zoom-controls__level-bar">
                    <div
                        className="zoom-controls__level-progress"
                        style={{ width: `${getZoomPercentage()}%` }}
                    />
                </div>
            </div>
        );
    }, [showZoomLevel, formatZoomLevel, currentZoom, getZoomPercentage]);

    /**
     * Render control button
     */
    const renderControlButton = useCallback((config) => {
        const {
            onClick,
            onMouseDown,
            onMouseUp,
            onMouseLeave,
            disabled: buttonDisabled,
            icon,
            label,
            className: buttonClass,
            title
        } = config;

        return (
            <button
                className={`zoom-controls__btn ${buttonClass || ''} ${buttonDisabled ? 'disabled' : ''}`}
                onClick={onClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                disabled={buttonDisabled}
                aria-label={label}
                title={title}
            >
                <span className="zoom-controls__btn-icon">{icon}</span>
            </button>
        );
    }, []);

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <div
            className={`zoom-controls ${className} 
                       orientation-${orientation} 
                       position-${position} 
                       theme-${theme} 
                       ${isZooming ? 'zooming' : ''}
                       ${disabled ? 'disabled' : ''}`}
        >
            {/* Zoom In Button */}
            {renderControlButton({
                onClick: handleZoomIn,
                onMouseDown: () => handleContinuousZoom('in'),
                onMouseUp: stopContinuousZoom,
                onMouseLeave: stopContinuousZoom,
                disabled: !canZoomIn(),
                icon: '➕',
                label: 'Zoom in',
                className: `zoom-in ${zoomDirection === 'in' ? 'active' : ''}`,
                title: `Zoom in (Current: ${formatZoomLevel(currentZoom)})`
            })}

            {/* Zoom Level Indicator */}
            {orientation === 'vertical' && renderZoomLevel()}

            {/* Zoom Out Button */}
            {renderControlButton({
                onClick: handleZoomOut,
                onMouseDown: () => handleContinuousZoom('out'),
                onMouseUp: stopContinuousZoom,
                onMouseLeave: stopContinuousZoom,
                disabled: !canZoomOut(),
                icon: '➖',
                label: 'Zoom out',
                className: `zoom-out ${zoomDirection === 'out' ? 'active' : ''}`,
                title: `Zoom out (Current: ${formatZoomLevel(currentZoom)})`
            })}

            {/* Horizontal Zoom Level (for horizontal orientation) */}
            {orientation === 'horizontal' && renderZoomLevel()}

            {/* Separator */}
            {(showResetButton || showFitButton || showLocationButton) && (
                <div className="zoom-controls__separator" />
            )}

            {/* Reset View Button */}
            {showResetButton && renderControlButton({
                onClick: handleResetView,
                disabled: disabled,
                icon: '🎯',
                label: 'Reset view',
                className: 'reset',
                title: 'Reset to default view'
            })}

            {/* Zoom to Fit Button */}
            {showFitButton && bounds && renderControlButton({
                onClick: handleZoomToFit,
                disabled: disabled,
                icon: '📏',
                label: 'Fit all markers',
                className: 'fit',
                title: 'Zoom to fit all visible markers'
            })}

            {/* Zoom to Location Button */}
            {showLocationButton && userLocation && renderControlButton({
                onClick: handleZoomToLocation,
                disabled: disabled,
                icon: '📍',
                label: 'Zoom to my location',
                className: 'location',
                title: 'Zoom to current location'
            })}

            {/* Quick Zoom Buttons (for advanced users) */}
            <div className="zoom-controls__quick">
                {/* Double Click Indicator */}
                {Date.now() - lastZoomTime < 1000 && (
                    <div className="zoom-controls__quick-indicator">
                        {zoomDirection === 'in' ? '🔍+' : '🔍-'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZoomControls;