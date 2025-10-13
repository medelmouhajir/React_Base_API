import { useCallback, useEffect, useState } from 'react';

const DEFAULT_CENTER = [33.5731, -7.5898];

const useModernLayout = ({ isMobile }) => {
    const [isDrawerOpen, setDrawerOpen] = useState(!isMobile);
    const [mapState, setMapState] = useState({
        center: DEFAULT_CENTER,
        zoom: 7,
        followVehicle: false
    });

    useEffect(() => {
        setDrawerOpen(!isMobile);
    }, [isMobile]);

    const toggleDrawer = useCallback(() => {
        setDrawerOpen(prev => !prev);
    }, []);

    const closeDrawerForMobile = useCallback(() => {
        if (isMobile) {
            setDrawerOpen(false);
        }
    }, [isMobile]);

    const focusVehicleOnMap = useCallback((vehicle) => {
        if (!vehicle?.lastLocation) {
            return;
        }

        const { latitude, longitude } = vehicle.lastLocation;
        setMapState(prev => ({
            ...prev,
            center: [latitude, longitude],
            zoom: 16,
            followVehicle: true
        }));
    }, []);

    return {
        isDrawerOpen,
        toggleDrawer,
        closeDrawerForMobile,
        mapState,
        setMapState,
        focusVehicleOnMap
    };
};

export default useModernLayout;