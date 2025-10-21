// src/pages/Reservations/Unpaid/UnpaidReservations.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { reservationService } from '../../../services/reservationService';
import { invoiceService } from '../../../services/invoiceService';
import {
    Calendar,
    Car,
    User,
    AlertTriangle,
    Eye,
    FileText,
    RefreshCw,
    Filter
} from 'lucide-react';
import './UnpaidReservations.css';

const UnpaidReservations = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const agencyId = user?.agencyId;

    const [unpaidReservations, setUnpaidReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('startDate');
    const [sortOrder, setSortOrder] = useState('desc');

    // Fetch unpaid reservations
    useEffect(() => {
        const fetchUnpaidReservations = async () => {
            if (!agencyId) return;

            setIsLoading(true);
            setError(null);

            try {
                const reservations = await reservationService.getUnpaidReservations(agencyId);
                setUnpaidReservations(reservations);
            } catch (err) {
                console.error('❌ Error fetching unpaid reservations:', err);
                setError(t('reservation.list.errors'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnpaidReservations();
    }, [agencyId, t]);

    // Filter and sort reservations
    const filteredAndSortedReservations = unpaidReservations
        .filter(reservation => {
            const matchesSearch = searchTerm === '' ||
                reservation.carLicensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reservation.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reservation.customers?.some(customer =>
                    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                );

            const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'startDate':
                    aValue = new Date(a.startDate);
                    bValue = new Date(b.startDate);
                    break;
                case 'endDate':
                    aValue = new Date(a.endDate);
                    bValue = new Date(b.endDate);
                    break;
                case 'agreedPrice':
                    aValue = a.agreedPrice || 0;
                    bValue = b.agreedPrice || 0;
                    break;
                case 'customer':
                    aValue = a.customers?.[0] ? `${a.customers[0].firstName} ${a.customers[0].lastName}` : '';
                    bValue = b.customers?.[0] ? `${b.customers[0].firstName} ${b.customers[0].lastName}` : '';
                    break;
                case 'car':
                    aValue = a.carLicensePlate || '';
                    bValue = b.carLicensePlate || '';
                    break;
                default:
                    aValue = a[sortBy];
                    bValue = b[sortBy];
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    const handleRefresh = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const reservations = await reservationService.getUnpaidReservations(agencyId);
            setUnpaidReservations(reservations);
        } catch (err) {
            console.error('❌ Error refreshing unpaid reservations:', err);
            setError(t('reservation.list.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewReservation = (reservationId) => {
        navigate(`/reservations/${reservationId}`);
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Reserved': 'status-reserved',
            'Ongoing': 'status-ongoing',
            'Completed': 'status-completed',
            'Cancelled': 'status-cancelled'
        };

        return (
            <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
                {t(`reservation.status.${status?.toLowerCase() || 'unknown'}`)}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat(t('language.locale'), {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat(t('language.locale'), {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="unpaid-reservations-container">
                <div className="loading-state">
                    <RefreshCw className="loading-spinner" />
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="unpaid-reservations-container">
                <div className="error-state">
                    <AlertTriangle className="error-icon" />
                    <h3>{t('reservation.list.error')}</h3>
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="retry-button">
                        <RefreshCw />
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`unpaid-reservations-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">{t('reservation.unpaid.title')}</h1>
                    <p className="page-subtitle">
                        {t('reservation.unpaid.subtitle', { count: filteredAndSortedReservations.length })}
                    </p>
                </div>
                <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
                    <RefreshCw className={isLoading ? 'loading-spinner' : ''} />
                    <span className="sr-only">{t('common.refresh')}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="filters-unpaid-section">
                <div className="search-unpaid-container">
                    <input
                        type="text"
                        placeholder={t('reservation.list.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-unpaid-input"
                    />
                </div>

                <div className="filter-unpaid-controls">
                    <div className="filter-unpaid-group">
                        <Filter className="filter-unpaid-icon" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-unpaid-select"
                        >
                            <option value="all">{t('reservation.fields.status')}</option>
                            <option value="Reserved">{t('reservation.status.reserved')}</option>
                            <option value="Ongoing">{t('reservation.status.ongoing')}</option>
                            <option value="Completed">{t('reservation.status.completed')}</option>
                        </select>
                    </div>

                    <div className="sort-controls">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="startDate">{t('reservation.fields.startDate')}</option>
                            <option value="endDate">{t('reservation.fields.endDate')}</option>
                            <option value="agreedPrice">{t('reservation.fields.price')}</option>
                            <option value="customer">{t('reservation.fields.customers')}</option>
                            <option value="car">{t('reservation.fields.car')}</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="sort-order-button"
                            title={t(`common.sort.${sortOrder === 'asc' ? 'descending' : 'ascending'}`)}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredAndSortedReservations.length === 0 ? (
                <div className="empty-state">
                    <FileText className="empty-icon" />
                    <h3>{t('reservation.unpaid.empty.title')}</h3>
                    <p>{t('reservation.unpaid.empty.description')}</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="desktop-view">
                        <div className="table-container">
                            <table className="reservations-table">
                                <thead>
                                    <tr>
                                        <th>{t('reservation.fields.car')}</th>
                                        <th>{t('reservation.fields.customers')}</th>
                                        <th>{t('reservation.fields.period')}</th>
                                        <th>{t('reservation.fields.status')}</th>
                                        <th>{t('reservation.fields.finalPrice')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedReservations.map((reservation) => (
                                        <tr key={reservation.id} className="reservation-row">
                                            <td>
                                                <div className="car-info">
                                                    <Car className="car-icon" />
                                                    <div>
                                                        <div className="car-plate">{reservation.carLicensePlate}</div>
                                                        <div className="car-model">{reservation.model}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="customer-info">
                                                    <User className="customer-icon" />
                                                    <div>
                                                        {reservation.customers?.[0] ? (
                                                            <>
                                                                <div className="customer-name">
                                                                    {reservation.customers[0].fullName}
                                                                </div>
                                                                {reservation.customers.length > 1 && (
                                                                    <div className="additional-customers">
                                                                        +{reservation.customers.length - 1} {t('common.others')}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="no-customer">{t('reservation.noCustomer')}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="period-info">
                                                    <Calendar className="calendar-icon" />
                                                    <div>
                                                        <div className="date-range">
                                                            {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                                                        </div>
                                                        <div className="duration">
                                                            {Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))} {t('reservation.fields.daysUnit')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(reservation.status)}
                                            </td>
                                            <td>
                                                <div className="price-info">
                                                    <div>
                                                        <div className="final-price">
                                                            {formatCurrency(reservation.finalPrice || reservation.agreedPrice)}
                                                        </div>
                                                        {reservation.finalPrice && reservation.finalPrice !== reservation.agreedPrice && (
                                                            <div className="agreed-price">
                                                                {t('reservation.fields.agreedPrice')}: {formatCurrency(reservation.agreedPrice)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actions">
                                                    <button
                                                        onClick={() => handleViewReservation(reservation.id)}
                                                        className="action-unpaid-button view-button"
                                                        title={t('common.view')}
                                                    >
                                                        <Eye />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="mobile-view">
                        <div className="cards-container">
                            {filteredAndSortedReservations.map((reservation) => (
                                <div key={reservation.id} className="reservation-card">
                                    <div className="card-header">
                                        <div className="car-info">
                                            <Car className="car-icon" />
                                            <div>
                                                <div className="car-plate">{reservation.carLicensePlate}</div>
                                                <div className="car-model">{reservation.model}</div>
                                            </div>
                                        </div>
                                        {getStatusBadge(reservation.status)}
                                    </div>

                                    <div className="card-content">
                                        <div className="card-field">
                                            <User className="field-icon" />
                                            <div className="field-content">
                                                <span className="field-label">{t('reservation.fields.customers')}</span>
                                                <span className="field-value">
                                                    {reservation.customers?.[0] ? (
                                                        <>
                                                            {reservation.customers[0].fullName}
                                                            {reservation.customers.length > 1 && (
                                                                <span className="additional-customers">
                                                                    {' '}+{reservation.customers.length - 1}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        t('reservation.noCustomer')
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-field">
                                            <Calendar className="field-icon" />
                                            <div className="field-content">
                                                <span className="field-label">{t('reservation.fields.period')}</span>
                                                <span className="field-value">
                                                    {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                                                </span>
                                                <span className="duration">
                                                    {Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))} {t('reservation.fields.daysUnit')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-field">
                                            <div className="field-content">
                                                <span className="field-label">{t('reservation.fields.finalPrice')}</span>
                                                <span className="field-value">
                                                    {formatCurrency(reservation.finalPrice || reservation.agreedPrice)}
                                                </span>
                                                {reservation.finalPrice && reservation.finalPrice !== reservation.agreedPrice && (
                                                    <span className="agreed-price">
                                                        {t('reservation.fields.agreedPrice')}: {formatCurrency(reservation.agreedPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            onClick={() => handleViewReservation(reservation.id)}
                                            className="card-button view-button"
                                        >
                                            <Eye />
                                            {t('common.view')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UnpaidReservations;