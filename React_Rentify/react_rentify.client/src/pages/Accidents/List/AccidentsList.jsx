// src/pages/Accidents/List/AccidentsList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Services
import accidentService from '../../../services/accidentService';

// Hooks
import { useRtlDirection } from '../../../hooks/useRtlDirection';

// CSS
import './AccidentsList.css';

const AccidentsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    useRtlDirection();

    // ========================
    // State Management
    // ========================
    const [accidents, setAccidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // ========================
    // Data Fetching
    // ========================
    useEffect(() => {
        fetchAccidents();
    }, []);

    const fetchAccidents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use getByAgencyId if user has agency access, otherwise getAll for admin
            const data = await accidentService.getByAgencyId(user.agencyId); // Adjust based on your auth context
            setAccidents(data);
        } catch (err) {
            console.error('Error fetching accidents:', err);
            setError(err.message || t('accidents.list.error.fetch'));
            toast.error(t('accidents.list.error.fetch'));
        } finally {
            setLoading(false);
        }
    };

    // ========================
    // Computed Values
    // ========================
    const filteredAndSortedAccidents = useMemo(() => {
        let filtered = accidents.filter(accident => {
            // Search filter
            const searchMatch = searchTerm === '' ||
                accident.carInfo?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                accident.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                accident.expertFullname?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const statusMatch = statusFilter === 'all' || accident.status.toString() === statusFilter;

            return searchMatch && statusMatch;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.accidentDate);
                    bValue = new Date(b.accidentDate);
                    break;
                case 'car':
                    aValue = a.carInfo?.licensePlate || '';
                    bValue = b.carInfo?.licensePlate || '';
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'cost':
                    aValue = accidentService.calculateNetCost(a);
                    bValue = accidentService.calculateNetCost(b);
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [accidents, searchTerm, statusFilter, sortBy, sortOrder]);

    // ========================
    // Event Handlers
    // ========================
    const handleAccidentClick = (accident) => {
        navigate(`/accidents/${accident.id}`);
    };

    const handleCreateAccident = () => {
        navigate('/accidents/add');
    };

    const handleDeleteAccident = async (accidentId, event) => {
        event.stopPropagation();

        if (!window.confirm(t('accidents.list.confirmDelete'))) {
            return;
        }

        try {
            await accidentService.delete(accidentId);
            toast.success(t('accidents.list.deleteSuccess'));
            fetchAccidents();
        } catch (err) {
            console.error('Error deleting accident:', err);
            toast.error(t('accidents.list.error.delete'));
        }
    };

    // ========================
    // Utility Functions
    // ========================
    const getStatusInfo = (status) => {
        const statusMap = {
            0: {
                key: 'created',
                class: 'al-status-created',
                icon: '⏳'
            },
            1: {
                key: 'maintenance',
                class: 'al-status-maintenance',
                icon: '🔧'
            },
            2: {
                key: 'completed',
                class: 'al-status-completed',
                icon: '✅'
            }
        };
        return statusMap[status] || statusMap[0];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ========================
    // Loading State
    // ========================
    if (loading) {
        return (
            <div className="accidents-list-container">
                <div className="al-loading">
                    <div className="al-loading-spinner"></div>
                    <p>{t('accidents.list.loading')}</p>
                </div>
            </div>
        );
    }

    // ========================
    // Error State
    // ========================
    if (error && accidents.length === 0) {
        return (
            <div className="accidents-list-container">
                <div className="al-error">
                    <div className="al-error-icon">⚠️</div>
                    <h3>{t('accidents.list.error.title')}</h3>
                    <p>{error}</p>
                    <button
                        className="al-btn al-btn-primary"
                        onClick={fetchAccidents}
                    >
                        {t('accidents.list.retry')}
                    </button>
                </div>
            </div>
        );
    }

    // ========================
    // Main Render
    // ========================
    return (
        <div className="accidents-list-container">
            {/* Header Section */}
            <div className="al-header">
                <div className="al-title-section">
                    <h1 className="al-title">
                        <span className="al-title-icon">🚗💥</span>
                        {t('accidents.list.title')}
                    </h1>
                    <p className="al-subtitle">
                        {t('accidents.list.subtitle', {
                            total: accidents.length,
                            filtered: filteredAndSortedAccidents.length
                        })}
                    </p>
                </div>

                <button
                    className="al-btn al-btn-primary al-add-btn"
                    onClick={handleCreateAccident}
                >
                    <span className="al-btn-icon">+</span>
                    <span className="al-btn-text">{t('accidents.list.addNew')}</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="al-filters">
                <div className="al-search-container">
                    <div className="al-search-wrapper">
                        <span className="al-search-icon">🔍</span>
                        <input
                            type="text"
                            className="al-search-input"
                            placeholder={t('accidents.list.search.placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="al-search-clear"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="al-filter-row">
                    <div className="al-filter-group">
                        <label className="al-filter-label">
                            {t('accidents.list.filters.status')}
                        </label>
                        <select
                            className="al-filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">{t('accidents.list.filters.allStatuses')}</option>
                            <option value="0">{t('accidents.status.created')}</option>
                            <option value="1">{t('accidents.status.maintenance')}</option>
                            <option value="2">{t('accidents.status.completed')}</option>
                        </select>
                    </div>

                    <div className="al-filter-group">
                        <label className="al-filter-label">
                            {t('accidents.list.filters.sortBy')}
                        </label>
                        <select
                            className="al-filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date">{t('accidents.list.sort.date')}</option>
                            <option value="car">{t('accidents.list.sort.car')}</option>
                            <option value="status">{t('accidents.list.sort.status')}</option>
                            <option value="cost">{t('accidents.list.sort.cost')}</option>
                        </select>
                    </div>

                    <button
                        className="al-sort-order-btn"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        title={t(`accidents.list.sort.${sortOrder === 'asc' ? 'ascending' : 'descending'}`)}
                    >
                        {sortOrder === 'asc' ? '↗️' : '↘️'}
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            {searchTerm || statusFilter !== 'all' ? (
                <div className="al-results-summary">
                    <span className="al-results-text">
                        {t('accidents.list.resultsFound', { count: filteredAndSortedAccidents.length })}
                    </span>
                    {(searchTerm || statusFilter !== 'all') && (
                        <button
                            className="al-clear-filters"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                            }}
                        >
                            {t('accidents.list.clearFilters')}
                        </button>
                    )}
                </div>
            ) : null}

            {/* Accidents Grid */}
            <div className="al-content">
                {filteredAndSortedAccidents.length === 0 ? (
                    <div className="al-empty-state">
                        <div className="al-empty-icon">📋</div>
                        <h3 className="al-empty-title">
                            {searchTerm || statusFilter !== 'all'
                                ? t('accidents.list.noResults')
                                : t('accidents.list.empty.title')
                            }
                        </h3>
                        <p className="al-empty-message">
                            {searchTerm || statusFilter !== 'all'
                                ? t('accidents.list.noResults.message')
                                : t('accidents.list.empty.message')
                            }
                        </p>
                        {(!searchTerm && statusFilter === 'all') && (
                            <button
                                className="al-btn al-btn-primary"
                                onClick={handleCreateAccident}
                            >
                                {t('accidents.list.addFirst')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="al-grid">
                        {filteredAndSortedAccidents.map((accident) => {
                            const statusInfo = getStatusInfo(accident.status);
                            const netCost = accidentService.calculateNetCost(accident);

                            return (
                                <div
                                    key={accident.id}
                                    className="al-card"
                                    onClick={() => handleAccidentClick(accident)}
                                >
                                    {/* Card Header */}
                                    <div className="al-card-header">
                                        <div className="al-card-date">
                                            <span className="al-date-icon">📅</span>
                                            <span className="al-date-text">
                                                {formatDate(accident.accidentDate)}
                                            </span>
                                        </div>
                                        <div className={`al-status-badge ${statusInfo.class}`}>
                                            <span className="al-status-icon">{statusInfo.icon}</span>
                                            <span className="al-status-text">
                                                {t(`accidents.status.${statusInfo.key}`)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Car Information */}
                                    <div className="al-card-car">
                                        <div className="al-car-info">
                                            <span className="al-car-icon">🚗</span>
                                            <div className="al-car-details">
                                                <span className="al-car-plate">
                                                    {accident.carInfo?.licensePlate || t('accidents.list.unknownCar')}
                                                </span>
                                                <span className="al-car-model">
                                                    {accident.carInfo?.manufacturer} {accident.carInfo?.model}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accident Notes */}
                                    <div className="al-card-notes">
                                        <p className="al-notes-text">
                                            {accident.notes?.length > 100
                                                ? `${accident.notes.substring(0, 100)}...`
                                                : accident.notes
                                            }
                                        </p>
                                    </div>

                                    {/* Expert Information */}
                                    {accident.expertFullname && (
                                        <div className="al-card-expert">
                                            <span className="al-expert-icon">👨‍🔧</span>
                                            <span className="al-expert-name">
                                                {accident.expertFullname}
                                            </span>
                                            {accident.expertPhone && (
                                                <span className="al-expert-phone">
                                                    📞 {accident.expertPhone}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Cost Information */}
                                    <div className="al-card-cost">
                                        <div className="al-cost-row">
                                            <span className="al-cost-label">
                                                {t('accidents.list.totalExpenses')}:
                                            </span>
                                            <span className="al-cost-value al-cost-expenses">
                                                {formatCurrency(accident.totalExpenses)}
                                            </span>
                                        </div>
                                        {accident.totalRefunds > 0 && (
                                            <div className="al-cost-row">
                                                <span className="al-cost-label">
                                                    {t('accidents.list.totalRefunds')}:
                                                </span>
                                                <span className="al-cost-value al-cost-refunds">
                                                    -{formatCurrency(accident.totalRefunds)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="al-cost-row al-cost-net">
                                            <span className="al-cost-label">
                                                {t('accidents.list.netCost')}:
                                            </span>
                                            <span className={`al-cost-value ${netCost >= 0 ? 'al-cost-positive' : 'al-cost-negative'}`}>
                                                {formatCurrency(netCost)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="al-card-actions">
                                        <button
                                            className="al-action-btn al-action-view"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAccidentClick(accident);
                                            }}
                                            title={t('accidents.list.actions.view')}
                                        >
                                            <span className="al-action-icon">👁️</span>
                                            <span className="al-action-text">{t('accidents.list.actions.view')}</span>
                                        </button>

                                        <button
                                            className="al-action-btn al-action-edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/accidents/${accident.id}/edit`);
                                            }}
                                            title={t('accidents.list.actions.edit')}
                                        >
                                            <span className="al-action-icon">✏️</span>
                                            <span className="al-action-text">{t('accidents.list.actions.edit')}</span>
                                        </button>

                                        <button
                                            className="al-action-btn al-action-delete"
                                            onClick={(e) => handleDeleteAccident(accident.id, e)}
                                            title={t('accidents.list.actions.delete')}
                                        >
                                            <span className="al-action-icon">🗑️</span>
                                            <span className="al-action-text">{t('accidents.list.actions.delete')}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccidentsList;