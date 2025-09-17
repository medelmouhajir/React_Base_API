// src/pages/Tickets/Details/TicketDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ticketService from '../../../services/ticketService';
import './TicketDetails.css';

const TicketDetails = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    // Status options based on the enum from your backend
    const statusOptions = [
        { value: 0, label: 'Created', color: 'blue' },
        { value: 1, label: 'Ongoing', color: 'yellow' },
        { value: 2, label: 'Completed', color: 'green' },
        { value: 3, label: 'Canceled', color: 'red' }
    ];

    const getStatusLabel = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption ? statusOption.label : 'Unknown';
    };

    const getStatusColor = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption ? statusOption.color : 'gray';
    };

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                setLoading(true);
                const data = await ticketService.getById(parseInt(id));
                setTicket(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching ticket:', err);
                setError('Failed to load ticket details');
                toast.error('Failed to load ticket details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTicket();
        }
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        if (!ticket) return;

        try {
            setUpdating(true);
            const updateData = {
                id: ticket.id,
                name: ticket.name,
                phone: ticket.phone,
                object: ticket.object,
                message: ticket.message,
                status: newStatus
            };

            const updatedTicket = await ticketService.update(ticket.id, updateData);
            setTicket(updatedTicket);
            toast.success('Ticket status updated successfully');
        } catch (err) {
            console.error('Error updating ticket:', err);
            toast.error('Failed to update ticket status');
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const handleBack = () => {
        navigate('/tickets');
    };

    if (loading) {
        return (
            <div className="ticket-details-loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
                <p>Loading ticket details...</p>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="ticket-details-error">
                <div className="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h2>Error Loading Ticket</h2>
                <p>{error || 'Ticket not found'}</p>
                <button onClick={handleBack} className="btn-primary">
                    Back to Tickets
                </button>
            </div>
        );
    }

    return (
        <div className="ticket-details-container">
            {/* Header */}
            <div className="ticket-details-header">
                <div className="header-left">
                    <button onClick={handleBack} className="btn-back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7-7l-7 7 7 7" />
                        </svg>
                        Back to Tickets
                    </button>
                    <div className="header-title">
                        <h1>Ticket #{ticket.id}</h1>
                        <div className={`status-badge status-${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="ticket-details-content">
                {/* Main Information Card */}
                <div className="card ticket-info-card">
                    <div className="card-header">
                        <h2>Ticket Information</h2>
                        <div className="created-date">
                            Created: {formatDate(ticket.createdAt)}
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name</label>
                                <div className="info-value">{ticket.name}</div>
                            </div>

                            <div className="info-item">
                                <label>Phone</label>
                                <div className="info-value">
                                    <a href={`tel:${ticket.phone}`} className="phone-link">
                                        {ticket.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="info-item full-width">
                                <label>Subject</label>
                                <div className="info-value">{ticket.object}</div>
                            </div>

                            <div className="info-item full-width">
                                <label>Message</label>
                                <div className="info-value message-content">
                                    {ticket.message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Update Card */}
                <div className="card status-update-card">
                    <div className="card-header">
                        <h2>Status Management</h2>
                    </div>

                    <div className="card-body">
                        <div className="current-status">
                            <label>Current Status</label>
                            <div className={`status-display status-${getStatusColor(ticket.status)}`}>
                                <div className="status-indicator"></div>
                                {getStatusLabel(ticket.status)}
                            </div>
                        </div>

                        <div className="status-actions">
                            <label>Update Status</label>
                            <div className="status-buttons">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusUpdate(status.value)}
                                        disabled={updating || ticket.status === status.value}
                                        className={`btn-status btn-status-${status.color} ${ticket.status === status.value ? 'active' : ''
                                            }`}
                                    >
                                        {updating ? (
                                            <div className="btn-spinner"></div>
                                        ) : null}
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {updating && (
                            <div className="updating-message">
                                <div className="updating-spinner"></div>
                                Updating status...
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Actions Card */}
                <div className="card contact-actions-card">
                    <div className="card-header">
                        <h2>Contact Actions</h2>
                    </div>

                    <div className="card-body">
                        <div className="action-buttons">
                            <a href={`tel:${ticket.phone}`} className="btn-action btn-call">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                </svg>
                                Call {ticket.name}
                            </a>

                            <a href={`sms:${ticket.phone}`} className="btn-action btn-message">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                                Send SMS
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetails;