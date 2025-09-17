// src/components/legal/UseTerms.jsx
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import './UseTerms.css';

const UseTerms = ({
    className = '',
    showAsModal = false,
    onClose = null,
    showLastUpdated = true
}) => {
    const { t, i18n } = useTranslation();
    const { isDarkMode } = useTheme();
    const [activeSection, setActiveSection] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    // Animation on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Handle section navigation
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(sectionId);
        }
    };

    // Close modal handler
    const handleModalClose = () => {
        if (onClose) {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }
    };

    const sections = [
        { id: 'acceptance', key: 'terms.sections.acceptance' },
        { id: 'description', key: 'terms.sections.description' },
        { id: 'accounts', key: 'terms.sections.accounts' },
        { id: 'acceptable-use', key: 'terms.sections.acceptableUse' },
        { id: 'identity-verification', key: 'terms.sections.identityVerification' },
        { id: 'gps-tracking', key: 'terms.sections.gpsTracking' },
        { id: 'data-privacy', key: 'terms.sections.dataPrivacy' },
        { id: 'payments', key: 'terms.sections.payments' },
        { id: 'intellectual-property', key: 'terms.sections.intellectualProperty' },
        { id: 'suspension', key: 'terms.sections.suspension' },
        { id: 'liability', key: 'terms.sections.liability' },
        { id: 'changes', key: 'terms.sections.changes' },
        { id: 'governing-law', key: 'terms.sections.governingLaw' }
    ];

    const containerClasses = [
        'use-terms-container',
        isDarkMode ? 'dark' : '',
        isVisible ? 'visible' : '',
        showAsModal ? 'modal' : '',
        className
    ].filter(Boolean).join(' ');

    const content = (
        <div className={containerClasses}>
            {/* Header */}
            <header className="use-terms-header">
                <div className="header-content">
                    <h1 className="terms-title">
                        {t('terms.title')}
                    </h1>
                    {showLastUpdated && (
                        <div className="terms-meta">
                            <span className="effective-date">
                                {t('terms.effectiveDate')}: {t('terms.lastUpdated')}
                            </span>
                            <span className="location">
                                {t('terms.location')}: {t('terms.morocco')}
                            </span>
                        </div>
                    )}
                    {showAsModal && (
                        <button
                            className="modal-close-btn"
                            onClick={handleModalClose}
                            aria-label={t('common.close')}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            <div className="use-terms-content">
                {/* Table of Contents */}
                <nav className="terms-toc" aria-label={t('terms.tableOfContents')}>
                    <h2 className="toc-title">{t('terms.tableOfContents')}</h2>
                    <ul className="toc-list">
                        {sections.map((section, index) => (
                            <li key={section.id} className="toc-item">
                                <button
                                    className={`toc-link ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={() => scrollToSection(section.id)}
                                    type="button"
                                >
                                    <span className="toc-number">{index + 1}.</span>
                                    <span className="toc-text">{t(section.key)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Main Content */}
                <main className="terms-main">
                    {/* Section 1: Acceptance of Terms */}
                    <section id="acceptance" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">1.</span>
                            {t('terms.sections.acceptance')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.acceptance.intro')}</p>
                        </div>
                    </section>

                    {/* Section 2: Service Description */}
                    <section id="description" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">2.</span>
                            {t('terms.sections.description')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.description.intro')}</p>
                            <ul className="feature-list">
                                <li>{t('terms.content.description.features.reservations')}</li>
                                <li>{t('terms.content.description.features.onboarding')}</li>
                                <li>{t('terms.content.description.features.gpsManagement')}</li>
                                <li>{t('terms.content.description.features.financial')}</li>
                                <li>{t('terms.content.description.features.administration')}</li>
                                <li>{t('terms.content.description.features.fraud')}</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: User Accounts */}
                    <section id="accounts" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">3.</span>
                            {t('terms.sections.accounts')}
                        </h2>
                        <div className="section-content">
                            <div className="subsection">
                                <h3 className="subsection-title">{t('terms.content.accounts.registration.title')}</h3>
                                <p>{t('terms.content.accounts.registration.content')}</p>
                            </div>
                            <div className="subsection">
                                <h3 className="subsection-title">{t('terms.content.accounts.authentication.title')}</h3>
                                <p>{t('terms.content.accounts.authentication.content')}</p>
                            </div>
                            <div className="subsection">
                                <h3 className="subsection-title">{t('terms.content.accounts.roles.title')}</h3>
                                <p>{t('terms.content.accounts.roles.content')}</p>
                            </div>
                            <div className="subsection">
                                <h3 className="subsection-title">{t('terms.content.accounts.sharing.title')}</h3>
                                <p>{t('terms.content.accounts.sharing.content')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Acceptable Use */}
                    <section id="acceptable-use" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">4.</span>
                            {t('terms.sections.acceptableUse')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.acceptableUse.intro')}</p>
                            <ul className="prohibition-list">
                                <li>{t('terms.content.acceptableUse.prohibitions.unlawful')}</li>
                                <li>{t('terms.content.acceptableUse.prohibitions.bypass')}</li>
                                <li>{t('terms.content.acceptableUse.prohibitions.malicious')}</li>
                                <li>{t('terms.content.acceptableUse.prohibitions.blacklist')}</li>
                                <li>{t('terms.content.acceptableUse.prohibitions.tracking')}</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 5: Identity Verification */}
                    <section id="identity-verification" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">5.</span>
                            {t('terms.sections.identityVerification')}
                        </h2>
                        <div className="section-content">
                            <div className="highlight-box">
                                <p>{t('terms.content.identityVerification.integration')}</p>
                                <p>{t('terms.content.identityVerification.consent')}</p>
                                <p>{t('terms.content.identityVerification.alternatives')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: GPS Tracking */}
                    <section id="gps-tracking" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">6.</span>
                            {t('terms.sections.gpsTracking')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.gpsTracking.connection')}</p>
                            <div className="warning-box">
                                <p>{t('terms.content.gpsTracking.compliance')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7: Data & Privacy */}
                    <section id="data-privacy" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">7.</span>
                            {t('terms.sections.dataPrivacy')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.dataPrivacy.processing')}</p>
                            <p>{t('terms.content.dataPrivacy.controllers')}</p>
                            <p>{t('terms.content.dataPrivacy.processor')}</p>
                        </div>
                    </section>

                    {/* Section 8: Payments & Invoices */}
                    <section id="payments" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">8.</span>
                            {t('terms.sections.payments')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.payments.generation')}</p>
                            <p>{t('terms.content.payments.compliance')}</p>
                            <p>{t('terms.content.payments.guarantor')}</p>
                        </div>
                    </section>

                    {/* Section 9: Intellectual Property */}
                    <section id="intellectual-property" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">9.</span>
                            {t('terms.sections.intellectualProperty')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.intellectualProperty.protection')}</p>
                            <p>{t('terms.content.intellectualProperty.prohibition')}</p>
                        </div>
                    </section>

                    {/* Section 10: Suspension & Termination */}
                    <section id="suspension" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">10.</span>
                            {t('terms.sections.suspension')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.suspension.intro')}</p>
                            <ul>
                                <li>{t('terms.content.suspension.reasons.violation')}</li>
                                <li>{t('terms.content.suspension.reasons.misuse')}</li>
                                <li>{t('terms.content.suspension.reasons.legal')}</li>
                            </ul>
                            <p>{t('terms.content.suspension.agencies')}</p>
                        </div>
                    </section>

                    {/* Section 11: Limitation of Liability */}
                    <section id="liability" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">11.</span>
                            {t('terms.sections.liability')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.liability.asIs')}</p>
                            <div className="liability-list">
                                <h4>{t('terms.content.liability.notLiableFor.title')}</h4>
                                <ul>
                                    <li>{t('terms.content.liability.notLiableFor.technical')}</li>
                                    <li>{t('terms.content.liability.notLiableFor.actions')}</li>
                                    <li>{t('terms.content.liability.notLiableFor.damages')}</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 12: Changes to Terms */}
                    <section id="changes" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">12.</span>
                            {t('terms.sections.changes')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.changes.modification')}</p>
                            <p>{t('terms.content.changes.acceptance')}</p>
                        </div>
                    </section>

                    {/* Section 13: Governing Law & Jurisdiction */}
                    <section id="governing-law" className="terms-section">
                        <h2 className="section-title">
                            <span className="section-number">13.</span>
                            {t('terms.sections.governingLaw')}
                        </h2>
                        <div className="section-content">
                            <p>{t('terms.content.governingLaw.moroccanLaw')}</p>
                            <p>{t('terms.content.governingLaw.jurisdiction')}</p>
                        </div>
                    </section>
                </main>
            </div>

            {/* Footer */}
            {showAsModal && (
                <footer className="terms-footer">
                    <div className="footer-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleModalClose}
                        >
                            {t('terms.actions.accept')}
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );

    if (showAsModal) {
        return (
            <div className="terms-modal-overlay" onClick={handleModalClose}>
                <div className="terms-modal-container" onClick={(e) => e.stopPropagation()}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default UseTerms;