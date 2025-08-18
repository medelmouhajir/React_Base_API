import React from 'react';
import {
    ZoomIn,
    ZoomOut,
    Navigation,
    Maximize2,
    Minimize2,
    Loader2
} from 'lucide-react';
import './MapControls.css';

const MapControls = ({
    onZoomIn,
    onZoomOut,
    onGoToLocation,
    onToggleFullscreen,
    isFullscreen = false,
    isLocating = false,
    hasLocation = false
}) => {
    return (
        <div className="map-controls">
            {/* Zoom Controls */}
            <div className="control-group">
                <button
                    className="control-button"
                    onClick={onZoomIn}
                    title="Zoom In"
                    aria-label="Zoom in"
                >
                    <ZoomIn size={18} />
                </button>

                <button
                    className="control-button"
                    onClick={onZoomOut}
                    title="Zoom Out"
                    aria-label="Zoom out"
                >
                    <ZoomOut size={18} />
                </button>
            </div>

            {/* Location Control */}
            <div className="control-group">
                <button
                    className={`control-button ${hasLocation ? 'active' : ''}`}
                    onClick={onGoToLocation}
                    disabled={isLocating}
                    title="Go to Current Location"
                    aria-label="Go to current location"
                >
                    {isLocating ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Navigation size={18} />
                    )}
                </button>
            </div>

            {/* Fullscreen Control */}
            <div className="control-group">
                <button
                    className="control-button"
                    onClick={onToggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 size={18} />
                    ) : (
                        <Maximize2 size={18} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default MapControls;