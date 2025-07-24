// src/pages/Settings/Agency/AgencySettings.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import agencyService from '../../../services/agencyService';
import './AgencySettings.css';

const AgencySettings = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    // State
    const [agency, setAgency] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        address: '',
        email: '',
        phoneOne: '',
        phoneTwo: '',
        conditions: ''
    });
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingLogoAssociation, setIsUploadingLogoAssociation] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    // File upload states
    const [logoFile, setLogoFile] = useState(null);
    const [logoAssociationFile, setLogoAssociationFile] = useState(null);
    const [newAttachment, setNewAttachment] = useState({
        fileName: '',
        file: null
    });
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    useEffect(() => {
        const fetchAgencyData = async () => {
            if (!agencyId) return;

            try {
                setIsLoading(true);
                setError(null);

                const agencyData = await agencyService.getById(agencyId);

                setAgency(agencyData);
                setFormData({
                    id: agencyData.id,
                    name: agencyData.name || '',
                    address: agencyData.address || '',
                    email: agencyData.email || '',
                    phoneOne: agencyData.phoneOne || '',
                    phoneTwo: agencyData.phoneTwo || '',
                    conditions: agencyData.conditions || ''
                });

                if (agencyData.attachments) {
                    setAttachments(agencyData.attachments);
                }
            } catch (err) {
                console.error('❌ Error fetching agency data:', err);
                setError(err.message || t('agencySettings.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgencyData();
    }, [agencyId, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agencyId || !formData.name || !formData.address) {
            setError(t('agencySettings.requiredFieldsError'));
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const updatedAgency = await agencyService.update(agencyId, formData);
            setAgency(updatedAgency);
            setSuccess(t('agencySettings.saveSuccess'));
        } catch (err) {
            console.error('❌ Error updating agency settings:', err);
            setError(err.message || t('agencySettings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    // Separate handler for logo upload
    const handleLogoUpload = async (e) => {
        e.preventDefault();

        if (!logoFile) {
            setError(t('agencySettings.logoFileRequired'));
            return;
        }

        setIsUploadingLogo(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await agencyService.uploadLogo(agencyId, logoFile);

            // Update the agency state with new logo URL
            setAgency(prev => ({
                ...prev,
                logoUrl: result.logoUrl
            }));

            setLogoFile(null);
            // Reset file input
            const fileInput = document.getElementById('logoFile');
            if (fileInput) fileInput.value = '';

            setSuccess(t('agencySettings.logoUploadSuccess'));
        } catch (err) {
            console.error('❌ Error uploading logo:', err);
            setError(t('agencySettings.logoUploadError'));
        } finally {
            setIsUploadingLogo(false);
        }
    };

    // Separate handler for association logo upload
    const handleLogoAssociationUpload = async (e) => {
        e.preventDefault();

        if (!logoAssociationFile) {
            setError(t('agencySettings.logoAssociationFileRequired'));
            return;
        }

        setIsUploadingLogoAssociation(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await agencyService.uploadLogoAssociation(agencyId, logoAssociationFile);

            // Update the agency state with new logo association URL
            setAgency(prev => ({
                ...prev,
                logoUrlAssociation: result.logoUrlAssociation
            }));

            setLogoAssociationFile(null);
            // Reset file input
            const fileInput = document.getElementById('logoAssociationFile');
            if (fileInput) fileInput.value = '';

            setSuccess(t('agencySettings.logoAssociationUploadSuccess'));
        } catch (err) {
            console.error('❌ Error uploading association logo:', err);
            setError(t('agencySettings.logoAssociationUploadError'));
        } finally {
            setIsUploadingLogoAssociation(false);
        }
    };

    const handleAddAttachment = async (e) => {
        e.preventDefault();

        if (!newAttachment.file || !newAttachment.fileName.trim()) {
            setError(t('agencySettings.attachmentRequiredError'));
            return;
        }

        setIsUploadingAttachment(true);
        setError(null);
        setSuccess(null);

        try {
            const attachmentResult = await agencyService.addAttachment(
                agencyId,
                newAttachment.fileName,
                newAttachment.file
            );

            // Update the attachments list
            setAttachments(prev => [...prev, attachmentResult]);

            // Reset the form
            setNewAttachment({
                fileName: '',
                file: null
            });

            setSuccess(t('agencySettings.attachmentAddedSuccess'));
        } catch (err) {
            console.error('❌ Error adding attachment:', err);
            setError(t('agencySettings.attachmentAddedError'));
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleRemoveAttachment = async (attachmentId) => {
        setError(null);
        setSuccess(null);

        try {
            await agencyService.removeAttachment(agencyId, attachmentId);

            // Update the attachments list
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));

            setSuccess(t('agencySettings.attachmentRemovedSuccess'));
        } catch (err) {
            console.error('❌ Error removing attachment:', err);
            setError(t('agencySettings.attachmentRemovedError'));
        }
    };

    if (isLoading) {
        return (
            <div className="agencySettings-loading">
                <div className="loading-spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={`agencySettings-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="agencySettings-header">
                <h1 className="agencySettings-title">{t('agencySettings.title')}</h1>
                <p className="agencySettings-subtitle">{t('agencySettings.subtitle')}</p>
            </div>

            {error && <div className="agencySettings-error">{error}</div>}
            {success && <div className="agencySettings-success">{success}</div>}

            {/* Agency Information Section */}
            <div className="form-section-settings">
                <h2 className="section-title">
                    <span className="section-icon">ℹ️</span>
                    {t('agencySettings.generalInfo')}
                </h2>

                <form className="agencySettings-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">{t('agency.fields.name')} *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder={t('agency.fields.namePlaceholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">{t('agency.fields.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t('agency.fields.emailPlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">{t('agency.fields.address')} *</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            placeholder={t('agency.fields.addressPlaceholder')}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phoneOne">{t('agency.fields.phoneOne')}</label>
                            <input
                                type="tel"
                                id="phoneOne"
                                name="phoneOne"
                                value={formData.phoneOne}
                                onChange={handleChange}
                                placeholder={t('agency.fields.phonePlaceholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneTwo">{t('agency.fields.phoneTwo')}</label>
                            <input
                                type="tel"
                                id="phoneTwo"
                                name="phoneTwo"
                                value={formData.phoneTwo}
                                onChange={handleChange}
                                placeholder={t('agency.fields.phonePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="conditions">{t('agency.fields.conditions')}</label>
                        <textarea
                            id="conditions"
                            name="conditions"
                            value={formData.conditions}
                            onChange={handleChange}
                            rows="4"
                            placeholder={t('agency.fields.conditionsPlaceholder')}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    {t('common.saving')}
                                </>
                            ) : (
                                t('agencySettings.saveInfo')
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Main Logo Section */}
            <div className="form-section-settings">
                <h2 className="section-title">
                    <span className="section-icon">🏢</span>
                    {t('agencySettings.mainLogo')}
                </h2>

                <div className="logo-section">
                    <div className="logo-preview">
                        {agency?.logoUrl ? (
                            <img
                                src={`${apiBaseUrl}${agency.logoUrl}`}
                                alt={t('agencySettings.currentLogo')}
                                className="agency-logo-preview"
                            />
                        ) : (
                            <div className="logo-placeholder">
                                <span className="placeholder-icon">🏢</span>
                                <p>{t('agencySettings.noLogo')}</p>
                            </div>
                        )}
                    </div>

                    <form className="logo-upload-form" onSubmit={handleLogoUpload}>
                        <div className="form-group">
                            <label htmlFor="logoFile" className="file-upload-label">
                                {t('agencySettings.selectLogo')}
                            </label>
                            <input
                                type="file"
                                id="logoFile"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files[0])}
                                className="file-input"
                            />
                            {logoFile && (
                                <p className="selected-file">
                                    {t('agencySettings.selectedFile')}: {logoFile.name}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-secondary"
                            disabled={!logoFile || isUploadingLogo}
                        >
                            {isUploadingLogo ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    {t('common.uploading')}
                                </>
                            ) : (
                                t('agencySettings.uploadLogo')
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Association Logo Section */}
            <div className="form-section-settings">
                <h2 className="section-title">
                    <span className="section-icon">🤝</span>
                    {t('agencySettings.associationLogo')}
                </h2>

                <div className="logo-section">
                    <div className="logo-preview">
                        {agency?.logoUrlAssociation ? (
                            <img
                                src={`${apiBaseUrl}${agency.logoUrlAssociation}`}
                                alt={t('agencySettings.currentAssociationLogo')}
                                className="agency-logo-preview"
                            />
                        ) : (
                            <div className="logo-placeholder">
                                <span className="placeholder-icon">🤝</span>
                                <p>{t('agencySettings.noAssociationLogo')}</p>
                            </div>
                        )}
                    </div>

                    <form className="logo-upload-form" onSubmit={handleLogoAssociationUpload}>
                        <div className="form-group">
                            <label htmlFor="logoAssociationFile" className="file-upload-label">
                                {t('agencySettings.selectAssociationLogo')}
                            </label>
                            <input
                                type="file"
                                id="logoAssociationFile"
                                accept="image/*"
                                onChange={(e) => setLogoAssociationFile(e.target.files[0])}
                                className="file-input"
                            />
                            {logoAssociationFile && (
                                <p className="selected-file">
                                    {t('agencySettings.selectedFile')}: {logoAssociationFile.name}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-secondary"
                            disabled={!logoAssociationFile || isUploadingLogoAssociation}
                        >
                            {isUploadingLogoAssociation ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    {t('common.uploading')}
                                </>
                            ) : (
                                t('agencySettings.uploadAssociationLogo')
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Attachments Section */}
            <div className="form-section-settings">
                <h2 className="section-title">
                    <span className="section-icon">📎</span>
                    {t('agencySettings.attachments')}
                </h2>

                {attachments.length > 0 && (
                    <div className="attachments-list">
                        {attachments.map((attachment) => (
                            <div key={attachment.id} className="attachment-item">
                                <div className="attachment-info">
                                    <span className="attachment-name">{attachment.fileName}</span>
                                    <span className="attachment-date">
                                        {new Date(attachment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="attachment-actions">
                                    <a
                                        href={`${apiBaseUrl}${attachment.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view"
                                    >
                                        {t('common.view')}
                                    </a>
                                    <button
                                        onClick={() => handleRemoveAttachment(attachment.id)}
                                        className="btn-delete"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <form className="add-attachment-form" onSubmit={handleAddAttachment}>
                    <h3>{t('agencySettings.addAttachment')}</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="attachmentName">{t('agencySettings.attachmentName')}</label>
                            <input
                                type="text"
                                id="attachmentName"
                                value={newAttachment.fileName}
                                onChange={(e) => setNewAttachment(prev => ({
                                    ...prev,
                                    fileName: e.target.value
                                }))}
                                placeholder={t('agencySettings.attachmentNamePlaceholder')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="attachmentFile" className="file-upload-label">
                                {t('agencySettings.selectFile')}
                            </label>
                            <input
                                type="file"
                                id="attachmentFile"
                                onChange={(e) => setNewAttachment(prev => ({
                                    ...prev,
                                    file: e.target.files[0]
                                }))}
                                className="file-input"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-add-attachment"
                        disabled={isUploadingAttachment || !newAttachment.file || !newAttachment.fileName.trim()}
                    >
                        {isUploadingAttachment ? (
                            <>
                                <div className="btn-spinner"></div>
                                {t('common.uploading')}
                            </>
                        ) : (
                            t('agencySettings.addAttachment')
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AgencySettings;