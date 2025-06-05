// src/pages/Invoices/List/InvoicesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import invoiceService from '../../../services/invoiceService';
import './InvoicesList.css';

const InvoicesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!agencyId) return;
            setIsLoading(true);
            try {
                const data = await invoiceService.getAll();
                // Filter by agency through reservation relationship if needed; assuming API returns only relevant invoices
                setInvoices(data);
                setFilteredInvoices(data);
            } catch (err) {
                console.error('❌ Error fetching invoices:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, [agencyId]);

    const handleFilter = () => {
        if (!fromDate && !toDate) {
            setFilteredInvoices(invoices);
            return;
        }
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        const filtered = invoices.filter((inv) => {
            const issued = new Date(inv.issuedAt);
            if (from && issued < from) return false;
            if (to) {
                // include entire 'to' day
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                if (issued > toEnd) return false;
            }
            return true;
        });
        setFilteredInvoices(filtered);
    };

    const handleClear = () => {
        setFromDate('');
        setToDate('');
        setFilteredInvoices(invoices);
    };

    return (
        <div className="invoiceslist-container">
            <div className="invoiceslist-header">
                <h1 className="invoiceslist-title">{t('invoice.list.title') || 'Invoices'}</h1>
                <button
                    className="btn-new"
                    onClick={() => navigate('/invoices/add')}
                >
                    {t('invoice.list.new') || 'New Invoice'}
                </button>
            </div>

            <div className="invoiceslist-filters">
                <div className="filter-group">
                    <label htmlFor="fromDate">{t('invoice.filters.from') || 'From'}</label>
                    <input
                        type="date"
                        id="fromDate"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label htmlFor="toDate">{t('invoice.filters.to') || 'To'}</label>
                    <input
                        type="date"
                        id="toDate"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <button className="btn-primary" onClick={handleFilter}>
                        {t('common.filter') || 'Filter'}
                    </button>
                    <button className="btn-secondary" onClick={handleClear}>
                        {t('common.clear') || 'Clear'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="invoiceslist-loading">{t('common.loading') || 'Loading...'}</div>
            ) : (
                <div className="table-wrapper">
                    <table className="invoiceslist-table">
                        <thead>
                            <tr>
                                <th>{t('invoice.fields.issuedAt') || 'Issued At'}</th>
                                <th>{t('invoice.fields.amount') || 'Amount'}</th>
                                <th>{t('invoice.fields.currency') || 'Currency'}</th>
                                <th>{t('invoice.fields.isPaid') || 'Paid'}</th>
                                <th>{t('invoice.fields.reservation') || 'Reservation'}</th>
                                <th>{t('invoice.list.actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        {t('invoice.list.noData') || 'No invoices found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                                        <td>{inv.amount.toFixed(2)}</td>
                                        <td>{inv.currency}</td>
                                        <td>{inv.isPaid ? t('common.yes') || 'Yes' : t('common.no') || 'No'}</td>
                                        <td>{inv.reservationId}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-action"
                                                onClick={() => navigate(`/invoices/${inv.id}`)}
                                            >
                                                {t('common.details') || 'Details'}
                                            </button>
                                            <button
                                                className="btn-action"
                                                onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                                            >
                                                {t('common.edit') || 'Edit'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
export default InvoicesList;
