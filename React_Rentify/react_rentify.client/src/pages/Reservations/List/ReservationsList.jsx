// src/pages/Reservations/List/ReservationsList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import reservationService from '../../../services/reservationService';
import carService from '../../../services/carService';
import customerService from '../../../services/customerService';
import './ReservationsList.css';

const ReservationsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    // Master data
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cars, setCars] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Filter & search state
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterCar, setFilterCar] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Derived lists for dropdowns
    const [statuses, setStatuses] = useState([]);

    // Fetch all data on mount
    useEffect(() => {
        if (!agencyId) return;

        const fetchAll = async () => {
            setIsLoading(true);
            try {
                // Fetch reservations, cars, and customers in parallel
                const [resData, carData, customerData] = await Promise.all([
                    reservationService.getByAgencyId(agencyId),
                    carService.getByAgencyId(agencyId),
                    customerService.getByAgencyId(agencyId),
                ]);

                setReservations(resData || []);
                setCars(carData || []);
                setCustomers(customerData || []);

                // Extract unique statuses from reservations
                const uniqueStatuses = Array.from(
                    new Set((resData || []).map((r) => r.status).filter(Boolean))
                );
                setStatuses(uniqueStatuses);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching reservations/cars/customers:', err);
                setError(t('reservation.list.error', 'Failed to load reservations. Please try again.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, [agencyId, t]);

    // Format date function for improved display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Compute filtered list whenever filters/search change
    const filteredReservations = useMemo(() => {
        return reservations.filter((r) => {
            // 1) Search-term filter (case-insensitive substring on customerName, carLicensePlate, or status)
            const term = searchTerm.trim().toLowerCase();
            if (term && !(
                r.customerName?.toLowerCase().includes(term) ||
                r.carLicensePlate?.toLowerCase().includes(term) ||
                r.status?.toLowerCase().includes(term)
            )) {
                return false;
            }

            // 2) Start date filter
            if (filterStartDate && new Date(r.startDate) < new Date(filterStartDate)) {
                return false;
            }

            // 3) End date filter
            if (filterEndDate && new Date(r.endDate) > new Date(filterEndDate)) {
                return false;
            }

            // 4) Customer filter
            if (filterCustomer && r.customerId !== filterCustomer) {
                return false;
            }

            // 5) Car filter
            if (filterCar && r.carId !== filterCar) {
                return false;
            }

            // 6) Status filter
            if (filterStatus && r.status !== filterStatus) {
                return false;
            }

            return true;
        });
    }, [reservations, searchTerm, filterStartDate, filterEndDate, filterCustomer, filterCar, filterStatus]);

    // Handle add new reservation
    const handleAddNew = () => {
        navigate('/reservations/add');
    };

    // Clear all filters
    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterCustomer('');
        setFilterCar('');
        setFilterStatus('');
        setSearchTerm('');
    };

    return (
        <div className={`reservationlist-container ${isDarkMode ? 'dark' : 'light'}`}>
            <header className="reservationlist-header">
                <h1 className="reservationlist-title">
                    {t('reservation.list.title', 'Reservations')}
                </h1>

                <div className="reservationlist-controls">
                    <button
                        className="add-button"
                        onClick={handleAddNew}
                        aria-label={t('reservation.list.addNew', 'Add New Reservation')}
                    >
                        <span className="add-icon">+</span>
                        <span className="add-text">{t('reservation.list.addNew', 'Add New Reservation')}</span>
                    </button>

                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-bar-res"
                            placeholder={t('reservation.list.search', 'Search reservations...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('reservation.list.search', 'Search reservations...')}
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setSearchTerm('')}
                                aria-label={t('common.clear', 'Clear')}
                            >
                                &times;
                            </button>
                        )}
                    </div>

                    <button
                        className="toggle-filters-button"
                        onClick={() => setShowFilters(!showFilters)}
                        aria-expanded={showFilters}
                        aria-controls="filter-card"
                    >
                        {showFilters
                            ? t('reservation.list.hideFilters', 'Hide Filters')
                            : t('reservation.list.showFilters', 'Show Filters')}
                    </button>
                </div>
            </header>

            {showFilters && (
                <div id="filter-card" className="filter-card">
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label htmlFor="filterStartDate">
                                {t('reservation.list.filter.fromDate', 'From Date')}
                            </label>
                            <input
                                id="filterStartDate"
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filterEndDate">
                                {t('reservation.list.filter.toDate', 'To Date')}
                            </label>
                            <input
                                id="filterEndDate"
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filterCustomer">
                                {t('reservation.list.filter.customer', 'Customer')}
                            </label>
                            <select
                                id="filterCustomer"
                                value={filterCustomer}
                                onChange={(e) => setFilterCustomer(e.target.value)}
                            >
                                <option value="">
                                    {t('reservation.list.filter.allCustomers', 'All Customers')}
                                </option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filterCar">
                                {t('reservation.list.filter.car', 'Car')}
                            </label>
                            <select
                                id="filterCar"
                                value={filterCar}
                                onChange={(e) => setFilterCar(e.target.value)}
                            >
                                <option value="">
                                    {t('reservation.list.filter.allCars', 'All Cars')}
                                </option>
                                {cars.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.licensePlate} - {c.model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filterStatus">
                                {t('reservation.list.filter.status', 'Status')}
                            </label>
                            <select
                                id="filterStatus"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">
                                    {t('reservation.list.filter.allStatuses', 'All Statuses')}
                                </option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="filter-actions">
                        <button
                            className="clear-filters-button"
                            onClick={clearFilters}
                            disabled={!filterStartDate && !filterEndDate && !filterCustomer && !filterCar && !filterStatus && !searchTerm}
                        >
                            {t('reservation.list.clearFilters', 'Clear Filters')}
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button
                        className="retry-button"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="reservations-table desktop-table">
                            <thead>
                                <tr>
                                    <th>{t('reservation.list.table.customer', 'Customer')}</th>
                                    <th>{t('reservation.list.table.car', 'Car')}</th>
                                    <th>{t('reservation.list.table.startDate', 'Start Date')}</th>
                                    <th>{t('reservation.list.table.endDate', 'End Date')}</th>
                                    <th>{t('reservation.list.table.status', 'Status')}</th>
                                    <th>{t('reservation.list.table.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReservations.length > 0 ? (
                                    filteredReservations.map((r) => (
                                        <tr key={r.id}>
                                            <td data-label={t('reservation.list.table.customer', 'Customer')}>
                                                {r.customers?.length > 0
                                                    ? r.customers.map((customer, idx) => (
                                                        <span key={customer?.id || 'hhh'}>
                                                            <Link to={`/customer/${customer.id}`}>
                                                                {customer?.fullName || 'hello'}
                                                            </Link>
                                                            {/* add comma separator except after last */}
                                                            {idx < r.customers.length - 1 && ', '}
                                                        </span>
                                                    ))
                                                    : 'Unknown'}
                                            </td>
                                            <td data-label={t('reservation.list.table.car', 'Car')}>
                                                {r.carLicensePlate}
                                            </td>
                                            <td data-label={t('reservation.list.table.startDate', 'Start Date')}>
                                                {formatDate(r.startDate)}
                                            </td>
                                            <td data-label={t('reservation.list.table.endDate', 'End Date')}>
                                                {formatDate(r.endDate)}
                                            </td>
                                            <td data-label={t('reservation.list.table.status', 'Status')}>
                                                <span className={`status-badge status-${r.status?.toLowerCase()}`}>
                                                    {t('reservation.status.' + r.status.toLowerCase())}
                                                </span>
                                            </td>
                                            <td data-label={t('reservation.list.table.actions', 'Actions')}>
                                                <div className="actions-group">
                                                    <button
                                                        className="action-button details-button"
                                                        onClick={() => navigate(`/reservations/${r.id}`)}
                                                    >
                                                        {t('common.details', 'Details')}
                                                    </button>
                                                    <button
                                                        className="action-button contract-button"
                                                        onClick={() => navigate(`/reservations/${r.id}/contract`)}
                                                    >
                                                        {t('reservation.list.contract', 'Contract')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="no-data"
                                        >
                                            {t('reservation.list.noData', 'No reservations found.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-cards">
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map((r) => (
                                <div key={r.id} className="reservation-card">
                                    <div className="card-header">
                                        <h3 className="card-title">{r.customerName}</h3>
                                        <span className={`status-badge status-${r.status?.toLowerCase()}`}>
                                            {r.status}
                                        </span>
                                    </div>

                                    <div className="card-details">
                                        <div className="card-row">
                                            <span className="card-label">{t('reservation.list.table.car', 'Car')}:</span>
                                            <span className="card-value">{r.carLicensePlate}</span>
                                        </div>

                                        <div className="card-row">
                                            <span className="card-label">{t('reservation.list.table.startDate', 'Start Date')}:</span>
                                            <span className="card-value">{formatDate(r.startDate)}</span>
                                        </div>

                                        <div className="card-row">
                                            <span className="card-label">{t('reservation.list.table.endDate', 'End Date')}:</span>
                                            <span className="card-value">{formatDate(r.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="action-button details-button"
                                            onClick={() => navigate(`/reservations/${r.id}`)}
                                        >
                                            {t('reservation.list.details', 'Details')}
                                        </button>
                                        <button
                                            className="action-button contract-button"
                                            onClick={() => navigate(`/reservations/${r.id}/contract`)}
                                        >
                                            {t('reservation.list.contract', 'Contract')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data-mobile">
                                {t('reservation.list.noData', 'No reservations found.')}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReservationsList;