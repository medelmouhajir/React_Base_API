import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import VehicleCard from '../../Home/components/VehiclePanel/VehicleCard';

const VehicleCarousel = ({ vehicles = [], selectedVehicle, onVehicleSelect, onRefresh }) => {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const startXRef = useRef(null);

    const orderedVehicles = useMemo(() => {
        if (!vehicles.length) return [];
        return vehicles.slice().sort((a, b) => {
            if (a.isOnline === b.isOnline) {
                return a.model.localeCompare(b.model);
            }
            return a.isOnline ? -1 : 1;
        });
    }, [vehicles]);

    useEffect(() => {
        if (!selectedVehicle) return;
        const index = orderedVehicles.findIndex(vehicle => vehicle.id === selectedVehicle.id);
        if (index >= 0) {
            setActiveIndex(index);
        }
    }, [selectedVehicle, orderedVehicles]);

    const clampIndex = (nextIndex) => {
        if (!orderedVehicles.length) return 0;
        return Math.max(0, Math.min(nextIndex, orderedVehicles.length - 1));
    };

    const handlePrev = () => {
        setActiveIndex(prev => clampIndex(prev - 1));
    };

    const handleNext = () => {
        setActiveIndex(prev => clampIndex(prev + 1));
    };

    const handleTouchStart = (event) => {
        startXRef.current = event.touches[0].clientX;
    };

    const handleTouchMove = (event) => {
        if (startXRef.current === null) return;
        const currentX = event.touches[0].clientX;
        const delta = startXRef.current - currentX;

        if (Math.abs(delta) > 50) {
            if (delta > 0) {
                handleNext();
            } else {
                handlePrev();
            }
            startXRef.current = null;
        }
    };

    const handleTouchEnd = () => {
        startXRef.current = null;
    };

    return (
        <div className="vehicle-carousel glass">
            <div className="carousel-header">
                <div>
                    <h2>{t('gps.modern.mobileFleet', 'Fleet overview')}</h2>
                    <p>{t('gps.modern.mobileFleetHint', 'Swipe to cycle through vehicles')}</p>
                </div>
                <button type="button" className="ghost-btn" onClick={onRefresh}>
                    {t('common.refresh', 'Refresh')}
                </button>
            </div>

            {orderedVehicles.length === 0 ? (
                <div className="carousel-empty">
                    <p>{t('gps.noVehicles', 'No vehicles found')}</p>
                </div>
            ) : (
                <div
                    className="carousel-body"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        type="button"
                        className="carousel-nav prev"
                        onClick={handlePrev}
                        disabled={activeIndex === 0}
                        aria-label={t('common.previous', 'Previous')}
                    >
                        ‹
                    </button>
                    <div className="carousel-track">
                        {orderedVehicles.map((vehicle, index) => (
                            <div
                                key={vehicle.id}
                                className={`carousel-slide ${index === activeIndex ? 'active' : ''}`}
                                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                            >
                                <VehicleCard
                                    vehicle={vehicle}
                                    isSelected={selectedVehicle?.id === vehicle.id}
                                    onSelect={() => onVehicleSelect(vehicle)}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="carousel-nav next"
                        onClick={handleNext}
                        disabled={activeIndex === orderedVehicles.length - 1}
                        aria-label={t('common.next', 'Next')}
                    >
                        ›
                    </button>
                </div>
            )}

            <div className="carousel-indicators">
                {orderedVehicles.map((vehicle, index) => (
                    <button
                        key={vehicle.id}
                        type="button"
                        className={`indicator-dot ${index === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={t('gps.modern.jumpToVehicle', 'View vehicle {{plate}}', { plate: vehicle.licensePlate })}
                    />
                ))}
            </div>
        </div>
    );
};

export default VehicleCarousel;