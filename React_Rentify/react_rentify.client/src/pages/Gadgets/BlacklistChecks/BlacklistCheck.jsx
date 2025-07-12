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
                const agencyPromises = uniqueAgencyIds.map(id => agencyService.getById(id));
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
    };

    return (
        <div className={`blacklist-check-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="blacklist-check-header">
                <h1 className="blacklist-check-title">{t('blacklistCheck.title')}</h1>
                <p className="blacklist-check-description">{t('blacklistCheck.description')}</p>
            </div>

            {/* Search Form */}
            <div className="search-form-container">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="fullName">{t('blacklistCheck.fields.fullName')}</label>
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
                            <label htmlFor="cin">{t('blacklistCheck.fields.cin')}</label>
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
                            <label htmlFor="passport">{t('blacklistCheck.fields.passport')}</label>
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
                            <label htmlFor="driveLicense">{t('blacklistCheck.fields.driveLicense')}</label>
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

                    {error && (
                        <div className="error-message">
                            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            {t('common.clear')}
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !validateForm()}
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
                                t('blacklistCheck.search')
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Search Results */}
            {hasSearched && (
                <div className="search-results-container">
                    <h2 className="results-title">{t('blacklistCheck.results.title')}</h2>

                    {searchResults.length === 0 ? (
                        <div className="no-results">
                            <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <h3>{t('blacklistCheck.results.noMatches')}</h3>
                            <p>{t('blacklistCheck.results.noMatchesDescription')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="results-warning">
                                <svg className="warning-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3>{t('blacklistCheck.results.foundMatches', { count: searchResults.length })}</h3>
                                    <p>{t('blacklistCheck.results.foundMatchesDescription')}</p>
                                </div>
                            </div>

                            <div className="results-list">
                                {searchResults.map((result, index) => (
                                    <div key={result.id} className="result-item">
                                        <div className="result-header">
                                            <div className="result-info">
                                                <h4 className="result-name">{result.fullName}</h4>
                                                <span className="result-date">
                                                    {t('blacklistCheck.results.addedOn')}: {new Date(result.dateAdded).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="result-agency">
                                                {t('blacklistCheck.results.reportedBy')}: {result.reportedByAgencyName}
                                            </div>
                                        </div>

                                        <div className="result-details">
                                            {result.nationalId && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.fields.cin')}:</span>
                                                    <span className="detail-value">{result.nationalId}</span>
                                                </div>
                                            )}
                                            {result.passportId && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.fields.passport')}:</span>
                                                    <span className="detail-value">{result.passportId}</span>
                                                </div>
                                            )}
                                            {result.licenseNumber && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.fields.driveLicense')}:</span>
                                                    <span className="detail-value">{result.licenseNumber}</span>
                                                </div>
                                            )}
                                            {result.reason && (
                                                <div className="detail-item reason">
                                                    <span className="detail-label">{t('blacklistCheck.fields.reason')}:</span>
                                                    <span className="detail-value">{result.reason}</span>
                                                </div>
                                            )}
                                        </div>

                                        {agencies.find(a => a.id === result.reportedByAgencyId) && (
                                            <div className="result-actions">
                                                <button
                                                    onClick={() => handleContactAgency(agencies.find(a => a.id === result.reportedByAgencyId))}
                                                    className="btn-contact"
                                                >
                                                    <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {t('blacklistCheck.contactAgency')}
                                                </button>
                                            </div>
                                        )}
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {t('blacklistCheck.contactModal.title')} {selectedAgency.name}
                            </h3>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="modal-close"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="contact-methods">
                                {selectedAgency.email && (
                                    <div className="contact-method">
                                        <div className="contact-info">
                                            <svg className="contact-method-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{selectedAgency.email}</span>
                                        </div>
                                        <button
                                            onClick={() => handleEmailContact(
                                                selectedAgency.email,
                                                t('blacklistCheck.contactModal.emailSubject')
                                            )}
                                            className="btn-contact-method"
                                        >
                                            {t('blacklistCheck.contactModal.sendEmail')}
                                        </button>
                                    </div>
                                )}

                                {selectedAgency.phoneOne && (
                                    <div className="contact-method">
                                        <div className="contact-info">
                                            <svg className="contact-method-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{selectedAgency.phoneOne}</span>
                                        </div>
                                        <button
                                            onClick={() => handlePhoneContact(selectedAgency.phoneOne)}
                                            className="btn-contact-method"
                                        >
                                            {t('blacklistCheck.contactModal.call')}
                                        </button>
                                    </div>
                                )}

                                {selectedAgency.phoneTwo && (
                                    <div className="contact-method">
                                        <div className="contact-info">
                                            <svg className="contact-method-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{selectedAgency.phoneTwo}</span>
                                        </div>
                                        <button
                                            onClick={() => handlePhoneContact(selectedAgency.phoneTwo)}
                                            className="btn-contact-method"
                                        >
                                            {t('blacklistCheck.contactModal.call')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {selectedAgency.address && (
                                <div className="agency-address">
                                    <h4>{t('blacklistCheck.contactModal.address')}</h4>
                                    <p>{selectedAgency.address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlacklistCheck;