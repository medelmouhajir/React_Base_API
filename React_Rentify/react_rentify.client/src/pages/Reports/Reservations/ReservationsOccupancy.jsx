// src/pages/Reports/Reservations/ReservationsOccupancy.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { reservationService } from '../../../services/reservationService';
import { carService } from '../../../services/carService';
import Loading from '../../../components/Loading/Loading';
import './ReservationsOccupancy.css';

const ReservationsOccupancy = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [occupancyData, setOccupancyData] = useState({
        totalCars: 0,
        totalDays: 0,
        occupiedDays: 0,
        occupancyRate: 0,
        byCategory: [],
        byTimeframe: [],
        topPerformingCars: [],
        lowPerformingCars: []
    });

    useEffect(() => {
        fetchOccupancyData();
    }, [dateRange, agencyId]);

    const fetchOccupancyData = async () => {
        if (!agencyId) return;

        setLoading(true);
        setError(null);

        try {
            const [reservations, cars] = await Promise.all([
                reservationService.getByAgencyId(agencyId),
                carService.getByAgencyId(agencyId)
            ]);

            const processed = processOccupancyData(reservations, cars);
            setOccupancyData(processed);
        } catch (err) {
            console.error('Error fetching occupancy data:', err);
            setError(t('reports.occupancy.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const processOccupancyData = (reservations, cars) => {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Filter reservations within date range
        const filteredReservations = reservations.filter(reservation => {
            const resStart = new Date(reservation.startDate);
            const resEnd = new Date(reservation.endDate);
            return resStart <= endDate && resEnd >= startDate;
        });

        // Calculate total occupied days
        const occupiedDays = filteredReservations.reduce((total, reservation) => {
            const resStart = new Date(Math.max(new Date(reservation.startDate), startDate));
            const resEnd = new Date(Math.min(new Date(reservation.endDate), endDate));
            const days = Math.ceil((resEnd - resStart) / (1000 * 60 * 60 * 24)) + 1;
            return total + Math.max(0, days);
        }, 0);

        const totalPossibleDays = cars.length * totalDays;
        const occupancyRate = totalPossibleDays > 0 ? (occupiedDays / totalPossibleDays) * 100 : 0;

        // Group by car category
        const categoryMap = new Map();
        cars.forEach(car => {
            const category = car.fields?.manufacturer || 'Unknown';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category,
                    totalCars: 0,
                    occupiedDays: 0,
                    totalPossibleDays: 0
                });
            }
            const categoryData = categoryMap.get(category);
            categoryData.totalCars++;
            categoryData.totalPossibleDays += totalDays;
        });

        filteredReservations.forEach(reservation => {
            const car = cars.find(c => c.id === reservation.carId);
            if (car) {
                const category = car.fields?.manufacturer || 'Unknown';
                const categoryData = categoryMap.get(category);
                if (categoryData) {
                    const resStart = new Date(Math.max(new Date(reservation.startDate), startDate));
                    const resEnd = new Date(Math.min(new Date(reservation.endDate), endDate));
                    const days = Math.ceil((resEnd - resStart) / (1000 * 60 * 60 * 24)) + 1;
                    categoryData.occupiedDays += Math.max(0, days);
                }
            }
        });

        const byCategory = Array.from(categoryMap.values()).map(cat => ({
            ...cat,
            occupancyRate: cat.totalPossibleDays > 0 ? (cat.occupiedDays / cat.totalPossibleDays) * 100 : 0
        }));

        // Group by timeframe (weekly)
        const byTimeframe = generateTimeframeData(startDate, endDate, filteredReservations, cars);

        // Calculate car performance
        const carPerformance = cars.map(car => {
            const carReservations = filteredReservations.filter(r => r.carId === car.id);
            const carOccupiedDays = carReservations.reduce((total, reservation) => {
                const resStart = new Date(Math.max(new Date(reservation.startDate), startDate));
                const resEnd = new Date(Math.min(new Date(reservation.endDate), endDate));
                const days = Math.ceil((resEnd - resStart) / (1000 * 60 * 60 * 24)) + 1;
                return total + Math.max(0, days);
            }, 0);

            return {
                car,
                occupiedDays: carOccupiedDays,
                occupancyRate: totalDays > 0 ? (carOccupiedDays / totalDays) * 100 : 0,
                reservationCount: carReservations.length
            };
        });

        const topPerformingCars = carPerformance
            .sort((a, b) => b.occupancyRate - a.occupancyRate)
            .slice(0, 5);

        const lowPerformingCars = carPerformance
            .sort((a, b) => a.occupancyRate - b.occupancyRate)
            .slice(0, 5);

        return {
            totalCars: cars.length,
            totalDays,
            occupiedDays,
            occupancyRate,
            byCategory,
            byTimeframe,
            topPerformingCars,
            lowPerformingCars
        };
    };

    const generateTimeframeData = (startDate, endDate, reservations, cars) => {
        const timeframes = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);

            if (weekEnd > endDate) {
                weekEnd.setTime(endDate.getTime());
            }

            const weekReservations = reservations.filter(reservation => {
                const resStart = new Date(reservation.startDate);
                const resEnd = new Date(reservation.endDate);
                return resStart <= weekEnd && resEnd >= weekStart;
            });

            const weekDays = Math.ceil((weekEnd - weekStart) / (1000 * 60 * 60 * 24)) + 1;
            const occupiedDays = weekReservations.reduce((total, reservation) => {
                const resStart = new Date(Math.max(new Date(reservation.startDate), weekStart));
                const resEnd = new Date(Math.min(new Date(reservation.endDate), weekEnd));
                const days = Math.ceil((resEnd - resStart) / (1000 * 60 * 60 * 24)) + 1;
                return total + Math.max(0, days);
            }, 0);

            const totalPossibleDays = cars.length * weekDays;
            const occupancyRate = totalPossibleDays > 0 ? (occupiedDays / totalPossibleDays) * 100 : 0;

            timeframes.push({
                period: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
                occupancyRate,
                occupiedDays,
                totalPossibleDays
            });

            current.setDate(current.getDate() + 7);
        }

        return timeframes;
    };

    const handleDateRangeChange = (field, value) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const exportData = () => {
        const csvContent = [
            ['Category', 'Total Cars', 'Occupied Days', 'Total Possible Days', 'Occupancy Rate (%)'],
            ...occupancyData.byCategory.map(cat => [
                cat.category,
                cat.totalCars,
                cat.occupiedDays,
                cat.totalPossibleDays,
                cat.occupancyRate.toFixed(2)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `occupancy-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className={`occupancy-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="occupancy-header">
                <div className="header-content">
                    <h1 className="occupancy-title">{t('reports.occupancy.title')}</h1>
                    <p className="occupancy-description">{t('reports.occupancy.description')}</p>
                </div>
                <button className="export-btn" onClick={exportData}>
                    <span className="export-icon">📊</span>
                    {t('reports.occupancy.export')}
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="date-filter-section">
                <div className="date-filter-card">
                    <h3 className="filter-title">{t('reports.occupancy.dateRange')}</h3>
                    <div className="date-inputs">
                        <div className="date-input-group">
                            <label htmlFor="startDate">{t('reports.occupancy.startDate')}</label>
                            <input
                                type="date"
                                id="startDate"
                                value={dateRange.startDate}
                                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                                className="date-input"
                            />
                        </div>
                        <div className="date-input-group">
                            <label htmlFor="endDate">{t('reports.occupancy.endDate')}</label>
                            <input
                                type="date"
                                id="endDate"
                                value={dateRange.endDate}
                                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                                className="date-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-section">
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">🚗</div>
                        <div className="metric-content">
                            <div className="metric-value">{occupancyData.totalCars}</div>
                            <div className="metric-label">{t('reports.occupancy.totalCars')}</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">📅</div>
                        <div className="metric-content">
                            <div className="metric-value">{occupancyData.totalDays}</div>
                            <div className="metric-label">{t('reports.occupancy.totalDays')}</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">✅</div>
                        <div className="metric-content">
                            <div className="metric-value">{occupancyData.occupiedDays}</div>
                            <div className="metric-label">{t('reports.occupancy.occupiedDays')}</div>
                        </div>
                    </div>
                    <div className="metric-card highlight">
                        <div className="metric-icon">📈</div>
                        <div className="metric-content">
                            <div className="metric-value">{occupancyData.occupancyRate.toFixed(1)}%</div>
                            <div className="metric-label">{t('reports.occupancy.occupancyRate')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Analysis */}
            <div className="analysis-section">
                <div className="analysis-card">
                    <h3 className="analysis-title">{t('reports.occupancy.byCategory')}</h3>
                    <div className="category-list">
                        {occupancyData.byCategory.map((category, index) => (
                            <div key={index} className="category-item">
                                <div className="category-info">
                                    <div className="category-name">{category.category}</div>
                                    <div className="category-stats">
                                        {category.totalCars} {t('reports.occupancy.cars')} •
                                        {category.occupiedDays}/{category.totalPossibleDays} {t('reports.occupancy.days')}
                                    </div>
                                </div>
                                <div className="category-performance">
                                    <div className="performance-bar">
                                        <div
                                            className="performance-fill"
                                            style={{ width: `${Math.min(category.occupancyRate, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="performance-value">
                                        {category.occupancyRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Analysis */}
            <div className="performance-section">
                <div className="performance-grid">
                    <div className="performance-card">
                        <h3 className="performance-title">{t('reports.occupancy.topPerforming')}</h3>
                        <div className="car-list">
                            {occupancyData.topPerformingCars.map((item, index) => (
                                <div key={index} className="car-item">
                                    <div className="car-rank">{index + 1}</div>
                                    <div className="car-info">
                                        <div className="car-name">
                                            {item.car.car_Model?.name} - {item.car.licensePlate}
                                        </div>
                                        <div className="car-stats">
                                            {item.reservationCount} {t('reports.occupancy.reservations')} •
                                            {item.occupiedDays} {t('reports.occupancy.days')}
                                        </div>
                                    </div>
                                    <div className="car-rate">
                                        {item.occupancyRate.toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="performance-card">
                        <h3 className="performance-title">{t('reports.occupancy.lowPerforming')}</h3>
                        <div className="car-list">
                            {occupancyData.lowPerformingCars.map((item, index) => (
                                <div key={index} className="car-item">
                                    <div className="car-rank">{index + 1}</div>
                                    <div className="car-info">
                                        <div className="car-name">
                                            {item.car.car_Model?.name} - {item.car.licensePlate}
                                        </div>
                                        <div className="car-stats">
                                            {item.reservationCount} {t('reports.occupancy.reservations')} •
                                            {item.occupiedDays} {t('reports.occupancy.days')}
                                        </div>
                                    </div>
                                    <div className="car-rate">
                                        {item.occupancyRate.toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeframe Analysis */}
            <div className="timeframe-section">
                <div className="timeframe-card">
                    <h3 className="timeframe-title">{t('reports.occupancy.timeframeTrends')}</h3>
                    <div className="timeframe-chart">
                        {occupancyData.byTimeframe.map((period, index) => (
                            <div key={index} className="timeframe-item">
                                <div className="timeframe-period">{period.period}</div>
                                <div className="timeframe-bar">
                                    <div
                                        className="timeframe-fill"
                                        style={{ width: `${Math.min(period.occupancyRate, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="timeframe-value">
                                    {period.occupancyRate.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationsOccupancy;