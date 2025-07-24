// src/pages/Search/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import carService from '../../services/carService';
import customerService from '../../services/customerService';
import reservationService from '../../services/reservationService';
import SearchBar from '../../components/ui/SearchBar';
import './SearchPage.css';

const SearchPage = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const agencyId = user?.agencyId;

    // Get search parameters from URL
    const searchQuery = searchParams.get('q') || '';
    const searchCategory = searchParams.get('category') || 'all';

    // State for search results
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [results, setResults] = useState({
        cars: [],
        customers: [],
        reservations: []
    });

    // Fetch search results when query params change
    useEffect(() => {
        if (!searchQuery.trim() || !agencyId) {
            setIsLoading(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Determine which categories to search based on searchCategory
                const promises = [];
                const resultObj = {
                    cars: [],
                    customers: [],
                    reservations: []
                };

                // Only search categories that are requested or 'all'
                if (searchCategory === 'all' || searchCategory === 'cars') {
                    promises.push(
                        carService.getByAgencyId(agencyId).then(data => {
                            resultObj.cars = data.filter(car =>
                                car.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                car.fields.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                car.fields?.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                        })
                    );
                }

                if (searchCategory === 'all' || searchCategory === 'customers') {
                    promises.push(
                        customerService.getByAgencyId(agencyId).then(data => {
                            resultObj.customers = data.filter(customer =>
                                customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                customer.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                customer.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                customer.nationalId?.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                        })
                    );
                }

                if (searchCategory === 'all' || searchCategory === 'reservations') {
                    promises.push(
                        reservationService.getByAgencyId(agencyId).then(data => {
                            resultObj.reservations = data.filter(reservation => {
                                // Search in reservation fields
                                const searchInReservation =
                                    reservation.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    reservation.pickupLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    reservation.dropoffLocation?.toLowerCase().includes(searchQuery.toLowerCase());

                                // Check for associated customer names
                                const hasMatchingCustomer = reservation.reservation_Customers?.some(rc =>
                                    rc.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                return searchInReservation || hasMatchingCustomer;
                            });
                        })
                    );
                }

                await Promise.all(promises);
                setResults(resultObj);
            } catch (err) {
                console.error('❌ Error fetching search results:', err);
                setError(t('search.error'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [searchQuery, searchCategory, agencyId, t]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Calculate total results
    const totalResults = results.cars.length + results.customers.length + results.reservations.length;

    return (
        <div className={`search-page ${isDarkMode ? 'dark' : ''}`}>
            <div className="search-page-header">
                <h1 className="search-page-title">{t('search.resultsTitle')}</h1>
                <div className="search-page-bar">
                    <SearchBar className="search-page-searchbar" />
                </div>
            </div>

            {isLoading ? (
                <div className="search-loading">
                    <div className="search-loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            ) : error ? (
                <div className="search-error">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="search-results-container">
                    <div className="search-stats">
                        <p>
                            {t('search.found', { count: totalResults, query: searchQuery })}
                        </p>
                    </div>

                    {totalResults === 0 ? (
                        <div className="no-results">
                            <p>{t('search.noResults')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Car Results */}
                            {(searchCategory === 'all' || searchCategory === 'cars') && results.cars.length > 0 && (
                                <div className="result-section">
                                    <h2 className="result-section-title">
                                        {t('search.carsResults', { count: results.cars.length })}
                                    </h2>
                                    <div className="result-cards">
                                        {results.cars.map(car => (
                                            <Link
                                                to={`/cars/${car.id}`}
                                                key={car.id}
                                                className="result-card car-result"
                                            >
                                                <div className="result-card-header">
                                                    <h3 className="result-card-title">
                                                        {car.fields.manufacturer} {car.fields.model}
                                                    </h3>
                                                    <span className="result-card-badge">
                                                        {car.licensePlate}
                                                    </span>
                                                </div>
                                                <div className="result-card-content">
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('car.fields.year')}:</span>
                                                        <span className="detail-value">{car.fields.year || '-'}</span>
                                                    </p>
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('car.fields.status')}:</span>
                                                        <span className="detail-value">{t('car.status.' + car.status.toLowerCase())}</span>
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Customer Results */}
                            {(searchCategory === 'all' || searchCategory === 'customers') && results.customers.length > 0 && (
                                <div className="result-section">
                                    <h2 className="result-section-title">
                                        {t('search.customersResults', { count: results.customers.length })}
                                    </h2>
                                    <div className="result-cards">
                                        {results.customers.map(customer => (
                                            <Link
                                                to={`/customers/${customer.id}`}
                                                key={customer.id}
                                                className="result-card customer-result"
                                            >
                                                <div className="result-card-header">
                                                    <h3 className="result-card-title">
                                                        {customer.fullName}
                                                    </h3>
                                                </div>
                                                <div className="result-card-content">
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('customer.fields.email')}:</span>
                                                        <span className="detail-value">{customer.email || '-'}</span>
                                                    </p>
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('customer.fields.phone')}:</span>
                                                        <span className="detail-value">{customer.phoneNumber || '-'}</span>
                                                    </p>
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('customer.fields.licenseNumber')}:</span>
                                                        <span className="detail-value">{customer.licenseNumber || '-'}</span>
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reservation Results */}
                            {(searchCategory === 'all' || searchCategory === 'reservations') && results.reservations.length > 0 && (
                                <div className="result-section">
                                    <h2 className="result-section-title">
                                        {t('search.reservationsResults', { count: results.reservations.length })}
                                    </h2>
                                    <div className="result-cards">
                                        {results.reservations.map(reservation => (
                                            <Link
                                                to={`/reservations/${reservation.id}`}
                                                key={reservation.id}
                                                className="result-card reservation-result"
                                            >
                                                <div className="result-card-header">
                                                    <h3 className="result-card-title">
                                                        {reservation.reservation_Customers &&
                                                            reservation.reservation_Customers[0]?.customer?.name ||
                                                            t('search.noCustomerName')}
                                                    </h3>
                                                    <span className={`result-card-badge status-${reservation.status?.toLowerCase()}`}>
                                                        {reservation.status}
                                                    </span>
                                                </div>
                                                <div className="result-card-content">
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('reservation.fields.period')}:</span>
                                                        <span className="detail-value">
                                                            {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                                                        </span>
                                                    </p>
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('reservation.fields.car')}:</span>
                                                        <span className="detail-value">
                                                            {reservation.car?.licensePlate || '-'}
                                                        </span>
                                                    </p>
                                                    <p className="result-card-detail">
                                                        <span className="detail-label">{t('reservation.fields.price')}:</span>
                                                        <span className="detail-value">
                                                            ${parseFloat(reservation.agreedPrice).toFixed(2)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPage;