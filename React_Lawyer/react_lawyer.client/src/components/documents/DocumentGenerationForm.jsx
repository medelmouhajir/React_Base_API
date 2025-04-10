// src/components/documents/DocumentGenerationForm.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    CircularProgress,
    Alert,
    Snackbar,
    Divider,
    Grid
} from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    Description as DocxIcon,
    Code as HtmlIcon,
    TextSnippet as TextIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import documentGenerationService from '../../services/documentGenerationService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

/**
 * Component for generating documents from templates
 * @param {Object} props - Component props
 * @param {number} props.caseId - Optional case ID
 * @param {number} props.clientId - Optional client ID
 * @param {string} props.entityType - Type of entity ('case' or 'client')
 * @param {Function} props.onSuccess - Callback for successful document generation
 */
const DocumentGenerationForm = ({ caseId, clientId, entityType, onSuccess }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');
    const [format, setFormat] = useState('PDF');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [templateCategories, setTemplateCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    // Load available templates
    useEffect(() => {
        const fetchTemplates = async () => {
            if (!isOnline) {
                setInitialLoading(false);
                return;
            }

            try {
                let fetchedTemplates;
                if (selectedCategory) {
                    fetchedTemplates = await documentGenerationService.getTemplates(selectedCategory);
                } else {
                    fetchedTemplates = await documentGenerationService.getTemplates();
                }

                setTemplates(fetchedTemplates || []);

                // Extract unique categories
                const categories = [...new Set(fetchedTemplates.map(t => t.category))];
                setTemplateCategories(categories);
            } catch (err) {
                console.error('Error fetching document templates:', err);
                setError(t('documents.errorFetchingTemplates'));
            } finally {
                setInitialLoading(false);
            }
        };

        fetchTemplates();
    }, [isOnline, t, selectedCategory]);

    // Handle template selection
    const handleTemplateChange = (event) => {
        const templateId = event.target.value;
        setSelectedTemplate(templateId);

        // Find the selected template
        const template = templates.find(t => t.id === templateId);
        if (template) {
            // Set a default document title based on the template name
            setDocumentTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
        }
    };

    // Handle category selection
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    // Handle document generation
    const handleGenerateDocument = async () => {
        if (!isOnline || !selectedTemplate) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Create generation request
            const request = {
                templateId: selectedTemplate,
                documentTitle: documentTitle,
                format: format,
                userId: user?.id || 0,
                lawFirmId: user?.lawFirmId || 0,
                saveToCase: true
            };

            // Set appropriate entity ID
            if (entityType === 'case' && caseId) {
                request.caseId = caseId;
            } else if (entityType === 'client' && clientId) {
                request.clientId = clientId;
            }

            // Generate and download the document
            const { blob, filename } = await documentGenerationService.generateAndDownloadDocument(request);

            // Trigger the download
            documentGenerationService.downloadBlob(blob, filename);

            // Show success message
            setSuccess(t('documents.generationSuccess'));

            // Call success callback if provided
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess();
            }

            // Reset form
            setSelectedTemplate('');
            setDocumentTitle('');
        } catch (err) {
            console.error('Error generating document:', err);
            setError(err.message || t('documents.generationError'));
        } finally {
            setLoading(false);
        }
    };

    // Document format options
    const formatOptions = [
        { value: 'PDF', label: t('documents.formats.pdf'), icon: <PdfIcon /> },
        { value: 'DOCX', label: t('documents.formats.docx'), icon: <DocxIcon /> },
        { value: 'HTML', label: t('documents.formats.html'), icon: <HtmlIcon /> },
        { value: 'TXT', label: t('documents.formats.txt'), icon: <TextIcon /> }
    ];

    return (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                {t('documents.generateDocument')}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {initialLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box component="form">
                    <Grid container spacing={3}>
                        {/* Category selection */}
                        {templateCategories.length > 0 && (
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('documents.category')}</InputLabel>
                                    <Select
                                        value={selectedCategory}
                                        onChange={handleCategoryChange}
                                        label={t('documents.category')}
                                    >
                                        <MenuItem value="">{t('documents.allCategories')}</MenuItem>
                                        {templateCategories.map(category => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Template selection */}
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>{t('documents.templates')}</InputLabel>
                                <Select
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                    label={t('documents.selectTemplate')}
                                    disabled={templates.length === 0}
                                >
                                    <MenuItem value="">{t('documents.chooseTemplate')}</MenuItem>
                                    {templates.map(template => (
                                        <MenuItem key={template.id} value={template.id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {templates.length === 0 && (
                                    <FormHelperText>
                                        {t('documents.noTemplatesAvailable')}
                                    </FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Document title */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={t('documents.title')}
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                                disabled={!selectedTemplate}
                                required
                            />
                        </Grid>

                        {/* Format selection */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>{t('documents.fileType')}</InputLabel>
                                <Select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    label={t('documents.fileType')}
                                    disabled={!selectedTemplate}
                                >
                                    {formatOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {option.icon}
                                                <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Template description (if selected) */}
                        {selectedTemplate && (
                            <Grid item xs={12}>
                                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {t('documents.templateDescription')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {templates.find(t => t.id === selectedTemplate)?.description || t('documents.noDescription')}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {/* Generate button */}
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleGenerateDocument}
                                disabled={!selectedTemplate || !documentTitle || loading || !isOnline}
                                startIcon={loading ? <CircularProgress size={24} /> : null}
                                fullWidth
                            >
                                {loading ? t('common.generating') : t('documents.generate')}
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Error message */}
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Offline warning */}
                    {!isOnline && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            {t('common.offlineWarning')}
                        </Alert>
                    )}
                </Box>
            )}

            {/* Success message */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success">{success}</Alert>
            </Snackbar>
        </Paper>
    );
};

export default DocumentGenerationForm;