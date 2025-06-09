import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import customerService from '../../../services/customerService';
import './CustomersList.css';

const CustomersList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all customers for this agency
    const fetchCustomers = async () => {
        if (!agencyId) return;
        setIsLoading(true);
        try {
            const data = await customerService.getByAgencyId(agencyId);
            setCustomers(data);
        } catch (err) {
            console.error('❌ Error fetching customers:', err);
            setError(t('customer.list.error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [agencyId]);

    // Delete handler
    const handleDelete = async (id) => {
        if (!window.confirm(t('customer.list.confirmDelete'))) return;
        try {
            await customerService.delete(id);
            // Remove deleted customer from local state
            setCustomers((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error('❌ Error deleting customer:', err);
            setError(t('customer.list.deleteError'));
        }
    };

    if (isLoading) {
        return <div className="customerlist-loading">{t('common.loading')}...</div>;
    }

    return (
        <div className="customerlist-container">
            <div className="customerlist-header">
                <h1>{t('customer.list.title')}</h1>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/customers/add')}
                >
                    {t('customer.list.addNew')}
                </button>
            </div>

            {error && <div className="customerlist-error">{error}</div>}

            <div className="customerlist-table-wrapper">
                <table className="customerlist-table">
                    <thead>
                        <tr>
                            <th>{t('customer.fields.fullName')}</th>
                            <th>{t('customer.fields.phoneNumber')}</th>
                            <th>{t('customer.fields.email')}</th>
                            <th>{t('customer.fields.licenseNumber')}</th>
                            <th>{t('customer.fields.dateOfBirth')}</th>
                            <th>{t('customer.fields.isBlacklisted')}</th>
                            <th>{t('customer.list.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.fullName}</td>
                                <td>{customer.phoneNumber}</td>
                                <td>{customer.email}</td>
                                <td>{customer.licenseNumber}</td>
                                <td>
                                    {new Date(customer.dateOfBirth).toLocaleDateString()}
                                </td>
                                <td>
                                    {customer.isBlacklisted
                                        ? t('common.yes')
                                        : t('common.no')}
                                </td>
                                <td className="customerlist-actions">
                                    <Link
                                        to={`/customers/${customer.id}`}
                                        className="btn-edit"
                                    >
                                        {t('common.details')}
                                    </Link>
                                    <Link
                                        to={`/customers/${customer.id}/edit`}
                                        className="btn-edit"
                                    >
                                        {t('common.edit')}
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(customer.id)}
                                        className="btn-delete"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {customers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="no-records">
                                    {t('customer.list.noRecords')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomersList;
