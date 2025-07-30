import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { blacklistService } from '../../../services/blacklistService';
import { agencyService } from '../../../services/agencyService';
import './BlacklistCheck.css';

const BlacklistCheck = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        cin: '',
        passport: '',
        driveLicense: ''
    });

    // Search state
    const [searchResults, setSearchResults] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState('');

    // Contact modal state
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState(null);

    // Mobile-specific state
    const [expandedResult, setExpandedResult] = useState(null);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    // Validate form - at least one field must be filled
    const validateForm = () => {
        const { fullName, cin, passport, driveLicense } = formData;
        return fullName.trim() || cin.trim() || passport.trim() || driveLicense.trim();
    };

    // Handle search submission
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setError(t('blacklistCheck.validation.atLeastOne'));
            return;
        }

        setLoading(true);
        setError('');
        setSearchResults([]);
        setAgencies([]);

        try {
            // Search blacklist entries
            const results = await blacklistService.search({
                nationalId: formData.cin,
                passportId: formData.passport,
                licenseNumber: formData.driveLicense
            });

            setSearchResults(results);
            setHasSearched(true);

            // If results found, get unique agencies for contact information
            if (results.length > 0) {
                const uniqueAgencyIds = [...new Set(results.map(r => r.reportedByAgencyId))];
                const agencyPromises = uniqueAgencyIds.map(id =>
                    agencyService.getById(id));
                const agencyData = await Promise.all(agencyPromises);
                setAgencies(agencyData);
            }

        } catch (err) {
            console.error('Search error:', err);
            setError(t('blacklistCheck.errors.searchFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Handle contact agency
    const handleContactAgency = (agency) => {
        setSelectedAgency(agency);
        setShowContactModal(true);
    };

    // Handle email contact
    const handleEmailContact = (email, subject) => {
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        window.open(mailtoLink, '_blank');
    };

    // Handle phone contact
    const handlePhoneContact = (phone) => {
        window.open(`tel:${phone}`, '_blank');
    };

    // Clear search results and form
    const handleClearSearch = () => {
        setFormData({
            fullName: '',
            cin: '',
            passport: '',
            driveLicense: ''
        });
        setSearchResults([]);
        setAgencies([]);
        setHasSearched(false);
        setError('');
        setExpandedResult(null);
    };

    // Toggle mobile result expansion
    const toggleResultExpansion = (resultId) => {
        setExpandedResult(expandedResult === resultId ? null : resultId);
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Get agency name by ID
    const getAgencyName = (agencyId) => {
        const agency = agencies.find(a => a.id === agencyId);
        return agency ? agency.name : t('blacklistCheck.unknownAgency');
    };

    return (
        <div className={`blacklist-check-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="blacklist-check-header">
                <h1 className="blacklist-check-title">
                    <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('blacklistCheck.title')}
                </h1>
                <p className="blacklist-check-description">
                    {t('blacklistCheck.description')}
                </p>
            </div>

            {/* Search Form */}
            <div className="search-form-container">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="fullName">
                                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {t('blacklistCheck.fields.fullName')}
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder={t('blacklistCheck.placeholders.fullName')}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="cin">
                                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                {t('blacklistCheck.fields.cin')}
                            </label>
                            <input
                                type="text"
                                id="cin"
                                name="cin"
                                value={formData.cin}
                                onChange={handleInputChange}
                                placeholder={t('blacklistCheck.placeholders.cin')}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passport">
                                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('blacklistCheck.fields.passport')}
                            </label>
                            <input
                                type="text"
                                id="passport"
                                name="passport"
                                value={formData.passport}
                                onChange={handleInputChange}
                                placeholder={t('blacklistCheck.placeholders.passport')}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="driveLicense">
                                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('blacklistCheck.fields.driveLicense')}
                            </label>
                            <input
                                type="text"
                                id="driveLicense"
                                name="driveLicense"
                                value={formData.driveLicense}
                                onChange={handleInputChange}
                                placeholder={t('blacklistCheck.placeholders.driveLicense')}
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? (
                                <>
                                    <svg className="loading-spinner" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                                            <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                                        </circle>
                                    </svg>
                                    {t('blacklistCheck.searching')}
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    {t('blacklistCheck.search')}
                                </>
                            )}
                        </button>

                        {hasSearched && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="btn-secondary"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                {t('blacklistCheck.clear')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Search Results */}
            {hasSearched && (
                <div className="search-results-container">
                    <div className="results-header">
                        <h2 className="results-title">
                            <svg className="results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {t('blacklistCheck.results.title')}
                        </h2>
                        <div className="results-count">
                            {searchResults.length} {t('blacklistCheck.results.found')}
                        </div>
                    </div>

                    {searchResults.length === 0 ? (
                        <div className="no-results">
                            <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3>{t('blacklistCheck.results.noResults')}</h3>
                            <p>{t('blacklistCheck.results.noResultsDesc')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="results-warning">
                                <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <h3>{t('blacklistCheck.results.warning')}</h3>
                                    <p>{t('blacklistCheck.results.warningDesc')}</p>
                                </div>
                            </div>

                            <div className="results-list">
                                {searchResults.map((result, index) => (
                                    <div key={result.id || index} className="result-item">
                                        <div className="result-header" onClick={() => toggleResultExpansion(result.id)}>
                                            <div className="result-info">
                                                <h4 className="result-name">{result.fullName}</h4>
                                                <div className="result-meta">
                                                    <span className="result-date">
                                                        <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12,6 12,12 16,14" />
                                                        </svg>
                                                        {formatDate(result.dateAdded)}
                                                    </span>
                                                    <span className="result-agency">
                                                        <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {getAgencyName(result.reportedByAgencyId)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="mobile-expand-btn">
                                                <svg className={`expand-icon ${expandedResult === result.id ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <polyline points="6,9 12,15 18,9" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className={`result-details ${expandedResult === result.id ? 'expanded' : ''}`}>
                                            <div className="details-grid">
                                                {result.nationalId && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">
                                                            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                            </svg>
                                                            {t('blacklistCheck.fields.cin')}
                                                        </span>
                                                        <span className="detail-value">{result.nationalId}</span>
                                                    </div>
                                                )}

                                                {result.passportId && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">
                                                            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            {t('blacklistCheck.fields.passport')}
                                                        </span>
                                                        <span className="detail-value">{result.passportId}</span>
                                                    </div>
                                                )}

                                                {result.licenseNumber && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">
                                                            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            {t('blacklistCheck.fields.driveLicense')}
                                                        </span>
                                                        <span className="detail-value">{result.licenseNumber}</span>
                                                    </div>
                                                )}

                                                <div className="detail-item reason">
                                                    <span className="detail-label">
                                                        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {t('blacklistCheck.fields.reason')}
                                                    </span>
                                                    <span className="detail-value">{result.reason}</span>
                                                </div>
                                            </div>

                                            <div className="result-actions">
                                                <button
                                                    onClick={() => {
                                                        const agency = agencies.find(a => a.id === result.reportedByAgencyId);
                                                        if (agency) handleContactAgency(agency);
                                                    }}
                                                    className="btn-contact"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {t('blacklistCheck.contact')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && selectedAgency && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <svg className="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {t('blacklistCheck.contactAgency')}
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowContactModal(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-content">
                            <h4 className="agency-name">{selectedAgency.name}</h4>

                            <div className="contact-info">
                                {selectedAgency.email && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {t('blacklistCheck.email')}
                                        </span>
                                        <button
                                            className="contact-btn email-btn"
                                            onClick={() => handleEmailContact(
                                                selectedAgency.email,
                                                t('blacklistCheck.emailSubject')
                                            )}
                                        >
                                            {selectedAgency.email}
                                        </button>
                                    </div>
                                )}

                                {selectedAgency.phoneOne && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {t('blacklistCheck.phone')}
                                        </span>
                                        <button
                                            className="contact-btn phone-btn"
                                            onClick={() => handlePhoneContact(selectedAgency.phoneOne)}
                                        >
                                            {selectedAgency.phoneOne}
                                        </button>
                                    </div>
                                )}

                                {selectedAgency.phoneTwo && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {t('blacklistCheck.phone')} 2
                                        </span>
                                        <button
                                            className="contact-btn phone-btn"
                                            onClick={() => handlePhoneContact(selectedAgency.phoneTwo)}
                                        >
                                            {selectedAgency.phoneTwo}
                                        </button>
                                    </div>
                                )}

                                {selectedAgency.address && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {t('blacklistCheck.address')}
                                        </span>
                                        <span className="contact-text">{selectedAgency.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlacklistCheck;