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
        logoUrl: ''
    });
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // File upload states
    const [logoFile, setLogoFile] = useState(null);
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
                    logoUrl: agencyData.logoUrl || ''
                });

                setAttachments(agencyData.agency_Attachments || []);
            } catch (err) {
                console.error('❌ Error fetching agency data:', err);
                setError(t('agencySettings.fetchError'));
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

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);

            // Preview the logo
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({
                    ...prev,
                    logoUrl: event.target.result
                }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAttachmentFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewAttachment(prev => ({
                ...prev,
                fileName: file.name,
                file: file
            }));
        }
    };

    const handleAttachmentNameChange = (e) => {
        setNewAttachment(prev => ({
            ...prev,
            fileName: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // First, handle logo upload if a new file was selected
            let updatedLogoUrl = formData.logoUrl;
            if (logoFile) {
                try {
                    const uploadResult = await agencyService.uploadLogo(agencyId, logoFile);
                    updatedLogoUrl = uploadResult.logoUrl;
                } catch (uploadErr) {
                    console.error('❌ Error uploading logo:', uploadErr);
                    throw new Error(t('agencySettings.logoUploadError'));
                }
            }

            // Update agency data
            const updatePayload = {
                ...formData,
                id: agencyId,
                logoUrl: updatedLogoUrl
            };

            await agencyService.update(agencyId, updatePayload);
            setSuccess(t('agencySettings.saveSuccess'));

            // Reset file input
            setLogoFile(null);

            // Update the form data with the new logo URL
            setFormData(prev => ({
                ...prev,
                logoUrl: updatedLogoUrl
            }));
        } catch (err) {
            console.error('❌ Error saving agency settings:', err);
            setError(err.message || t('agencySettings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAttachment = async (e) => {
        e.preventDefault();

        if (!newAttachment.file || !newAttachment.fileName.trim()) {
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
            <h1 className="agencySettings-title">{t('agencySettings.title')}</h1>

            {error && <div className="agencySettings-error">{error}</div>}
            {success && <div className="agencySettings-success">{success}</div>}

            <form className="agencySettings-form" onSubmit={handleSubmit}>
                <div className="form-section-settings">
                    <h2 className="section-title">{t('agencySettings.generalInfo')}</h2>

                    <div className="form-group">
                        <label htmlFor="name">{t('agency.fields.name')}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">{t('agency.fields.address')}</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">{t('agency.fields.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneOne">{t('agency.fields.phoneOne')}</label>
                            <input
                                type="tel"
                                id="phoneOne"
                                name="phoneOne"
                                value={formData.phoneOne}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneTwo">{t('agency.fields.phoneTwo')}</label>
                        <input
                            type="tel"
                            id="phoneTwo"
                            name="phoneTwo"
                            value={formData.phoneTwo || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-section-settings">
                    <h2 className="section-title">{t('agencySettings.logo')}</h2>

                    <div className="logo-container">
                        {formData.logoUrl ? (
                            <img
                                src={formData.logoUrl}
                                alt={t('agencySettings.logoAlt')}
                                className="agency-logo-preview"
                            />
                        ) : (
                            <div className="logo-placeholder">
                                {t('agencySettings.noLogo')}
                            </div>
                        )}

                        <div className="logo-upload">
                            <label className="file-upload-label">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="file-input"
                                />
                                <span className="upload-button">
                                    {t('agencySettings.uploadLogo')}
                                </span>
                            </label>
                            {logoFile && (
                                <p className="selected-file">
                                    {logoFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving}
                    >
                        {isSaving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </form>

            <div className="form-section-settings attachments-section">
                <h2 className="section-title">{t('agencySettings.attachments')}</h2>

                {attachments.length === 0 ? (
                    <p className="no-attachments">{t('agencySettings.noAttachments')}</p>
                ) : (
                    <ul className="attachments-list">
                        {attachments.map((attachment) => (
                            <li key={attachment.id} className="attachment-item">
                                <span className="attachment-name">
                                    {attachment.fileName}
                                </span>
                                <div className="attachment-actions">
                                    <a
                                        href={attachment.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view"
                                    >
                                        {t('common.view')}
                                    </a>
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={() => handleRemoveAttachment(attachment.id)}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="add-attachment-form">
                    <h3>{t('agencySettings.addAttachment')}</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="attachmentName">
                                {t('agencySettings.attachmentName')}
                            </label>
                            <input
                                type="text"
                                id="attachmentName"
                                value={newAttachment.fileName}
                                onChange={handleAttachmentNameChange}
                                placeholder={t('agencySettings.attachmentNamePlaceholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="attachmentFile">
                                {t('agencySettings.attachmentFile')}
                            </label>
                            <label className="file-upload-label">
                                <input
                                    type="file"
                                    id="attachmentFile"
                                    onChange={handleAttachmentFileChange}
                                    className="file-input"
                                />
                                <span className="upload-button">
                                    {t('agencySettings.selectFile')}
                                </span>
                            </label>
                            {newAttachment.file && (
                                <p className="selected-file">
                                    {newAttachment.file.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-add-attachment"
                        onClick={handleAddAttachment}
                        disabled={isUploadingAttachment || !newAttachment.file || !newAttachment.fileName}
                    >
                        {isUploadingAttachment
                            ? t('common.uploading')
                            : t('agencySettings.addAttachmentBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgencySettings;