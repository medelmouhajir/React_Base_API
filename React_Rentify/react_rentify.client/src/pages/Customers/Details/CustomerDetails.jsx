import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import customerService from '../../../services/customerService';
import reservationService from '../../../services/reservationService';
import blacklistService from '../../../services/blacklistService';
import apiClient from '../../../services/apiClient';
import './CustomerDetails.css';

const CustomerDetails = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { id: customerId } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [blacklistEntries, setBlacklistEntries] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newAttachment, setNewAttachment] = useState({ fileName: '', filePath: '' });
    const [addingAttachment, setAddingAttachment] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState('');
    const [addingBlacklist, setAddingBlacklist] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch customer, reservations, attachments, and blacklist entries on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get customer details (includes attachments)
                const cust = await customerService.getById(customerId);
                setCustomer(cust);
                setAttachments(cust.attachments || []);

                // 2. Get reservations for this customer
                const resvList = await reservationService.getByCustomerId(customerId);
                // Sort: unpaid (isPaid === false) on top
                const sorted = resvList.sort((a, b) => {
                    const aPaid = a.isPaid ?? false;
                    const bPaid = b.isPaid ?? false;
                    if (aPaid === bPaid) return 0;
                    return aPaid ? 1 : -1;
                });
                setReservations(sorted);

                const searchParams = {
                    nationalId: cust.nationalId || '',
                    passportId: cust.passportId || '',
                    licenseNumber: cust.licenseNumber || '',
                };
                const blList = await blacklistService.search(searchParams);

                setBlacklistEntries(blList);

            } catch (err) {
                console.error('❌ Error fetching customer data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchData();
        }
    }, [customerId]);


    const handleAddBlacklist = async () => {
        if (!blacklistReason.trim()) return;
        setAddingBlacklist(true);

        try {
            const entryData = {
                nationalId: customer.nationalId,
                passportId: customer.passportId,
                licenseNumber: customer.licenseNumber,
                fullName: customer.fullName,
                reason: blacklistReason.trim(),
                reportedByAgencyId: user.agencyId,
            };
            const created = await blacklistService.create(entryData);
            setBlacklistEntries((prev) => [...prev, created]);
            setBlacklistReason('');
        } catch (err) {
            console.error('❌ Error adding blacklist entry:', err);
            alert(t('customerDetails.errorAddBlacklist'));
        } finally {
            setAddingBlacklist(false);
        }
    };

    // Handle adding an attachment
    const handleAddAttachment = async () => {
        const { fileName, filePath } = newAttachment;
        if (!fileName.trim() || !filePath.trim()) return;

        setAddingAttachment(true);
        try {
            const added = await customerService.addAttachment(customerId, {
                fileName: fileName.trim(),
                filePath: filePath.trim(),
            });
            setAttachments((prev) => [...prev, added]);
            setNewAttachment({ fileName: '', filePath: '' });
        } catch (err) {
            console.error('❌ Error adding attachment:', err);
            alert(t('customerDetails.errorAddAttachment'));
        } finally {
            setAddingAttachment(false);
        }
    };

    // Handle removing an attachment
    const handleRemoveAttachment = async (attachId) => {
        if (!window.confirm(t('customerDetails.confirmRemoveAttachment'))) return;

        try {
            // Direct DELETE call since service has no deleteAttachment helper
            await apiClient.delete(`/customers/${customerId}/attachments/${attachId}`);
            setAttachments((prev) => prev.filter((a) => a.id !== attachId));
        } catch (err) {
            console.error('❌ Error removing attachment:', err);
            alert(t('customerDetails.errorRemoveAttachment'));
        }
    };

    // Handle delete customer
    const handleDeleteCustomer = async () => {
        if (!window.confirm(t('customerDetails.confirmDelete'))) return;

        try {
            await customerService.delete(customerId);
            navigate('/customers');
        } catch (err) {
            console.error('❌ Error deleting customer:', err);
            alert(t('customerDetails.errorDelete'));
        }
    };

    if (loading) {
        return (
            <div className="customer-details-container">
                <div className="customer-details-loading">
                    <div className="loading-spinner"></div>
                    <span>{t('common.loading')}…</span>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="customer-details-container">
                <div className="customer-details-error">
                    <h2>{t('customerDetails.notFound')}</h2>
                    <button
                        className="cd-back-btn"
                        onClick={() => navigate('/customers')}
                    >
                        ← {t('common.goBack')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-details-container">
            {/* Header with Action Buttons */}
            <div className="customer-details-header">
                <div className="cd-header-content">
                    <h1 className="cd-title">
                        {t('customerDetails.heading', { name: customer.fullName })}
                    </h1>
                    <div className="cd-status-badge">
                        <span className={`cd-status ${customer.isBlacklisted ? 'blacklisted' : 'active'}`}>
                            {customer.isBlacklisted ? t('customer.status.blacklisted') : t('customer.status.active')}
                        </span>
                    </div>
                </div>

                <div className="cd-action-buttons">
                    <Link
                        to={`/customers/${customerId}/edit`}
                        className="cd-btn cd-btn-primary"
                    >
                        <svg className="cd-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t('common.edit')}
                    </Link>

                    <button
                        onClick={handleDeleteCustomer}
                        className="cd-btn cd-btn-danger"
                    >
                        <svg className="cd-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('common.remove')}
                    </button>

                    <Link
                        to={`/reservations/add?customerId=${customerId}`}
                        className="cd-btn cd-btn-success"
                    >
                        <svg className="cd-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {t('customerDetails.newReservation')}
                    </Link>
                </div>
            </div>

            {/* Customer Basic Info */}
            <section className="cd-section cd-info">
                <h2 className="cd-section-title">{t('customerDetails.basicInfo')}</h2>
                <div className="cd-info-grid">
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.phoneNumber')}:</span>
                        <span className="cd-value">
                            <a href={`tel:${customer.phoneNumber}`}>{customer.phoneNumber}</a>
                        </span>
                    </div>
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.email')}:</span>
                        <span className="cd-value">
                            <a href={`mailto:${customer.email}`}>{customer.email}</a>
                        </span>
                    </div>
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.nationalId')}:</span>
                        <span className="cd-value">{customer.nationalId || '—'}</span>
                    </div>
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.passportId')}:</span>
                        <span className="cd-value">{customer.passportId || '—'}</span>
                    </div>
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.licenseNumber')}:</span>
                        <span className="cd-value">{customer.licenseNumber}</span>
                    </div>
                    <div className="cd-info-item">
                        <span className="cd-label">{t('customer.fields.dateOfBirth')}:</span>
                        <span className="cd-value">
                            {new Date(customer.dateOfBirth).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="cd-info-item cd-info-wide">
                        <span className="cd-label">{t('customer.fields.address')}:</span>
                        <span className="cd-value">{customer.address}</span>
                    </div>
                </div>
            </section>

            {/* Reservations List */}
            <section className="cd-section cd-reservations">
                <div className="cd-section-header">
                    <h3 className="cd-section-title">{t('customerDetails.reservationsHeading')}</h3>
                    <span className="cd-count-badge">{reservations.length}</span>
                </div>

                {reservations.length === 0 ? (
                    <div className="cd-empty-state">
                        <svg className="cd-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>{t('customerDetails.noReservations')}</p>
                        <Link
                            to={`/reservations/add?customerId=${customerId}`}
                            className="cd-btn cd-btn-primary cd-btn-sm"
                        >
                            {t('customerDetails.createFirstReservation')}
                        </Link>
                    </div>
                ) : (
                    <div className="cd-reservation-list">
                        {reservations.map((r) => (
                            <div
                                key={r.id}
                                className={`cd-reservation-item ${r.isPaid ? 'cd-paid' : 'cd-unpaid'}`}
                                onClick={() => navigate(`/reservations/${r.id}`)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="cd-resv-content">
                                    <div className="cd-resv-main">
                                        <h4 className="cd-resv-car">
                                            {r.carModel || r.carLicensePlate || t('customerDetails.unknownCar')}
                                        </h4>
                                        <p className="cd-resv-dates">
                                            {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="cd-resv-meta">
                                        <span className={`cd-resv-status ${r.invoice && r.invoice.isPaid ? 'paid' : 'unpaid'}`}>
                                            {r.invoice && r.invoice.isPaid ? t('customerDetails.paid') : t('customerDetails.unpaid')}
                                        </span>
                                        {r.agreedPrice && (
                                            <span className="cd-resv-amount">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'MAD'
                                                }).format(r.finalPrice ?? r.agreedPrice)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <svg className="cd-resv-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Blacklist Entries */}
            <section className="cd-section cd-blacklist">
                <h3 className="cd-section-title">{t('customerDetails.blacklistHeading')}</h3>

                {blacklistEntries.length === 0 && !customer.isBlacklisted ? (
                    <p className="cd-empty-text">{t('customerDetails.notBlacklisted')}</p>
                ) : (
                    <div className="cd-blacklist-grid">
                        {blacklistEntries.map((entry) => {
                            const ownEntry = entry.reportedByAgencyId === user.agencyId;
                            return (
                                <div key={entry.id} className={`cd-blacklist-entry ${ownEntry ? 'own' : 'other'}`}>
                                    <div className="cd-bl-header">
                                        <span className="cd-bl-agency">
                                            {ownEntry ? t('customerDetails.yourAgency') : (entry.reportedByAgencyName || t('customerDetails.otherAgency'))}
                                        </span>
                                        <span className="cd-bl-date">
                                            {new Date(entry.dateAdded).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="cd-bl-reason">{entry.reason}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add to Blacklist Form */}
                {!customer.isBlacklisted && (
                    <div className="cd-add-blacklist">
                        <h4 className="cd-add-bl-title">{t('customerDetails.addToBlacklist')}</h4>
                        <div className="cd-add-bl-form">
                            <textarea
                                placeholder={t('customerDetails.blacklistReasonPlaceholder')}
                                value={blacklistReason}
                                onChange={(e) => setBlacklistReason(e.target.value)}
                                className="cd-bl-reason-input"
                                rows="3"
                            />
                            <button
                                onClick={handleAddBlacklist}
                                disabled={addingBlacklist || !blacklistReason.trim()}
                                className="cd-btn cd-btn-danger cd-btn-sm"
                            >
                                {addingBlacklist
                                    ? t('common.saving')
                                    : t('customerDetails.addBlacklistBtn')}
                            </button>
                        </div>
                    </div>
                )}
            </section>


            {/* Back Button */}
            <div className="cd-back-section">
                <button
                    className="cd-back-btn"
                    onClick={() => navigate('/customers')}
                >
                    ← {t('common.goBack')}
                </button>
            </div>
        </div>
    );
};

export default CustomerDetails;