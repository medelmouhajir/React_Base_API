import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import customerService from '../../../services/customerService';
import './CustomersList.css';

const CustomersList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'ascending' });

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
    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent row click if clicking delete
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

    // Sorting function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort customers
    const filteredAndSortedCustomers = () => {
        const filtered = customers.filter((customer) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                customer.fullName?.toLowerCase().includes(searchTermLower) ||
                customer.email?.toLowerCase().includes(searchTermLower) ||
                customer.phoneNumber?.toLowerCase().includes(searchTermLower) ||
                customer.licenseNumber?.toLowerCase().includes(searchTermLower)
            );
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle date values
                if (sortConfig.key === 'dateOfBirth') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }

                // Handle string comparisons
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    // Navigate to customer details
    const navigateToDetails = (id) => {
        navigate(`/customers/${id}`);
    };

    if (isLoading) {
        return <div className="customerlist-loading">{t('common.loading')}...</div>;
    }

    const sortedCustomers = filteredAndSortedCustomers();

    return (
        <div className="customerlist-container">
            <div className="customerlist-header">
                <h1 className="customerlist-title">{t('customer.list.title')}</h1>
                <button
                    className="btn-add"
                    onClick={() => navigate('/customers/add')}
                >
                    {t('customer.list.addNew')}
                </button>
            </div>

            {error && <div className="customerlist-error">{error}</div>}

            <div className="customerlist-search">
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Desktop Table View */}
            <div className="customerlist-table-wrapper desktop-view">
                <table className="customerlist-table">
                    <thead>
                        <tr>
                            <th
                                onClick={() => requestSort('fullName')}
                                className={sortConfig.key === 'fullName' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.fullName')}
                            </th>
                            <th
                                onClick={() => requestSort('phoneNumber')}
                                className={sortConfig.key === 'phoneNumber' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.phoneNumber')}
                            </th>
                            <th
                                onClick={() => requestSort('email')}
                                className={sortConfig.key === 'email' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.email')}
                            </th>
                            <th
                                onClick={() => requestSort('licenseNumber')}
                                className={sortConfig.key === 'licenseNumber' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.licenseNumber')}
                            </th>
                            <th
                                onClick={() => requestSort('dateOfBirth')}
                                className={sortConfig.key === 'dateOfBirth' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.dateOfBirth')}
                            </th>
                            <th
                                onClick={() => requestSort('isBlacklisted')}
                                className={sortConfig.key === 'isBlacklisted' ? `sorted-${sortConfig.direction}` : ''}
                            >
                                {t('customer.fields.isBlacklisted')}
                            </th>
                            <th>{t('customer.list.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCustomers.map((customer) => (
                            <tr
                                key={customer.id}
                                onClick={() => navigateToDetails(customer.id)}
                                className="table-row"
                            >
                                <td>{customer.fullName}</td>
                                <td>{customer.phoneNumber}</td>
                                <td>{customer.email}</td>
                                <td>{customer.licenseNumber}</td>
                                <td>
                                    {new Date(customer.dateOfBirth).toLocaleDateString()}
                                </td>
                                <td>
                                    <span className={`status ${customer.isBlacklisted ? 'blacklisted' : 'not-blacklisted'}`}>
                                        {customer.isBlacklisted
                                            ? t('common.yes')
                                            : t('common.no')}
                                    </span>
                                </td>
                                <td className="customerlist-actions">
                                    <Link
                                        to={`/customers/${customer.id}`}
                                        className="btn-action"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t('common.details')}
                                    </Link>
                                    <Link
                                        to={`/customers/${customer.id}/edit`}
                                        className="btn-action"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t('common.edit')}
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(customer.id, e)}
                                        className="btn-delete"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {sortedCustomers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="no-records">
                                    {searchTerm
                                        ? t('common.noSearchResults')
                                        : t('customer.list.noRecords')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-view">
                {sortedCustomers.length === 0 ? (
                    <div className="no-records-mobile">
                        {searchTerm
                            ? t('common.noSearchResults')
                            : t('customer.list.noRecords')}
                    </div>
                ) : (
                    sortedCustomers.map((customer) => (
                        <div
                            key={customer.id}
                            className="customer-card"
                            onClick={() => navigateToDetails(customer.id)}
                        >
                            <div className="customer-card-header">
                                <h3 className="customer-name">{customer.fullName}</h3>
                                <span className={`status-badge ${customer.isBlacklisted ? 'blacklisted' : 'not-blacklisted'}`}>
                                    {customer.isBlacklisted
                                        ? t('common.blacklisted')
                                        : t('common.active')}
                                </span>
                            </div>

                            <div className="customer-card-body">
                                <div className="customer-info">
                                    <div className="info-item">
                                        <span className="info-label">{t('customer.fields.phoneNumber')}:</span>
                                        <span className="info-value">{customer.phoneNumber}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('customer.fields.email')}:</span>
                                        <span className="info-value">{customer.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('customer.fields.licenseNumber')}:</span>
                                        <span className="info-value">{customer.licenseNumber}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('customer.fields.dateOfBirth')}:</span>
                                        <span className="info-value">
                                            {new Date(customer.dateOfBirth).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="customer-card-actions">
                                <Link
                                    to={`/customers/${customer.id}`}
                                    className="btn-action"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {t('common.details')}
                                </Link>
                                <Link
                                    to={`/customers/${customer.id}/edit`}
                                    className="btn-action"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {t('common.edit')}
                                </Link>
                                <button
                                    onClick={(e) => handleDelete(customer.id, e)}
                                    className="btn-delete"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomersList;