// src/pages/Gadgets/CarChecks/CarCheck.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import './CarCheck.css';

const CarCheck = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();

    const agencyId = user?.agencyId;

    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch cars on component mount
    useEffect(() => {
        const fetchCars = async () => {
            try {
                if (agencyId) {
                    const data = await carService.getByAgencyId(agencyId);
                    setCars(data || []);
                }
            } catch (err) {
                console.error('Error fetching cars:', err);
                setError(t('carCheck.error.fetchCars'));
            }
        };

        fetchCars();
    }, [agencyId, t]);

    // Filter cars based on search term
    const filteredCars = cars.filter(car => {
        const searchLower = searchTerm.toLowerCase();
        return (
            car.licensePlate?.toLowerCase().includes(searchLower) ||
            car.fields?.model?.toLowerCase().includes(searchLower) ||
            car.fields?.manufacturer?.toLowerCase().includes(searchLower)
        );
    });

    // Handle car selection
    const handleCarSelect = (carId) => {
        setSelectedCar(carId);
        setReservations([]);
        setError('');
    };

    // Handle date selection and fetch reservations
    const handleDateSelect = async (date) => {
        setSelectedDate(date);
        if (!selectedCar || !date) {
            setReservations([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await carService.checkCarReservationsByDate(selectedCar, date);
            setReservations(data || []);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError(t('carCheck.error.fetchReservations'));
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    // Get selected car details
    const getSelectedCarDetails = () => {
        return cars.find(car => car.id === selectedCar);
    };

    // Format reservation status
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'reserved':
                return 'status-reserved';
            case 'ongoing':
                return 'status-ongoing';
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-default';
        }
    };

    return (
        <div className={`car-check-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="car-check-header">
                <h1 className="car-check-title">{t('carCheck.title')}</h1>
                <p className="car-check-description">{t('carCheck.description')}</p>
            </div>

            <div className="car-check-content">
                {/* Car Selection Section */}
                <section className="car-selection-section">
                    <h2 className="section-title">{t('carCheck.selectCar')}</h2>

                    {/* Search Input */}
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder={t('carCheck.searchCars')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Cars Grid */}
                    <div className="cars-grid">
                        {filteredCars.map((car) => (
                            <div
                                key={car.id}
                                className={`car-card ${selectedCar === car.id ? 'selected' : ''}`}
                                onClick={() => handleCarSelect(car.id)}
                            >
                                <div className="car-info">
                                    <div className="car-license">{car.licensePlate}</div>
                                    <div className="car-model">
                                        {car.fields?.manufacturer} {car.fields?.model}
                                    </div>
                                    <div className="car-year">{car.fields?.year}</div>
                                    <div className={`car-status ${car.isAvailable ? 'available' : 'unavailable'}`}>
                                        {car.isAvailable ? t('carCheck.available') : t('carCheck.unavailable')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCars.length === 0 && (
                        <div className="no-cars-message">
                            {t('carCheck.noCarsFound')}
                        </div>
                    )}
                </section>

                {/* Date Selection Section */}
                {selectedCar && (
                    <section className="date-selection-section">
                        <h2 className="section-title">{t('carCheck.selectDate')}</h2>
                        <div className="selected-car-info">
                            <span className="selected-car-label">{t('carCheck.selectedCar')}:</span>
                            <span className="selected-car-details">
                                {getSelectedCarDetails()?.licensePlate} -
                                {getSelectedCarDetails()?.fields?.manufacturer} {getSelectedCarDetails()?.fields?.model}
                            </span>
                        </div>

                        <input
                            type="date"
                            className="date-input"
                            value={selectedDate}
                            onChange={(e) => handleDateSelect(e.target.value)}
                        />
                    </section>
                )}

                {/* Reservations Results Section */}
                {selectedCar && selectedDate && (
                    <section className="reservations-section">
                        <h2 className="section-title">
                            {t('carCheck.reservationsForDate', { date: selectedDate })}
                        </h2>

                        {loading && (
                            <div className="loading-message">
                                {t('common.loading')}
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {!loading && !error && reservations.length === 0 && (
                            <div className="no-reservations-message">
                                {t('carCheck.noReservationsFound')}
                            </div>
                        )}

                        {!loading && !error && reservations.length > 0 && (
                            <div className="reservations-list">
                                {reservations.map((reservation) => (
                                    <div key={reservation.id} className="reservation-card">
                                        <div className="reservation-header">
                                            <div className="reservation-id">
                                                {t('carCheck.reservationId')}: {reservation.id.slice(0, 8)}...
                                            </div>
                                            <div className={`reservation-status ${getStatusColor(reservation.status)}`}>
                                                {t(`carCheck.status.${reservation.status?.toLowerCase()}`)}
                                            </div>
                                        </div>

                                        <div className="reservation-details">
                                            <div className="reservation-dates">
                                                <div className="date-info">
                                                    <span className="label">{t('carCheck.startDate')}:</span>
                                                    <span className="value">
                                                        {new Date(reservation.startDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="date-info">
                                                    <span className="label">{t('carCheck.endDate')}:</span>
                                                    <span className="value">
                                                        {new Date(reservation.endDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="reservation-price">
                                                <span className="label">{t('carCheck.agreedPrice')}:</span>
                                                <span className="value">{reservation.agreedPrice} MAD</span>
                                            </div>

                                            <div className="reservation-locations">
                                                {reservation.pickupLocation && (
                                                    <div className="location-info">
                                                        <span className="label">{t('carCheck.pickupLocation')}:</span>
                                                        <span className="value">{reservation.pickupLocation}</span>
                                                    </div>
                                                )}
                                                {reservation.dropoffLocation && (
                                                    <div className="location-info">
                                                        <span className="label">{t('carCheck.dropoffLocation')}:</span>
                                                        <span className="value">{reservation.dropoffLocation}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {reservation.reservation_Customers && reservation.reservation_Customers.length > 0 && (
                                                <div className="reservation-customers">
                                                    <span className="label">{t('carCheck.customers')}:</span>
                                                    <div className="customers-list">
                                                        {reservation.reservation_Customers.map((rc, index) => (
                                                            <span key={index} className="customer-name">
                                                                {rc.customer?.name || rc.customer?.fullName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default CarCheck;