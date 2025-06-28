// src/pages/Reservation/Details/Modals/CustomerModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import customerService from '../../../../services/customerService';
import './ModalStyles.css';

const CustomerModal = ({ action, customer, onClose, onEditSubmit, onAddSubmit, onRemoveSubmit }) => {
    const { t } = useTranslation();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customer?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(customer || {
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        nationalId: '',
        licenseNumber: ''
    });

    // Fetch customers for add action
    useEffect(() => {
        if (action === 'add') {
            const fetchCustomers = async () => {
                try {
                    setLoading(true);
                    const customerList = await customerService.getAll();
                    setCustomers(customerList);
                } catch (err) {
                    console.error('Error fetching customers:', err);
                    setError(t('customer.errorLoading'));
                } finally {
                    setLoading(false);
                }
            };

            fetchCustomers();
        } else {
            setLoading(false);
        }
    }, [action, t]);

    // Handle form changes for edit action
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle customer selection for add action
    const handleCustomerSelect = (customerId) => {
        setSelectedCustomerId(customerId);
        const selected = customers.find(c => c.id === customerId);
        if (selected) {
            setFormData(selected);
        }
    };

    // Handle search for add action
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter customers based on search term
    const filteredCustomers = customers.filter(c =>
        c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNumber?.includes(searchTerm)
    );

    // Submit handler
    const handleSubmit = (e) => {
        e.preventDefault();

        if (action === 'edit') {
            onEditSubmit(formData);
        } else if (action === 'add') {
            if (!selectedCustomerId) {
                alert(t('customer.add.selectCustomer'));
                return;
            }
            onAddSubmit({
                id: selectedCustomerId,
                ...formData
            });
        } else if (action === 'remove') {
            onRemoveSubmit();
        }
    };

    // Get title based on action
    const getTitle = () => {
        switch (action) {
            case 'edit': return t('customer.edit.title');
            case 'add': return t('customer.add.title');
            case 'remove': return t('customer.remove.title');
            default: return '';
        }
    };

    // Loading state
    if (loading) {
        return (
            <Modal title={getTitle()} onClose={onClose}>
                <div className="modal-loading">
                    {t('common.loading')}
                </div>
            </Modal>
        );
    }

    // Error state
    if (error) {
        return (
            <Modal title={getTitle()} onClose={onClose}>
                <div className="modal-error">
                    {error}
                </div>
            </Modal>
        );
    }

    // Edit customer form
    if (action === 'edit') {
        return (
            <Modal title={getTitle()} onClose={onClose}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="fullName">{t('customer.fields.fullName')}</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">{t('customer.fields.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">{t('customer.fields.phoneNumber')}</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">{t('customer.fields.address')}</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="nationalId">{t('customer.fields.nationalId')}</label>
                        <input
                            type="text"
                            id="nationalId"
                            name="nationalId"
                            value={formData.nationalId || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="licenseNumber">{t('customer.fields.licenseNumber')}</label>
                        <input
                            type="text"
                            id="licenseNumber"
                            name="licenseNumber"
                            value={formData.licenseNumber || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn-submit">
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        );
    }

    // Add customer form
    if (action === 'add') {
        return (
            <Modal title={getTitle()} onClose={onClose}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="searchCustomer">{t('customer.add.search')}</label>
                        <input
                            type="text"
                            id="searchCustomer"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder={t('customer.add.searchPlaceholder')}
                        />
                    </div>

                    <div className="customer-list">
                        {filteredCustomers.length === 0 ? (
                            <div className="no-customers">
                                {t('customer.add.noResults')}
                            </div>
                        ) : (
                            filteredCustomers.map(c => (
                                <div
                                    key={c.id}
                                    className={`customer-item ${selectedCustomerId === c.id ? 'selected' : ''}`}
                                    onClick={() => handleCustomerSelect(c.id)}
                                >
                                    <div className="customer-name">{c.fullName}</div>
                                    <div className="customer-details">
                                        <div>{c.email}</div>
                                        <div>{c.phoneNumber}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={!selectedCustomerId}
                        >
                            {t('customer.add.addToReservation')}
                        </button>
                    </div>
                </form>

                <style jsx>{`
          .customer-list {
            max-height: 300px;
            overflow-y: auto;
            margin: 1rem 0;
            border: 1px solid var(--border-color, #eee);
            border-radius: 8px;
          }
          
          .no-customers {
            padding: 1rem;
            text-align: center;
            color: var(--text-secondary, #666);
          }
          
          .customer-item {
            padding: 0.75rem;
            border-bottom: 1px solid var(--border-color, #eee);
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .customer-item:last-child {
            border-bottom: none;
          }
          
          .customer-item:hover {
            background-color: var(--highlight-bg, #f5f5f5);
          }
          
          .customer-item.selected {
            background-color: var(--primary-light, #e3f2fd);
          }
          
          .customer-name {
            font-weight: 500;
            margin-bottom: 0.25rem;
          }
          
          .customer-details {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: var(--text-secondary, #666);
          }
        `}</style>
            </Modal>
        );
    }

    // Remove customer confirmation
    if (action === 'remove') {
        return (
            <Modal title={getTitle()} onClose={onClose}>
                <div className="modal-content">
                    <div className="warning-message">
                        <i className="warning-icon">⚠️</i>
                        <p>{t('customer.remove.warning')}</p>
                    </div>

                    <p>{t('customer.remove.confirmText', { name: customer?.fullName })}</p>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            className="btn-delete"
                            onClick={handleSubmit}
                        >
                            {t('customer.remove.confirm')}
                        </button>
                    </div>
                </div>

                <style jsx>{`
          .modal-content {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          
          .warning-message {
            display: flex;
            align-items: center;
            gap: 1rem;
            background-color: var(--warning-light, #fff8e1);
            padding: 1rem;
            border-radius: 8px;
            color: var(--warning, #ffa000);
          }
          
          .warning-icon {
            font-size: 1.5rem;
          }
          
          .btn-delete {
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            background-color: var(--warning, #ffa000);
            border: none;
            color: white;
            transition: all 0.2s ease;
          }
          
          .btn-delete:hover {
            background-color: var(--warning-dark, #ff8f00);
          }
        `}</style>
            </Modal>
        );
    }

    return null;
};

export default CustomerModal;