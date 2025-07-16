// src/pages/Reports/Cars/CarRevenue.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import carService from '../../../services/carService';
import reservationService from '../../../services/reservationService';
import invoiceService from '../../../services/invoiceService';
import './CarRevenue.css';

const CarRevenue = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    // Data states
    const [cars, setCars] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, quarter, year, custom
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [selectedCarId, setSelectedCarId] = useState('all');
    const [sortBy, setSortBy] = useState('revenue'); // revenue, reservations, utilization
    const [sortOrder, setSortOrder] = useState('desc');

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!agencyId) return;

            setIsLoading(true);
            setError(null);

            try {
                const [carsData, reservationsData, invoicesData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    reservationService.getByAgencyId(agencyId),
                    invoiceService.getAll()
                ]);

                setCars(carsData || []);
                setReservations(reservationsData || []);
                setInvoices(invoicesData || []);
            } catch (err) {
                console.error('❌ Error fetching car revenue data:', err);
                setError(t('reports.cars.revenue.error', 'Failed to load car revenue data. Please try again.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [agencyId, t]);

    // Calculate date range based on selected period
    const dateRange = useMemo(() => {
        const now = new Date();
        let startDate, endDate;

        switch (selectedPeriod) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = customDateFrom ? new Date(customDateFrom) : null;
                endDate = customDateTo ? new Date(customDateTo) : null;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return { startDate, endDate };
    }, [selectedPeriod, customDateFrom, customDateTo]);

    // Calculate car revenue data
    const carRevenueData = useMemo(() => {
        if (!cars.length || !reservations.length || !invoices.length) return [];

        const { startDate, endDate } = dateRange;
        if (!startDate || !endDate) return [];

        // Filter reservations by date range
        const filteredReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.startDate);
            return reservationDate >= startDate && reservationDate <= endDate;
        });

        // Create revenue map by reservation ID
        const revenueMap = new Map();
        invoices.forEach(invoice => {
            if (invoice.isPaid) {
                revenueMap.set(invoice.reservationId, invoice.amount);
            }
        });

        // Group data by car
        const carDataMap = new Map();

        filteredReservations.forEach(reservation => {
            const carId = reservation.carId;
            const revenue = revenueMap.get(reservation.id) || 0;

            if (!carDataMap.has(carId)) {
                carDataMap.set(carId, {
                    carId,
                    totalRevenue: 0,
                    totalReservations: 0,
                    paidReservations: 0,
                    unpaidReservations: 0,
                    totalDays: 0,
                    averageRevenue: 0,
                    utilizationRate: 0
                });
            }

            const carData = carDataMap.get(carId);
            carData.totalReservations++;
            carData.totalRevenue += revenue;

            if (revenue > 0) {
                carData.paidReservations++;
            } else {
                carData.unpaidReservations++;
            }

            // Calculate days
            const startDate = new Date(reservation.startDate);
            const endDate = new Date(reservation.endDate);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            carData.totalDays += days;
        });

        // Calculate averages and utilization
        const totalPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        carDataMap.forEach((carData, carId) => {
            carData.averageRevenue = carData.totalReservations > 0
                ? carData.totalRevenue / carData.totalReservations
                : 0;
            carData.utilizationRate = (carData.totalDays / totalPeriodDays) * 100;
        });

        // Add car details and filter by selected car
        let result = Array.from(carDataMap.values()).map(carData => {
            const car = cars.find(c => c.id === carData.carId);
            return {
                ...carData,
                car: car || { model: 'Unknown', year: '', licensePlate: '' }
            };
        });

        // Filter by selected car
        if (selectedCarId !== 'all') {
            result = result.filter(item => item.carId === selectedCarId);
        }

        // Sort results
        result.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'revenue':
                    valueA = a.totalRevenue;
                    valueB = b.totalRevenue;
                    break;
                case 'reservations':
                    valueA = a.totalReservations;
                    valueB = b.totalReservations;
                    break;
                case 'utilization':
                    valueA = a.utilizationRate;
                    valueB = b.utilizationRate;
                    break;
                default:
                    valueA = a.totalRevenue;
                    valueB = b.totalRevenue;
            }

            return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
        });

        return result;
    }, [cars, reservations, invoices, dateRange, selectedCarId, sortBy, sortOrder]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const totalRevenue = carRevenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
        const totalReservations = carRevenueData.reduce((sum, item) => sum + item.totalReservations, 0);
        const totalCars = carRevenueData.length;
        const averageRevenuePerCar = totalCars > 0 ? totalRevenue / totalCars : 0;
        const averageUtilization = totalCars > 0
            ? carRevenueData.reduce((sum, item) => sum + item.utilizationRate, 0) / totalCars
            : 0;

        return {
            totalRevenue,
            totalReservations,
            totalCars,
            averageRevenuePerCar,
            averageUtilization
        };
    }, [carRevenueData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${value.toFixed(1)}%`;
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'month':
                return t('reports.cars.revenue.thisMonth', 'This Month');
            case 'quarter':
                return t('reports.cars.revenue.thisQuarter', 'This Quarter');
            case 'year':
                return t('reports.cars.revenue.thisYear', 'This Year');
            case 'custom':
                return t('reports.cars.revenue.customPeriod', 'Custom Period');
            default:
                return t('reports.cars.revenue.thisMonth', 'This Month');
        }
    };

    if (isLoading) {
        return (
            <div className={`car-revenue-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`car-revenue-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('common.error', 'Error')}</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-revenue-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="revenue-header">
                <div className="header-content">
                    <button
                        className="back-button"
                        onClick={() => navigate('/reports')}
                        aria-label={t('common.back', 'Back')}
                    >
                        <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="header-info">
                        <h1 className="revenue-title">
                            {t('reports.cars.revenue.title', 'Car Revenue Report')}
                        </h1>
                        <p className="revenue-description">
                            {t('reports.cars.revenue.description', 'Analyze revenue performance by individual cars')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="revenue-filters">
                <div className="filters-grid">
                    {/* Period Filter */}
                    <div className="filter-group">
                        <label className="filter-label">
                            {t('reports.cars.revenue.period', 'Period')}
                        </label>
                        <select
                            className="filter-select"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            <option value="month">{t('reports.cars.revenue.thisMonth', 'This Month')}</option>
                            <option value="quarter">{t('reports.cars.revenue.thisQuarter', 'This Quarter')}</option>
                            <option value="year">{t('reports.cars.revenue.thisYear', 'This Year')}</option>
                            <option value="custom">{t('reports.cars.revenue.customPeriod', 'Custom Period')}</option>
                        </select>
                    </div>

                    {/* Custom Date Inputs */}
                    {selectedPeriod === 'custom' && (
                        <>
                            <div className="filter-group">
                                <label className="filter-label">
                                    {t('reports.cars.revenue.fromDate', 'From Date')}
                                </label>
                                <input
                                    type="date"
                                    className="filter-input"
                                    value={customDateFrom}
                                    onChange={(e) => setCustomDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">
                                    {t('reports.cars.revenue.toDate', 'To Date')}
                                </label>
                                <input
                                    type="date"
                                    className="filter-input"
                                    value={customDateTo}
                                    onChange={(e) => setCustomDateTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Car Filter */}
                    <div className="filter-group">
                        <label className="filter-label">
                            {t('reports.cars.revenue.car', 'Car')}
                        </label>
                        <select
                            className="filter-select"
                            value={selectedCarId}
                            onChange={(e) => setSelectedCarId(e.target.value)}
                        >
                            <option value="all">{t('reports.cars.revenue.allCars', 'All Cars')}</option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.model} {car.year} - {car.licensePlate}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="filter-group">
                        <label className="filter-label">
                            {t('reports.cars.revenue.sortBy', 'Sort By')}
                        </label>
                        <select
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="revenue">{t('reports.cars.revenue.revenue', 'Revenue')}</option>
                            <option value="reservations">{t('reports.cars.revenue.reservations', 'Reservations')}</option>
                            <option value="utilization">{t('reports.cars.revenue.utilization', 'Utilization')}</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="filter-group">
                        <label className="filter-label">
                            {t('reports.cars.revenue.order', 'Order')}
                        </label>
                        <select
                            className="filter-select"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc">{t('reports.cars.revenue.highest', 'Highest First')}</option>
                            <option value="asc">{t('reports.cars.revenue.lowest', 'Lowest First')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="revenue-summary">
                <h2 className="summary-title">
                    {t('reports.cars.revenue.summary', 'Summary')} - {getPeriodLabel()}
                </h2>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-icon">💰</div>
                        <div className="summary-info">
                            <div className="summary-value">{formatCurrency(summaryStats.totalRevenue)}</div>
                            <div className="summary-label">{t('reports.cars.revenue.totalRevenue', 'Total Revenue')}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon">📊</div>
                        <div className="summary-info">
                            <div className="summary-value">{formatCurrency(summaryStats.averageRevenuePerCar)}</div>
                            <div className="summary-label">{t('reports.cars.revenue.avgPerCar', 'Avg per Car')}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon">📅</div>
                        <div className="summary-info">
                            <div className="summary-value">{summaryStats.totalReservations}</div>
                            <div className="summary-label">{t('reports.cars.revenue.totalReservations', 'Total Reservations')}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon">📈</div>
                        <div className="summary-info">
                            <div className="summary-value">{formatPercentage(summaryStats.averageUtilization)}</div>
                            <div className="summary-label">{t('reports.cars.revenue.avgUtilization', 'Avg Utilization')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Data Table */}
            <div className="revenue-data">
                <div className="data-header">
                    <h2 className="data-title">
                        {t('reports.cars.revenue.detailedData', 'Detailed Revenue Data')}
                    </h2>
                    <div className="data-info">
                        {carRevenueData.length} {t('reports.cars.revenue.carsShowing', 'cars showing')}
                    </div>
                </div>

                {carRevenueData.length > 0 ? (
                    <div className="revenue-table-container">
                        <table className="revenue-table">
                            <thead>
                                <tr>
                                    <th>{t('reports.cars.revenue.car', 'Car')}</th>
                                    <th>{t('reports.cars.revenue.totalRevenue', 'Total Revenue')}</th>
                                    <th>{t('reports.cars.revenue.reservations', 'Reservations')}</th>
                                    <th>{t('reports.cars.revenue.paid', 'Paid')}</th>
                                    <th>{t('reports.cars.revenue.unpaid', 'Unpaid')}</th>
                                    <th>{t('reports.cars.revenue.avgRevenue', 'Avg Revenue')}</th>
                                    <th>{t('reports.cars.revenue.utilization', 'Utilization')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carRevenueData.map((item, index) => (
                                    <tr key={item.carId} className="revenue-row">
                                        <td className="car-info">
                                            <div className="car-details">
                                                <div className="car-model">
                                                    {item.car.model} {item.car.year}
                                                </div>
                                                <div className="car-plate">
                                                    {item.car.licensePlate}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="revenue-value">
                                            {formatCurrency(item.totalRevenue)}
                                        </td>
                                        <td className="reservation-count">
                                            {item.totalReservations}
                                        </td>
                                        <td className="paid-count">
                                            <span className="status-badge status-paid">
                                                {item.paidReservations}
                                            </span>
                                        </td>
                                        <td className="unpaid-count">
                                            <span className="status-badge status-unpaid">
                                                {item.unpaidReservations}
                                            </span>
                                        </td>
                                        <td className="avg-revenue">
                                            {formatCurrency(item.averageRevenue)}
                                        </td>
                                        <td className="utilization-rate">
                                            <div className="utilization-container">
                                                <div className="utilization-bar">
                                                    <div
                                                        className="utilization-fill"
                                                        style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="utilization-text">
                                                    {formatPercentage(item.utilizationRate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-data">
                        <div className="no-data-icon">📊</div>
                        <h3 className="no-data-title">
                            {t('reports.cars.revenue.noData', 'No Revenue Data')}
                        </h3>
                        <p className="no-data-description">
                            {t('reports.cars.revenue.noDataDescription', 'No revenue data found for the selected period and filters.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarRevenue;