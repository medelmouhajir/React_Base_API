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

                // 3. Search blacklist entries matching this customer (by nationalId, passportId, licenseNumber)
                const searchParams = {
                    nationalId: cust.nationalId || '',
                    passportId: cust.passportId || '',
                    licenseNumber: cust.licenseNumber || '',
                };
                const blList = await blacklistService.search(searchParams);
                setBlacklistEntries(blList || []);
            } catch (err) {
                console.error('❌ Error loading customer details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId]);

    // Handle removal of a blacklist entry
    const handleRemoveBlacklist = async (entryId) => {
        if (!window.confirm(t('customerDetails.confirmRemoveBlacklist'))) return;

        try {
            await blacklistService.delete(entryId);
            setBlacklistEntries((prev) => prev.filter((e) => e.id !== entryId));
        } catch (err) {
            console.error('❌ Error removing blacklist entry:', err);
            alert(t('customerDetails.errorRemoveBlacklist'));
        }
    };

    // Handle adding a new blacklist entry
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

    if (loading) {
        return (
            <div className="cd-loading">
                {t('common.loading')}…
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="cd-not-found">
                {t('customerDetails.notFound')}
            </div>
        );
    }

    return (
        <div className="cd-container">
            {/* — Customer Basic Info — */}
            <section className="cd-section cd-info">
                <h2>{t('customerDetails.heading', { name: customer.fullName })}</h2>
                <div className="cd-info-grid">
                    <div>
                        <span className="cd-label">{t('customer.fields.phoneNumber')}:</span>
                        <span className="cd-value">{customer.phoneNumber}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.email')}:</span>
                        <span className="cd-value">{customer.email}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.nationalId')}:</span>
                        <span className="cd-value">{customer.nationalId || '—'}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.passportId')}:</span>
                        <span className="cd-value">{customer.passportId || '—'}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.licenseNumber')}:</span>
                        <span className="cd-value">{customer.licenseNumber}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.dateOfBirth')}:</span>
                        <span className="cd-value">
                            {new Date(customer.dateOfBirth).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="cd-info-wide">
                        <span className="cd-label">{t('customer.fields.address')}:</span>
                        <span className="cd-value">{customer.address}</span>
                    </div>
                    <div>
                        <span className="cd-label">{t('customer.fields.isBlacklisted')}:</span>
                        <span className={`cd-value ${customer.isBlacklisted ? 'cd-yes' : 'cd-no'}`}>
                            {customer.isBlacklisted ? t('common.yes') : t('common.no')}
                        </span>
                    </div>
                </div>
                <button
                    className="cd-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← {t('common.goBack')}
                </button>
            </section>

            {/* — Reservations List — */}
            <section className="cd-section cd-reservations">
                <h3>{t('customerDetails.reservationsHeading')}</h3>
                {reservations.length === 0 ? (
                    <p className="cd-empty">{t('customerDetails.noReservations')}</p>
                ) : (
                    <ul className="cd-reservation-list">
                        {reservations.map((r) => (
                            <li
                                key={r.id}
                                className={`cd-reservation-item ${r.isPaid ? 'cd-paid' : 'cd-unpaid'}`}
                                onClick={() => navigate(`/reservations/${r.id}`)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="cd-resv-main">
                                    <span className="cd-resv-car">{r.carModel || r.carLicensePlate || t('customerDetails.unknownCar')}</span>
                                    <span className="cd-resv-dates">
                                        {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="cd-resv-status">
                                    {r.isPaid ? t('customerDetails.paid') : t('customerDetails.unpaid')}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* — Blacklist Entries — */}
            <section className="cd-section cd-blacklist">
                <h3>{t('customerDetails.blacklistHeading')}</h3>
                {blacklistEntries.length === 0 && !customer.isBlacklisted ? (
                    <p className="cd-empty">{t('customerDetails.notBlacklisted')}</p>
                ) : (
                    <div className="cd-blacklist-grid">
                        {blacklistEntries.map((entry) => {
                            const ownEntry = entry.reportedByAgencyId === user.agencyId;
                            return (
                                <div key={entry.id} className={`cd-blacklist-entry ${ownEntry ? 'cd-own' : 'cd-other'}`}>
                                    <div className="cd-bl-main">
                                        <div><strong>{entry.fullName}</strong></div>
                                        <div>{entry.reason}</div>
                                        <div className="cd-bl-meta">
                                            {t('customerDetails.reportedBy')}: {entry.reportedByAgencyName || t('customerDetails.unknownAgency')}
                                        </div>
                                        <div className="cd-bl-meta">
                                            {t('customerDetails.dateAdded')}: {new Date(entry.dateAdded).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {ownEntry && (
                                        <button
                                            className="cd-bl-remove"
                                            onClick={() => handleRemoveBlacklist(entry.id)}
                                        >
                                            {t('common.remove')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add to blacklist (only if not already reported by this agency) */}
                {!customer.isBlacklisted &&
                    !blacklistEntries.some((e) => e.reportedByAgencyId === user.agencyId) && (
                        <div className="cd-bl-add">
                            <h4>{t('customerDetails.addBlacklist')}</h4>
                            <textarea
                                className="cd-bl-reason"
                                value={blacklistReason}
                                onChange={(e) => setBlacklistReason(e.target.value)}
                                placeholder={t('customerDetails.placeholders.blacklistReason')}
                                rows={3}
                            />
                            <button
                                className="cd-bl-add-btn"
                                onClick={handleAddBlacklist}
                                disabled={addingBlacklist || !blacklistReason.trim()}
                            >
                                {addingBlacklist
                                    ? t('common.saving')
                                    : t('customerDetails.addBlacklistBtn')}
                            </button>
                        </div>
                    )}
            </section>


        </div>
    );
};

export default CustomerDetails;
