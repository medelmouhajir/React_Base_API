// src/pages/Tickets/List/TicketsList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { ticketService } from '../../../services/ticketService';
import './TicketsList.css';

const TicketsList = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    // Status options for filtering
    const statusOptions = [
        { value: 'all', label: t('tickets.status.all') },
        { value: 0, label: t('tickets.status.created') },
        { value: 1, label: t('tickets.status.inProgress') },
        { value: 2, label: t('tickets.status.completed') },
        { value: 3, label: t('tickets.status.cancelled') }
    ];

    // Load tickets
    const loadTickets = useCallback(async () => {
        try {
            setError(null);
            const data = await ticketService.getAll();
            setTickets(data || []);
        } catch (err) {
            console.error('Error loading tickets:', err);
            setError(t('tickets.errors.loadFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    // Initial load
    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Refresh handler
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTickets();
    }, [loadTickets]);

    // Delete ticket handler
    const handleDelete = async (ticketId) => {
        if (!window.confirm(t('tickets.confirmDelete'))) {
            return;
        }

        try {
            await ticketService.delete(ticketId);
            setTickets(prev => prev.filter(t => t.id !== ticketId));
        } catch (err) {
            console.error('Error deleting ticket:', err);
            setError(t('tickets.errors.deleteFailed'));
        }
    };

    // Filter tickets based on search and status
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = searchTerm === '' ||
            ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.phone.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get status badge class
    const getStatusClass = (status) => {
        switch (status) {
            case 0: return 'status-created';
            case 1: return 'status-inprogress';
            case 2: return 'status-completed';
            case 3: return 'status-cancelled';
            default: return 'status-created';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 0: return t('tickets.status.created');
            case 1: return t('tickets.status.inProgress');
            case 2: return t('tickets.status.completed');
            case 3: return t('tickets.status.cancelled');
            default: return t('tickets.status.created');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(t('common.locale'), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className={`tickets-list-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="tickets-loading">
                    <div className="loading-spinner"></div>
                    <span>{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`tickets-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="tickets-header">
                <div className="header-content">
                    <h1 className="tickets-title">{t('tickets.title')}</h1>
                    <p className="tickets-subtitle">{t('tickets.subtitle')}</p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
                        disabled={refreshing}
                        title={t('common.refresh')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
                            <path d="M3.51 15a9 9 0 0 0 14.85 3.36L23 14" />
                        </svg>
                        <span className="sr-only">{t('common.refresh')}</span>
                    </button>

                </div>
            </div>

            {/* Filters */}
            <div className="tickets-filters">
                <div className="filter-group">
                    <label htmlFor="search" className="filter-label">
                        {t('common.search')}
                    </label>
                    <div className="search-input-container">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            id="search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('tickets.searchPlaceholder')}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="clear-search"
                                title={t('common.clear')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-group">
                    <label htmlFor="status-filter" className="filter-label">
                        {t('tickets.status.label')}
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="status-filter"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="error-close"
                        title={t('common.close')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Results Count */}
            <div className="results-info">
                <span className="results-count">
                    {t('common.resultsCount', {
                        count: filteredTickets.length,
                        total: tickets.length
                    })}
                </span>
            </div>

            {/* Tickets Grid/List */}
            <div className="tickets-grid">
                {filteredTickets.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3>{t('tickets.noTickets')}</h3>
                        <p>{t('tickets.noTicketsDescription')}</p>
                        <button className="new-ticket-button">
                            {t('tickets.createFirstTicket')}
                        </button>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-card">
                            <div className="ticket-header">
                                <div className="ticket-id">#{ticket.id}</div>
                                <div className={`status-badge ${getStatusClass(ticket.status)}`}>
                                    {getStatusText(ticket.status)}
                                </div>
                            </div>

                            <div className="ticket-content">
                                <h3 className="ticket-subject">{ticket.object}</h3>
                                <div className="ticket-meta">
                                    <div className="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span>{ticket.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <span>{ticket.phone}</span>
                                    </div>
                                    <div className="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12,6 12,12 16,14" />
                                        </svg>
                                        <span>{ticket.createdAt}</span>
                                    </div>
                                </div>

                                {ticket.message && (
                                    <p className="ticket-message">
                                        {ticket.message.length > 120
                                            ? `${ticket.message.substring(0, 120)}...`
                                            : ticket.message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="ticket-actions">
                                <button
                                    onClick={() => navigate('/tickets/' + ticket.id)}
                                    className="action-button view-button"
                                    title={t('common.view')}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </button>

                                <button
                                    className="action-button delete-button"
                                    onClick={() => handleDelete(ticket.id)}
                                    title={t('common.delete')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TicketsList;