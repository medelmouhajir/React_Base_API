// src/pages/Legal/PrivacyPolicy.jsx
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
// Custom SVG Icons
const ArrowLeft = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
    </svg>
);

const Shield = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-8 7.5s-8-2.5-8-7.5c0-10 8-12 8-12s8 2 8 12" />
    </svg>
);

const Eye = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const Database = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="m21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const Lock = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="m7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const UserCheck = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16,11 18,13 22,9" />
    </svg>
);

const Mail = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const MapPin = ({ size = 20, className = '' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    useRtlDirection();

    const handleGoBack = () => {
        navigate(-1);
    };

    const Section = ({ icon: Icon, titleKey, children, id }) => (
        <section className="privacy-section" id={id}>
            <div className="privacy-section-header">
                <div className="privacy-section-icon">
                    <Icon size={20} />
                </div>
                <h2 className="privacy-section-title">
                    {t(titleKey)}
                </h2>
            </div>
            <div className="privacy-section-content">
                {children}
            </div>
        </section>
    );

    const SubSection = ({ titleKey, children, className = '' }) => (
        <div className={`privacy-subsection ${className}`}>
            <h3 className="privacy-subsection-title">
                {t(titleKey)}
            </h3>
            <div className="privacy-subsection-content">
                {children}
            </div>
        </div>
    );

    const DataItem = ({ icon: Icon, titleKey, items }) => (
        <div className="privacy-data-item">
            <div className="privacy-data-header">
                <Icon size={16} className="privacy-data-icon" />
                <span className="privacy-data-title">{t(titleKey)}</span>
            </div>
            <ul className="privacy-data-list">
                {items.map((item, index) => (
                    <li key={index} className="privacy-data-list-item">
                        {t(item)}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className={`privacy-policy-page ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="privacy-header">
                <div className="privacy-header-container">
                    <button
                        onClick={handleGoBack}
                        className="privacy-back-button"
                        aria-label={t('common.goBack')}
                    >
                        <ArrowLeft size={20} />
                        <span className="privacy-back-text">{t('common.back')}</span>
                    </button>

                    <div className="privacy-header-content">
                        <div className="privacy-header-icon">
                            <Shield size={32} />
                        </div>
                        <div className="privacy-header-text">
                            <h1 className="privacy-title">
                                {t('privacy.title')}
                            </h1>
                            <p className="privacy-subtitle">
                                {t('privacy.subtitle')}
                            </p>
                            <div className="privacy-meta">
                                <span className="privacy-effective-date">
                                    {t('privacy.effectiveDate')}: {t('privacy.effectiveDateValue')}
                                </span>
                                <span className="privacy-location">
                                    {t('privacy.location')}: {t('privacy.locationValue')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="privacy-nav">
                <div className="privacy-nav-container">
                    <div className="privacy-nav-content">
                        <span className="privacy-nav-title">{t('privacy.quickNavigation')}</span>
                        <div className="privacy-nav-links">
                            {[
                                'introduction',
                                'informationWeCollect',
                                'aiDocumentScanning',
                                'howWeUseYourInfo',
                                'dataSharing',
                                'dataStorage',
                                'dataRetention',
                                'yourRights',
                                'cookies',
                                'thirdPartyServices',
                                'children',
                                'changes',
                                'contact'
                            ].map((section) => (
                                <a
                                    key={section}
                                    href={`#${section}`}
                                    className="privacy-nav-link"
                                >
                                    {t(`privacy.sections.${section}.title`)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="privacy-content">
                <div className="privacy-content-container">
                    {/* Introduction */}
                    <Section icon={Shield} titleKey="privacy.sections.introduction.title" id="introduction">
                        <p>{t('privacy.sections.introduction.content')}</p>
                    </Section>

                    {/* Information We Collect */}
                    <Section icon={Database} titleKey="privacy.sections.informationWeCollect.title" id="informationWeCollect">
                        <p>{t('privacy.sections.informationWeCollect.intro')}</p>

                        <div className="privacy-data-categories">
                            <DataItem
                                icon={UserCheck}
                                titleKey="privacy.sections.informationWeCollect.customerInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.customerInfo.fullName',
                                    'privacy.sections.informationWeCollect.customerInfo.contact',
                                    'privacy.sections.informationWeCollect.customerInfo.identification',
                                    'privacy.sections.informationWeCollect.customerInfo.dateOfBirth'
                                ]}
                            />

                            <DataItem
                                icon={MapPin}
                                titleKey="privacy.sections.informationWeCollect.agencyInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.agencyInfo.details',
                                    'privacy.sections.informationWeCollect.agencyInfo.staffInfo'
                                ]}
                            />

                            <DataItem
                                icon={Database}
                                titleKey="privacy.sections.informationWeCollect.reservationInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.reservationInfo.records',
                                    'privacy.sections.informationWeCollect.reservationInfo.invoices'
                                ]}
                            />

                            <DataItem
                                icon={MapPin}
                                titleKey="privacy.sections.informationWeCollect.gpsInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.gpsInfo.identifiers',
                                    'privacy.sections.informationWeCollect.gpsInfo.vehicleDetails'
                                ]}
                            />

                            <DataItem
                                icon={Lock}
                                titleKey="privacy.sections.informationWeCollect.securityInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.securityInfo.blacklist',
                                    'privacy.sections.informationWeCollect.securityInfo.authentication'
                                ]}
                            />

                            <DataItem
                                icon={Eye}
                                titleKey="privacy.sections.informationWeCollect.technicalInfo.title"
                                items={[
                                    'privacy.sections.informationWeCollect.technicalInfo.ipAddress',
                                    'privacy.sections.informationWeCollect.technicalInfo.deviceInfo'
                                ]}
                            />
                        </div>
                    </Section>

                    {/* AI Document Scanning */}
                    <Section icon={Eye} titleKey="privacy.sections.aiDocumentScanning.title" id="aiDocumentScanning">
                        <div className="privacy-ai-section">
                            <p>{t('privacy.sections.aiDocumentScanning.intro')}</p>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.whatWeSend.title">
                                <ul>
                                    <li>{t('privacy.sections.aiDocumentScanning.whatWeSend.images')}</li>
                                    <li>{t('privacy.sections.aiDocumentScanning.whatWeSend.metadata')}</li>
                                </ul>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.purpose.title">
                                <ul>
                                    <li>{t('privacy.sections.aiDocumentScanning.purpose.extraction')}</li>
                                    <li>{t('privacy.sections.aiDocumentScanning.purpose.qualityCheck')}</li>
                                </ul>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.legalBasis.title">
                                <p>{t('privacy.sections.aiDocumentScanning.legalBasis.content')}</p>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.thirdPartyHandling.title">
                                <p>{t('privacy.sections.aiDocumentScanning.thirdPartyHandling.content')}</p>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.retention.title">
                                <p>{t('privacy.sections.aiDocumentScanning.retention.content')}</p>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.minimization.title">
                                <p>{t('privacy.sections.aiDocumentScanning.minimization.content')}</p>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.profiling.title">
                                <p>{t('privacy.sections.aiDocumentScanning.profiling.content')}</p>
                            </SubSection>

                            <SubSection titleKey="privacy.sections.aiDocumentScanning.security.title">
                                <p>{t('privacy.sections.aiDocumentScanning.security.content')}</p>
                            </SubSection>
                        </div>
                    </Section>

                    {/* How We Use Your Information */}
                    <Section icon={Eye} titleKey="privacy.sections.howWeUseYourInfo.title" id="howWeUseYourInfo">
                        <p>{t('privacy.sections.howWeUseYourInfo.intro')}</p>
                        <ul>
                            <li>{t('privacy.sections.howWeUseYourInfo.provideServices')}</li>
                            <li>{t('privacy.sections.howWeUseYourInfo.extractIdentity')}</li>
                            <li>{t('privacy.sections.howWeUseYourInfo.authenticate')}</li>
                            <li>{t('privacy.sections.howWeUseYourInfo.support')}</li>
                        </ul>
                    </Section>

                    {/* Data Sharing */}
                    <Section icon={UserCheck} titleKey="privacy.sections.dataSharing.title" id="dataSharing">
                        <p>{t('privacy.sections.dataSharing.intro')}</p>
                        <ul>
                            <li>{t('privacy.sections.dataSharing.agencies')}</li>
                            <li>{t('privacy.sections.dataSharing.serviceProviders')}</li>
                            <li>{t('privacy.sections.dataSharing.authorities')}</li>
                            <li>{t('privacy.sections.dataSharing.investigations')}</li>
                        </ul>
                    </Section>

                    {/* Data Storage and Security */}
                    <Section icon={Lock} titleKey="privacy.sections.dataStorage.title" id="dataStorage">
                        <p>{t('privacy.sections.dataStorage.content')}</p>
                    </Section>

                    {/* Data Retention */}
                    <Section icon={Database} titleKey="privacy.sections.dataRetention.title" id="dataRetention">
                        <p>{t('privacy.sections.dataRetention.content')}</p>
                    </Section>

                    {/* Your Rights */}
                    <Section icon={UserCheck} titleKey="privacy.sections.yourRights.title" id="yourRights">
                        <p>{t('privacy.sections.yourRights.intro')}</p>
                        <ul>
                            <li>{t('privacy.sections.yourRights.access')}</li>
                            <li>{t('privacy.sections.yourRights.correction')}</li>
                            <li>{t('privacy.sections.yourRights.deletion')}</li>
                            <li>{t('privacy.sections.yourRights.object')}</li>
                        </ul>
                        <p>{t('privacy.sections.yourRights.contact')}</p>
                    </Section>

                    {/* Cookies */}
                    <Section icon={Eye} titleKey="privacy.sections.cookies.title" id="cookies">
                        <p>{t('privacy.sections.cookies.content')}</p>
                    </Section>

                    {/* Third-Party Services */}
                    <Section icon={Database} titleKey="privacy.sections.thirdPartyServices.title" id="thirdPartyServices">
                        <p>{t('privacy.sections.thirdPartyServices.content')}</p>
                    </Section>

                    {/* Children */}
                    <Section icon={UserCheck} titleKey="privacy.sections.children.title" id="children">
                        <p>{t('privacy.sections.children.content')}</p>
                    </Section>

                    {/* Changes */}
                    <Section icon={Shield} titleKey="privacy.sections.changes.title" id="changes">
                        <p>{t('privacy.sections.changes.content')}</p>
                    </Section>

                    {/* Contact */}
                    <Section icon={Mail} titleKey="privacy.sections.contact.title" id="contact">
                        <div className="privacy-contact-info">
                            <p>{t('privacy.sections.contact.intro')}</p>
                            <div className="privacy-contact-details">
                                <div className="privacy-contact-item">
                                    <Mail size={16} />
                                    <span>{t('privacy.sections.contact.email')}</span>
                                </div>
                                <div className="privacy-contact-item">
                                    <MapPin size={16} />
                                    <span>{t('privacy.sections.contact.address')}</span>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Consent Checkbox Information */}
                    <Section icon={UserCheck} titleKey="privacy.sections.consentCheckbox.title" id="consentCheckbox">
                        <div className="privacy-consent-info">
                            <p>{t('privacy.sections.consentCheckbox.intro')}</p>
                            <div className="privacy-consent-example">
                                <p className="privacy-consent-text">
                                    {t('privacy.sections.consentCheckbox.text')}
                                </p>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="privacy-footer-cta">
                <div className="privacy-footer-container">
                    <div className="privacy-footer-content">
                        <h3>{t('privacy.footer.title')}</h3>
                        <p>{t('privacy.footer.description')}</p>
                        <div className="privacy-footer-actions">
                            <a href="mailto:privacy@rentify.ma" className="privacy-footer-button primary">
                                <Mail size={16} />
                                {t('privacy.footer.contactUs')}
                            </a>
                            <button onClick={handleGoBack} className="privacy-footer-button secondary">
                                {t('common.goBack')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;