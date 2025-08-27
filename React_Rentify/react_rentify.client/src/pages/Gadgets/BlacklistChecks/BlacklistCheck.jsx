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

    // Step state
    const [currentStep, setCurrentStep] = useState(1); // 1: Search Form, 2: Results

    // Search state
    const [searchResults, setSearchResults] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);
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

            // If results found, get unique agencies for contact information
            if (results.length > 0) {
                const uniqueAgencyIds = [...new Set(results.map(r => r.reportedByAgencyId))];
                const agencyPromises = uniqueAgencyIds.map(id =>
                    agencyService.getById(id)
                );
                const agencyData = await Promise.all(agencyPromises);
                setAgencies(agencyData);
            }

            // Move to results step
            setCurrentStep(2);

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
        setError('');
        setExpandedResult(null);
        setCurrentStep(1); // Return to search form
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
            {/* Step Indicator */}
            <div className="step-indicator">
                <div className={`step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">{t('blacklistCheck.steps.search')}</div>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">{t('blacklistCheck.steps.results')}</div>
                </div>
            </div>

            {/* Header Section - Always visible */}
            <div className="blacklist-check-header">
                <h1 className="blacklist-check-title">
                    <svg className="title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {t('blacklistCheck.title')}
                </h1>
                <p className="blacklist-check-description">
                    {t('blacklistCheck.description')}
                </p>
            </div>

            {/* Step 1: Search Form */}
            {currentStep === 1 && (
                <div className="search-blacklist-form-container">
                    <form onSubmit={handleSearch} className="search-blacklist-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="fullName">
                                    <svg className="label-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
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
                                    <svg className="label-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="16" rx="2" />
                                        <path d="M7 9h10" />
                                        <path d="M7 13h10" />
                                        <path d="M7 17h4" />
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
                                    <svg className="label-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="18" rx="2" />
                                        <circle cx="12" cy="10" r="3" />
                                        <path d="M12 13a5 5 0 0 0-5 5" />
                                        <path d="M12 13a5 5 0 0 1 5 5" />
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
                                    <svg className="label-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path d="M7 9h10" />
                                        <path d="M7 13h6" />
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

                        {error && (
                            <div className="error-message">
                                <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <svg className="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v2" />
                                        </svg>
                                        {t('blacklistCheck.searching')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        {t('blacklistCheck.search')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 2: Results */}
            {currentStep === 2 && (
                <div className="results-container">
                    {/* Results Header */}
                    <div className="results-header">
                        <h2 className="results-title">
                            <svg className="results-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {t('blacklistCheck.resultsTitle')}
                        </h2>
                        <span className="results-count">
                            {searchResults.length} {t('blacklistCheck.resultsFound')}
                        </span>
                    </div>

                    {/* Results Warning */}
                    {searchResults.length > 0 && (
                        <div className="results-warning">
                            <svg className="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <div>
                                <h3>{t('blacklistCheck.warningTitle')}</h3>
                                <p>{t('blacklistCheck.warningMessage')}</p>
                            </div>
                        </div>
                    )}

                    {/* No Results */}
                    {searchResults.length === 0 && (
                        <div className="no-results">
                            <svg className="no-results-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <h3>{t('blacklistCheck.noResultsTitle')}</h3>
                            <p>{t('blacklistCheck.noResultsMessage')}</p>
                        </div>
                    )}

                    {/* Results List */}
                    {searchResults.length > 0 && (
                        <div className="results-list">
                            {searchResults.map((result) => (
                                <div key={result.id} className="result-item">
                                    <div className="result-header" onClick={() => toggleResultExpansion(result.id)}>
                                        <div className="result-info">
                                            <h3 className="result-name">{result.fullName}</h3>
                                            <div className="result-meta">
                                                <span className="result-date">
                                                    <svg className="meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    {formatDate(result.dateAdded)}
                                                </span>
                                                <span className="result-agency">
                                                    <svg className="meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                        <polyline points="9 22 9 12 15 12 15 22" />
                                                    </svg>
                                                    {getAgencyName(result.reportedByAgencyId)}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="mobile-expand-btn" onClick={(e) => { e.stopPropagation(); toggleResultExpansion(result.id); }}>
                                            <svg
                                                className={`expand-icon ${expandedResult === result.id ? 'expanded' : ''}`}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className={`result-details ${expandedResult === result.id ? 'expanded' : ''}`}>
                                        <div className="details-grid">
                                            {result.nationalId && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.details.nationalId')}</span>
                                                    <span className="detail-value">{result.nationalId}</span>
                                                </div>
                                            )}
                                            {result.passportId && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.details.passportId')}</span>
                                                    <span className="detail-value">{result.passportId}</span>
                                                </div>
                                            )}
                                            {result.licenseNumber && (
                                                <div className="detail-item">
                                                    <span className="detail-label">{t('blacklistCheck.details.licenseNumber')}</span>
                                                    <span className="detail-value">{result.licenseNumber}</span>
                                                </div>
                                            )}
                                            <div className="detail-item">
                                                <span className="detail-label">{t('blacklistCheck.details.reason')}</span>
                                                <span className="detail-value reason">{result.reason}</span>
                                            </div>
                                        </div>

                                        <div className="result-actions">
                                            {agencies.find(a => a.id === result.reportedByAgencyId) && (
                                                <button
                                                    className="contact-btn"
                                                    onClick={() => handleContactAgency(agencies.find(a => a.id === result.reportedByAgencyId))}
                                                >
                                                    <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                        <polyline points="22,6 12,13 2,6" />
                                                    </svg>
                                                    {t('blacklistCheck.contactAgency')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="results-actions">
                        <button type="button" className="btn-secondary" onClick={handleClearSearch}>
                            <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            {t('blacklistCheck.newSearch')}
                        </button>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && selectedAgency && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="agency-name">{selectedAgency.name}</h3>
                            <button className="modal-close" onClick={() => setShowContactModal(false)}>
                                <svg className="close-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="contact-grid">
                                {selectedAgency.email && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                            {t('blacklistCheck.contact.email')}
                                        </span>
                                        <div className="contact-value">
                                            <span className="contact-text">{selectedAgency.email}</span>
                                            <button
                                                className="contact-action"
                                                onClick={() => handleEmailContact(selectedAgency.email, t('blacklistCheck.contact.emailSubject'))}
                                            >
                                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {selectedAgency.phoneOne && (
                                    <div className="contact-item">
                                        <span className="contact-label">
                                            <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            {t('blacklistCheck.contact.phone')}
                                        </span>
                                        <div className="contact-value">
                                            <span className="contact-text">{selectedAgency.phoneOne}</span>
                                            <button
                                                className="contact-action"
                                                onClick={() => handlePhoneContact(selectedAgency.phoneOne)}
                                            >
                                                <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {selectedAgency.address && (
                                    <div className="contact-item full-width">
                                        <span className="contact-label">
                                            <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {t('blacklistCheck.contact.address')}
                                        </span>
                                        <div className="contact-value">
                                            <span className="contact-text">{selectedAgency.address}</span>
                                        </div>
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