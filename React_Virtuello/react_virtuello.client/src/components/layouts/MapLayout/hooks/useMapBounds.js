import { useState, useCallback, useRef } from 'react';

export const useMapBounds = (initialBounds = null) => {
    const [bounds, setBounds] = useState(initialBounds);
    const boundsRef = useRef(initialBounds);

    const updateBounds = useCallback((newBounds) => {
        if (!newBounds) return;

        const boundsData = {
            north: newBounds.getNorth(),
            south: newBounds.getSouth(),
            east: newBounds.getEast(),
            west: newBounds.getWest()
        };

        setBounds(boundsData);
        boundsRef.current = boundsData;
    }, []);

    const getBounds = useCallback(() => {
        return boundsRef.current;
    }, []);

    const isPointInBounds = useCallback((lat, lng) => {
        const currentBounds = boundsRef.current;
        if (!currentBounds) return false;

        return lat >= currentBounds.south &&
            lat <= currentBounds.north &&
            lng >= currentBounds.west &&
            lng <= currentBounds.east;
    }, []);

    return {
        bounds,
        updateBounds,
        getBounds,
        isPointInBounds
    };
};