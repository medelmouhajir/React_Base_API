// src/pages/Reservations/Details/components/CustomerTab.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const CustomerTab = ({ reservation, onAddCustomer, onEditCustomer, onRemoveCustomer }) => {
    const { t } = useTranslation();
    const [expandedCustomerId, setExpandedCustomerId] = useState(null);

    const toggleCustomerExpand = (customerId) => {
        setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="customer-tab">
            <div className="tab-header">
                <h2 className="tab-title">
                    {t('reservation.customers.title', 'Customers')} ({reservation.customers?.length || 0})
                </h2>
                <button className="btn-success" onClick={onAddCustomer}>
                    <span className="btn-icon">+</span>
                    {t('reservation.customers.add', 'Add Customer')}
                </button>
            </div>

            {reservation.customers && reservation.customers.length > 0 ? (
                <div className="customer-cards-grid">
                    {reservation.customers.map((customer) => (
                        <div
                            key={customer.id}
                            className={`customer-card ${expandedCustomerId === customer.id ? 'expanded' : ''}`}
                        >
                            <div className="customer-card-header">
                                <div className="customer-avatar">
                                    {customer.imageUrl ? (
                                        <img src={customer.imageUrl} alt={customer.fullName} />
                                    ) : (
                                        <span className="avatar-initials">{getInitials(customer.fullName)}</span>
                                    )}
                                </div>

                                <div className="customer-basic-info">
                                    <h3 className="customer-name">{customer.fullName}</h3>
                                    {customer.isBlacklisted && (
                                        <span className="blacklist-badge">
                                            ⚠️ {t('customer.status.blacklisted', 'Blacklisted')}
                                        </span>
                                    )}
                                </div>

                                <button
                                    className="btn-expand"
                                    onClick={() => toggleCustomerExpand(customer.id)}
                                >
                                    {expandedCustomerId === customer.id ? '▼' : '▶'}
                                </button>
                            </div>

                            {expandedCustomerId === customer.id && (
                                <div className="customer-card-details">
                                    <div className="detail-grid">
                                        {customer.email && (
                                            <div className="detail-item">
                                                <span className="detail-icon">📧</span>
                                                <div className="detail-text">
                                                    <span className="detail-label">{t('customer.fields.email', 'Email')}</span>
                                                    <a href={`mailto:${customer.email}`} className="detail-value link">
                                                        {customer.email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {customer.phoneNumber && (
                                            <div className="detail-item">
                                                <span className="detail-icon">📱</span>
                                                <div className="detail-text">
                                                    <span className="detail-label">{t('customer.fields.phone', 'Phone')}</span>
                                                    <a href={`tel:${customer.phoneNumber}`} className="detail-value link">
                                                        {customer.phoneNumber}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {customer.nationalId && (
                                            <div className="detail-item">
                                                <span className="detail-icon">🆔</span>
                                                <div className="detail-text">
                                                    <span className="detail-label">{t('customer.fields.nationalId', 'National ID')}</span>
                                                    <span className="detail-value">{customer.nationalId}</span>
                                                </div>
                                            </div>
                                        )}

                                        {customer.licenseNumber && (
                                            <div className="detail-item">
                                                <span className="detail-icon">🪪</span>
                                                <div className="detail-text">
                                                    <span className="detail-label">{t('customer.fields.licenseNumber', 'License')}</span>
                                                    <span className="detail-value">{customer.licenseNumber}</span>
                                                </div>
                                            </div>
                                        )}

                                        {customer.address && (
                                            <div className="detail-item full-width">
                                                <span className="detail-icon">📍</span>
                                                <div className="detail-text">
                                                    <span className="detail-label">{t('customer.fields.address', 'Address')}</span>
                                                    <span className="detail-value">{customer.address}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="customer-card-actions">
                                        <Link
                                            to={`/customers/${customer.id}`}
                                            className="btn-secondary"
                                        >
                                            {t('common.viewDetails', 'View Details')}
                                        </Link>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => onEditCustomer(customer)}
                                        >
                                            {t('common.edit', 'Edit')}
                                        </button>
                                        <button
                                            className="btn-danger"
                                            onClick={() => onRemoveCustomer(customer)}
                                        >
                                            {t('common.remove', 'Remove')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Quick Contact Actions - Always Visible */}
                            <div className="customer-quick-actions">
                                {customer.phoneNumber && (
                                    <a
                                        href={`tel:${customer.phoneNumber}`}
                                        className="quick-reservations-action-btn"
                                        title={t('customer.actions.call', 'Call')}
                                    >
                                        📞
                                    </a>
                                )}
                                {customer.email && (
                                    <a
                                        href={`mailto:${customer.email}`}
                                        className="quick-reservations-action-btn"
                                        title={t('customer.actions.email', 'Email')}
                                    >
                                        ✉️
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-icon">👥</span>
                    <p>{t('reservation.customers.noCustomers', 'No customers added yet')}</p>
                    <button className="btn-success" onClick={onAddCustomer}>
                        <span className="btn-icon">+</span>
                        {t('reservation.customers.addFirst', 'Add First Customer')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomerTab;