// src/pages/Expenses/Add/ExpenseAdd.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { expenseService } from '../../../services/expenseService';
import './ExpenseAdd.css';

const ExpenseAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const fileInputRef = useRef(null);
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        expense_CategoryId: '',
        agencyId: agencyId || '',
        created_ById: user?.id || ''
    });

    const [categories, setCategories] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // New category modal state
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        agencyId: agencyId || ''
    });

    // Load categories on component mount
    useEffect(() => {
        if (agencyId) {
            loadCategories();
        }
    }, [agencyId]);

    const loadCategories = async () => {
        try {
            const data = await expenseService.getCategoriesByAgencyId(agencyId);
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
            setError(t('expenses.errors.loadCategoriesFailed'));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

        const validFiles = files.filter(file => {
            if (file.size > maxFileSize) {
                setError(t('expenses.errors.fileTooLarge', { filename: file.name }));
                return false;
            }
            if (!allowedTypes.includes(file.type)) {
                setError(t('expenses.errors.invalidFileType', { filename: file.name }));
                return false;
            }
            return true;
        });

        setAttachments(prev => [...prev, ...validFiles]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = t('expenses.validation.titleRequired');
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = t('expenses.validation.amountRequired');
        }

        if (!formData.expense_CategoryId) {
            errors.expense_CategoryId = t('expenses.validation.categoryRequired');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Create the expense
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            const createdExpense = await expenseService.create(expenseData);

            // TODO: Handle file uploads to the created expense
            // This would typically involve a separate API call to upload attachments
            if (attachments.length > 0) {
                console.log('Attachments to upload:', attachments);
                // await expenseService.uploadAttachments(createdExpense.id, attachments);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/expenses');
            }, 2000);

        } catch (error) {
            console.error('Failed to create expense:', error);
            setError(error.response?.data?.message || t('expenses.errors.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();

        if (!newCategory.name.trim()) {
            return;
        }

        try {
            const createdCategory = await expenseService.createCategory(newCategory);
            setCategories(prev => [...prev, createdCategory]);
            setFormData(prev => ({
                ...prev,
                expense_CategoryId: createdCategory.id
            }));
            setNewCategory({ name: '', description: '', agencyId: agencyId || '' });
            setShowNewCategoryModal(false);
        } catch (error) {
            console.error('Failed to create category:', error);
            setError(t('expenses.errors.createCategoryFailed'));
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`expense-add-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="expense-add-header">
                <h1 className="expense-add-title">{t('expenses.add.title')}</h1>
                <p className="expense-add-description">{t('expenses.add.description')}</p>
            </div>

            {error && (
                <div className="error-message">
                    <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('expenses.add.success')}
                </div>
            )}

            <form onSubmit={handleSubmit} className="expense-form">
                <div className="form-section">
                    <h2 className="section-title">{t('expenses.add.basicInfo')}</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="title">{t('expenses.fields.title')} *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={validationErrors.title ? 'has-error' : ''}
                                placeholder={t('expenses.placeholders.title')}
                                disabled={isSubmitting}
                            />
                            {validationErrors.title && (
                                <span className="field-error">{validationErrors.title}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">{t('expenses.fields.amount')} *</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                className={validationErrors.amount ? 'has-error' : ''}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                disabled={isSubmitting}
                            />
                            {validationErrors.amount && (
                                <span className="field-error">{validationErrors.amount}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">{t('expenses.fields.description')}</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={t('expenses.placeholders.description')}
                            rows="3"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="section-title">{t('expenses.add.category')}</h2>

                    <div className="category-section">
                        <div className="form-group">
                            <label htmlFor="expense_CategoryId">{t('expenses.fields.category')} *</label>
                            <div className="category-input-group">
                                <select
                                    id="expense_CategoryId"
                                    name="expense_CategoryId"
                                    value={formData.expense_CategoryId}
                                    onChange={handleInputChange}
                                    className={validationErrors.expense_CategoryId ? 'has-error' : ''}
                                    disabled={isSubmitting}
                                >
                                    <option value="">{t('expenses.placeholders.selectCategory')}</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="add-category-btn"
                                    onClick={() => setShowNewCategoryModal(true)}
                                    disabled={isSubmitting}
                                    title={t('expenses.add.newCategory')}
                                >
                                    <svg viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            {validationErrors.expense_CategoryId && (
                                <span className="field-error">{validationErrors.expense_CategoryId}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="section-title">{t('expenses.add.attachments')}</h2>

                    <div className="attachments-section">
                        <div className="file-upload-area">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                accept="image/*,.pdf,.txt"
                                className="file-input"
                                disabled={isSubmitting}
                            />
                            <div
                                className="file-upload-dropzone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="upload-text">{t('expenses.add.uploadText')}</p>
                                <p className="upload-subtext">{t('expenses.add.uploadSubtext')}</p>
                            </div>
                        </div>

                        {attachments.length > 0 && (
                            <div className="attachments-list">
                                <h3 className="attachments-title">{t('expenses.add.attachedFiles')}</h3>
                                {attachments.map((file, index) => (
                                    <div key={index} className="attachment-item">
                                        <div className="attachment-info">
                                            <svg className="file-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                            <div className="file-details">
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="remove-attachment-btn"
                                            onClick={() => removeAttachment(index)}
                                            disabled={isSubmitting}
                                            title={t('common.remove')}
                                        >
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/expenses')}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="spinner" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="28">
                                        <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite" />
                                    </circle>
                                </svg>
                                {t('common.saving')}
                            </>
                        ) : (
                            t('expenses.add.submit')
                        )}
                    </button>
                </div>
            </form>

            {/* New Category Modal */}
            {showNewCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowNewCategoryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('expenses.add.newCategory')}</h3>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setShowNewCategoryModal(false)}
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="newCategoryName">{t('expenses.fields.categoryName')} *</label>
                                <input
                                    type="text"
                                    id="newCategoryName"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t('expenses.placeholders.categoryName')}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newCategoryDescription">{t('expenses.fields.description')}</label>
                                <textarea
                                    id="newCategoryDescription"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={t('expenses.placeholders.categoryDescription')}
                                    rows="2"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowNewCategoryModal(false)}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!newCategory.name.trim()}
                                >
                                    {t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseAdd;