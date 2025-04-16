import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import {
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Autocomplete,
    FormHelperText,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Description as DocumentIcon,
    Save as SaveIcon
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';

// Services
import documentGenerationService from '../../services/documentGenerationService';
import clientService from '../../services/clientService';
import caseService from '../../services/caseService';

const DocumentGenerationPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    // State
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        templateId: '',
        documentTitle: '',
        format: 'PDF',
        additionalInfo: '',
        selectedClients: [],
        selectedCase: null
    });

    // Validation state
    const [errors, setErrors] = useState({});

    // Load reference data
    useEffect(() => {
        const loadReferenceData = async () => {
            setInitialLoading(true);

            try {
                // Load templates
                const templatesData = await documentGenerationService.getTemplates();
                setTemplates(templatesData || []);

                // Load clients
                const clientsData = await clientService.getClients();
                setClients(clientsData || []);

                // Load cases
                const casesData = await caseService.getCases();
                setCases(casesData || []);
            } catch (err) {
                console.error('Error loading reference data:', err);
                setError(t('documents.loadingError'));
            } finally {
                setInitialLoading(false);
            }
        };

        loadReferenceData();
    }, [t]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear validation error when user changes input
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    // Handle client selection with designation
    const handleClientSelection = (event, newValue) => {
        setFormData({
            ...formData,
            selectedClients: newValue
        });

        if (errors.selectedClients) {
            setErrors({
                ...errors,
                selectedClients: ''
            });
        }
    };

    // Handle case selection
    const handleCaseSelection = (event, newValue) => {
        setFormData({
            ...formData,
            selectedCase: newValue
        });
    };

    // Add designation to client
    const handleDesignationChange = (clientId, designation) => {
        setFormData({
            ...formData,
            selectedClients: formData.selectedClients.map(client =>
                client.clientId === clientId
                    ? { ...client, designation }
                    : client
            )
        });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.templateId) {
            newErrors.templateId = t('documents.errors.templateRequired');
        }

        if (!formData.documentTitle) {
            newErrors.documentTitle = t('documents.errors.titleRequired');
        }

        if (formData.selectedClients.length === 0) {
            newErrors.selectedClients = t('documents.errors.clientRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Prepare data for document generation
            const documentRequest = {
                templateId: formData.templateId,
                documentTitle: formData.documentTitle,
                format: formData.format,
                data: {
                    // Client data
                    clients: formData.selectedClients.map(client => ({
                        id: client.clientId,
                        firstName: client.firstName,
                        lastName: client.lastName,
                        email: client.email,
                        phone: client.phone,
                        companyName: client.companyName,
                        designation: client.designation || 'Client'
                    })),

                    // Case data if selected
                    case: formData.selectedCase ? {
                        id: formData.selectedCase.caseId,
                        number: formData.selectedCase.caseNumber,
                        title: formData.selectedCase.title,
                        court: formData.selectedCase.courtName,
                        courtCaseNumber: formData.selectedCase.courtCaseNumber
                    } : null,

                    // Additional information
                    additionalInfo: formData.additionalInfo,

                    // Generation metadata
                    generatedBy: user?.name || 'System User',
                    generatedDate: new Date().toISOString()
                }
            };

            // Generate and download document
            const result = await documentGenerationService.generateAndDownloadDocument(documentRequest);

            // Download the file
            documentGenerationService.downloadBlob(result.blob, result.filename);

            // Show success message
            setSuccess(t('documents.generationSuccess'));

            // Reset form (optional)
            // resetForm();
        } catch (err) {
            console.error('Error generating document:', err);
            setError(err.message || t('documents.generationError'));
        } finally {
            setLoading(false);
        }
    };

    // Format options
    const formatOptions = [
        { value: 'PDF', label: 'PDF' },
        { value: 'DOCX', label: 'Word Document (DOCX)' },
        { value: 'HTML', label: 'HTML' },
        { value: 'Markdown', label: 'Markdown' },
        { value: 'TXT', label: 'Plain Text' }
    ];

    // Reset form (optional)
    const resetForm = () => {
        setFormData({
            templateId: '',
            documentTitle: '',
            format: 'PDF',
            additionalInfo: '',
            selectedClients: [],
            selectedCase: null
        });
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('documents.generateDocument')}
                subtitle={t('documents.generateDocumentSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('documents.documents'), link: '/documents' },
                    { text: t('documents.generateDocument') }
                ]}
                icon={<DocumentIcon />}
            />

            {/* Loading indicator */}
            {initialLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Template selection */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('documents.templateInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl
                                    fullWidth
                                    error={!!errors.templateId}
                                >
                                    <InputLabel id="template-select-label">
                                        {t('documents.template')}
                                    </InputLabel>
                                    <Select
                                        labelId="template-select-label"
                                        id="templateId"
                                        name="templateId"
                                        value={formData.templateId}
                                        onChange={handleChange}
                                        label={t('documents.template')}
                                    >
                                        {templates.length > 0 ? (
                                            templates.map(template => (
                                                <MenuItem key={template.id} value={template.id}>
                                                    {template.name} ({template.category})
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                {t('documents.noTemplatesAvailable')}
                                            </MenuItem>
                                        )}
                                    </Select>
                                    {errors.templateId && (
                                        <FormHelperText>{errors.templateId}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="format-select-label">
                                        {t('documents.format')}
                                    </InputLabel>
                                    <Select
                                        labelId="format-select-label"
                                        id="format"
                                        name="format"
                                        value={formData.format}
                                        onChange={handleChange}
                                        label={t('documents.format')}
                                    >
                                        {formatOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('documents.documentTitle')}
                                    name="documentTitle"
                                    value={formData.documentTitle}
                                    onChange={handleChange}
                                    error={!!errors.documentTitle}
                                    helperText={errors.documentTitle}
                                />
                            </Grid>

                            {/* Client selection */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('documents.clientInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    id="clients-autocomplete"
                                    options={clients}
                                    getOptionLabel={(option) =>
                                        option.companyName
                                            ? `${option.firstName} ${option.lastName} (${option.companyName})`
                                            : `${option.firstName} ${option.lastName}`
                                    }
                                    value={formData.selectedClients}
                                    onChange={handleClientSelection}
                                    isOptionEqualToValue={(option, value) => option.clientId === value.clientId}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option.companyName
                                                    ? `${option.firstName} ${option.lastName} (${option.companyName})`
                                                    : `${option.firstName} ${option.lastName}`}
                                                {...getTagProps({ index })}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('documents.selectClients')}
                                            error={!!errors.selectedClients}
                                            helperText={errors.selectedClients}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Client designations */}
                            {formData.selectedClients.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {t('documents.clientDesignations')}
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        {formData.selectedClients.map(client => (
                                            <Grid container spacing={2} key={client.clientId} sx={{ mb: 2 }}>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        {client.companyName
                                                            ? `${client.firstName} ${client.lastName} (${client.companyName})`
                                                            : `${client.firstName} ${client.lastName}`}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        fullWidth
                                                        label={t('documents.designation')}
                                                        value={client.designation || ''}
                                                        onChange={(e) => handleDesignationChange(client.clientId, e.target.value)}
                                                        placeholder={t('documents.designationPlaceholder')}
                                                        size="small"
                                                    />
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Box>
                                </Grid>
                            )}

                            {/* Case selection */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('documents.caseInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Autocomplete
                                    id="case-autocomplete"
                                    options={cases}
                                    getOptionLabel={(option) =>
                                        option.caseNumber
                                            ? `${option.caseNumber} - ${option.title}`
                                            : option.title
                                    }
                                    value={formData.selectedCase}
                                    onChange={handleCaseSelection}
                                    isOptionEqualToValue={(option, value) => option.caseId === value?.caseId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('documents.selectCase')}
                                            helperText={t('documents.caseSelectionOptional')}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Additional information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('documents.additionalInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('documents.additionalInformation')}
                                    name="additionalInfo"
                                    value={formData.additionalInfo}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    placeholder={t('documents.additionalInfoPlaceholder')}
                                />
                            </Grid>

                            {/* Submit buttons */}
                            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/documents')}
                                    disabled={loading}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading || !isOnline}
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                >
                                    {loading ? t('documents.generating') : t('documents.generateAndDownload')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            )}

            {/* Error/Success snackbars */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DocumentGenerationPage;