import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
            } catch (err) {
                console.error('❌ Error fetching reservations/cars/customers:', err);
            }
        };

        fetchAll();
    }, [agencyId]);

    // Compute filtered list whenever filters/search change
    const filteredReservations = reservations.filter((r) => {
        // 1) Search-term filter (case-insensitive substring on customerName, carLicensePlate, or status)
        const term = searchTerm.trim().toLowerCase();
        if (term) {
            const matchesCustomer = r.customerName?.toLowerCase().includes(term);
            const matchesCar = r.carLicensePlate?.toLowerCase().includes(term);
            const matchesStatus = r.status?.toLowerCase().includes(term);
            if (!matchesCustomer && !matchesCar && !matchesStatus) return false;
        }

        // 2) Start date ≥ filterStartDate
        if (filterStartDate) {
            const rStart = r.startDate.slice(0, 10); // "YYYY-MM-DD"
            if (rStart < filterStartDate) return false;
        }

        // 3) End date ≤ filterEndDate
        if (filterEndDate) {
            const rEnd = r.endDate.slice(0, 10);
            if (rEnd > filterEndDate) return false;
        }

        // 4) Customer exact match
        if (filterCustomer && r.customerId !== filterCustomer) return false;

        // 5) Car exact match
        if (filterCar && r.carId !== filterCar) return false;

        // 6) Status exact match
        if (filterStatus && r.status !== filterStatus) return false;

        return true;
    });

    const handleResetFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterCustomer('');
        setFilterCar('');
        setFilterStatus('');
    };

    return (
        <div
            className={`reservationlist-container ${isDarkMode ? 'dark' : 'light'
                }`}
        >
            <div className="reservationlist-header">
                <h1 className="reservationlist-title">
                    {t('reservation.list.title', 'Reservations')}
                </h1>

                <div className="reservationlist-controls">
                    {/* Add Button */}
                    <button
                        className="add-button"
                        onClick={() => navigate('/reservations/add')}
                    >
                        + {t('reservation.list.addButton', 'Add Reservation')}
                    </button>

                    {/* Search Bar */}
                    <input
                        type="text"
                        className="search-bar"
                        placeholder={t(
                            'reservation.list.searchPlaceholder',
                            'Search by customer, car, or status…'
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Toggle Filters */}
                    <button
                        className="toggle-filters-button"
                        onClick={() => setShowFilters((prev) => !prev)}
                    >
                        {showFilters
                            ? t('reservation.list.hideFilters', 'Hide Filters')
                            : t('reservation.list.showFilters', 'Show Filters')}
                    </button>
                </div>
            </div>

            {/* Collapsible Filters Card */}
            {showFilters && (
                <div className="filter-card">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="filterStartDate">
                                {t('reservation.list.filter.startDate', 'Start Date')}
                            </label>
                            <input
                                type="date"
                                id="filterStartDate"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filterEndDate">
                                {t('reservation.list.filter.endDate', 'End Date')}
                            </label>
                            <input
                                type="date"
                                id="filterEndDate"
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
                                    {t(
                                        'reservation.list.filter.selectCustomer',
                                        'All Customers'
                                    )}
                                </option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName}
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
                                <option value="">{t('reservation.list.filter.selectCar', 'All Cars')}</option>
                                {cars.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.licensePlate}
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
                                    {t('reservation.list.filter.selectStatus', 'All Statuses')}
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
                            type="button"
                            className="clear-filters-button"
                            onClick={handleResetFilters}
                        >
                            {t('reservation.list.filter.clear', 'Clear Filters')}
                        </button>
                    </div>
                </div>
            )}

            {/* Table of Reservations */}
            <div className="table-responsive">
                <table className="reservations-table">
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
                                        {r.customerName}
                                    </td>
                                    <td data-label={t('reservation.list.table.car', 'Car')}>
                                        {r.carLicensePlate}
                                    </td>
                                    <td data-label={t('reservation.list.table.startDate', 'Start Date')}>
                                        {r.startDate.slice(0, 10)}
                                    </td>
                                    <td data-label={t('reservation.list.table.endDate', 'End Date')}>
                                        {r.endDate.slice(0, 10)}
                                    </td>
                                    <td data-label={t('reservation.list.table.status', 'Status')}>
                                        {r.status}
                                    </td>
                                    <td data-label={t('reservation.list.table.actions', 'Actions')}>
                                        <button
                                            className="details-button"
                                            onClick={() => navigate(`/reservations/${r.id}`)}
                                        >
                                            {t('reservation.list.details', 'Details')}
                                        </button>
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
        </div>
    );
};

export default ReservationsList;
