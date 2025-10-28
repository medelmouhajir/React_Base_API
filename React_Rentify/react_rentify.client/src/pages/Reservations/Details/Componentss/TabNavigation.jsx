// src/pages/Reservations/Details/components/TabNavigation.jsx
import { useTranslation } from 'react-i18next';

const TabNavigation = ({ activeTab, onTabChange, customerCount, paymentCount }) => {
    const { t } = useTranslation();

    const tabs = [
        {
            id: 'overview',
            label: t('reservation.summary', 'Overview'),
            icon: '📊'
        },
        {
            id: 'customers',
            label: t('reservation.fields.customers', 'Customers'),
            icon: '👥',
            badge: customerCount
        },
        {
            id: 'payments',
            label: t('invoice.details.paymentsTitle', 'Payments'),
            icon: '💳',
            badge: paymentCount
        },
        {
            id: 'history',
            label: t('reservation.details.history', 'History'),
            icon: '📜'
        }
    ];

    return (
        <div className="tab-reservation-navigation">
            <div className="tab-buttons">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="tab-badge">{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TabNavigation;