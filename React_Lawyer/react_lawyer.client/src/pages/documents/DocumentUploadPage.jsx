// src/pages/documents/DocumentUploadPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    Chip,
    IconButton,
    Link
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Description as DescriptionIcon,
    ArrowBack as BackIcon,
    Clear as ClearIcon,
    Article as DocumentIcon,
    Folder as FolderIcon,
    CheckCircleOutline as SuccessIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import documentService from '../../services/documentService';
import caseService from '../../services/caseService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const DocumentUploadPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // Get caseId from query parameters
    const queryParams = new URLSearchParams(location.search);
    const caseIdFromQuery = queryParams.get('caseId');

    // State
    const [loading, setLoading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');
    const [cases, setCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(true);
    const [caseError, setCaseError] = useState('');
    const [caseDetails, setCaseDetails] = useState(null);

    // Upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: 'Other',
        isConfidential: false,
        isTemplate: false,
        isSharedWithClient: false,
        caseId: caseIdFromQuery || '',
        tags: ''
    });

    // Fetch available cases
    useEffect(() => {
        const fetchCases = async () => {
            if (!isOnline) {
                setCasesLoading(false);
                setCaseError(t('common.offlineMode'));
                return;
            }

            setCasesLoading(true);
            setCaseError('');

            try {
                const casesData = await documentService.getCases();
                setCases(casesData);

                // If caseId is provided in URL, fetch case details
                if (caseIdFromQuery) {
                    try {
                        const caseData = await caseService.getCaseById(caseIdFromQuery);
                        setCaseDetails(caseData);
                    } catch (err) {
                        console.error('Error fetching case details:', err);
                        setCaseError(t('cases.fetchError'));
                    }
                }
            } catch (err) {
                console.error('Error fetching cases:', err);
                setCaseError(t('cases.fetchError'));
            } finally {
                setCasesLoading(false);
            }
        };

        fetchCases();
    }, [caseIdFromQuery, isOnline, t]);

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setFileError('');

        if (!file) {
            setUploadFile(null);
            return;
        }

        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            setFileError(t('documents.fileTooLarge', { maxSize: '20MB' }));
            return;
        }

        setUploadFile(file);

        // Auto-fill title with file name (without extension)
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setUploadData(prev => ({
            ...prev,
            title: fileName || file.name
        }));
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUploadData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        if (!uploadFile) {
            setFileError(t('documents.fileRequired'));
            return;
        }

        if (!uploadData.title.trim()) {
            setError(t('documents.titleRequired'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadData.title.trim());
            formData.append('description', uploadData.description.trim());
            formData.append('category', uploadData.category);
            formData.append('isConfidential', uploadData.isConfidential);
            formData.append('isTemplate', uploadData.isTemplate);
            formData.append('isSharedWithClient', uploadData.isSharedWithClient);
            formData.append('caseId', uploadData.caseId);
            formData.append('tags', uploadData.tags.trim());
            formData.append('uploadedById', user?.id);
            formData.append('lawFirmId', user?.lawFirmId || 0);

            const response = await documentService.uploadDocument(formData);

            // Show success message and reset form
            setUploadSuccess(true);
            setUploadFile(null);
            setUploadData({
                title: '',
                description: '',
                category: 'Other',
                isConfidential: false,
                isTemplate: false,
                isSharedWithClient: false,
                caseId: uploadData.caseId, // Keep the current case ID
                tags: ''
            });

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // After 3 seconds, redirect to document details page
            setTimeout(() => {
                if (response?.documentId) {
                    navigate(`/documents/${response.documentId}`);
                } else if (uploadData.caseId) {
                    navigate(`/cases/${uploadData.caseId}`);
                } else {
                    navigate('/documents');
                }
            }, 3000);

        } catch (err) {
            console.error('Error uploading document:', err);
            setError(t('documents.uploadError'));
        } finally {
            setLoading(false);
        }
    };

    // Get file type icon
    const getFileTypeIcon = (fileType) => {
        if (!fileType) return <DocumentIcon />;

        const type = fileType.toLowerCase();

        if (type.includes('pdf')) return <DescriptionIcon color="error" />;
        if (type.includes('doc') || type.includes('word')) return <DescriptionIcon color="primary" />;
        if (type.includes('xls') || type.includes('sheet')) return <DescriptionIcon color="success" />;
        if (type.includes('ppt') || type.includes('presentation')) return <DescriptionIcon color="warning" />;
        if (type.includes('txt') || type.includes('text')) return <DescriptionIcon />;
        if (type.includes('image') || type.includes('jpg') || type.includes('png')) return <DescriptionIcon color="info" />;

        return <DocumentIcon />;
    };

    // Clear file
    const handleClearFile = () => {
        setUploadFile(null);
        setFileError('');
    };

    // Clear error
    const handleClearError = () => {
        setError('');
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('documents.uploadDocument')}
                subtitle={caseDetails
                    ? t('documents.uploadToCase', {
                        caseNumber: caseDetails.caseNumber,
                        caseTitle: caseDetails.title
                    })
                    : t('documents.upload')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('documents.documents'), link: '/documents' },
                    { text: t('documents.upload') }
                ]}
                backButton={true}
                onBackClick={() => navigate(-1)}
            />

            {/* Success Message */}
            {uploadSuccess && (
                <Alert
                    severity="success"
                    icon={<SuccessIcon />}
                    sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
                >
                    <Typography variant="body1">
                        {t('documents.uploadSuccess')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {t('documents.redirecting')}
                    </Typography>
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert
                    severity="error"
                    onClose={handleClearError}
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* Offline Warning */}
            {!isOnline && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                >
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Case Context Info */}
            {caseDetails && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FolderIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            {t('cases.caseNumber', { number: caseDetails.caseNumber })}
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        {caseDetails.title}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Chip
                            label={caseDetails.status}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </Paper>
            )}

            {/* Upload Form */}
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* File Upload Area */}
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: fileError ? 'error.main' : 'divider',
                                    borderRadius: 1,
                                    p: 3,
                                    textAlign: 'center',
                                    backgroundColor: theme => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(0, 0, 0, 0.02)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                            >
                                {!uploadFile ? (
                                    <>
                                        <input
                                            accept="*/*"
                                            style={{ display: 'none' }}
                                            id="upload-file-button"
                                            type="file"
                                            onChange={handleFileChange}
                                            disabled={loading || !isOnline}
                                        />
                                        <label htmlFor="upload-file-button">
                                            <Button
                                                variant="contained"
                                                component="span"
                                                startIcon={<UploadIcon />}
                                                disabled={loading || !isOnline}
                                                sx={{ mb: 2 }}
                                            >
                                                {t('documents.selectFile')}
                                            </Button>
                                        </label>
                                        <Typography variant="body2" color="textSecondary">
                                            {t('documents.dragAndDropHint')}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                            {t('documents.maxFileSize', { size: '20MB' })}
                                        </Typography>
                                        {fileError && (
                                            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                                {fileError}
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            p: 2,
                                            bgcolor: 'background.paper',
                                            borderRadius: 1,
                                            boxShadow: 1,
                                            width: '100%',
                                            maxWidth: 400,
                                            mx: 'auto'
                                        }}>
                                            {getFileTypeIcon(uploadFile.type)}
                                            <Box sx={{ ml: 2, flexGrow: 1, overflow: 'hidden' }}>
                                                <Typography variant="body1" noWrap>
                                                    {uploadFile.name}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {t('documents.fileSize')}: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={handleClearFile}
                                                disabled={loading}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Box>

                                        <input
                                            accept="*/*"
                                            style={{ display: 'none' }}
                                            id="change-file-button"
                                            type="file"
                                            onChange={handleFileChange}
                                            disabled={loading || !isOnline}
                                        />
                                        <label htmlFor="change-file-button">
                                            <Button
                                                variant="text"
                                                component="span"
                                                size="small"
                                                disabled={loading || !isOnline}
                                            >
                                                {t('documents.selectDifferentFile')}
                                            </Button>
                                        </label>
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Document Title & Description */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                label={t('documents.title')}
                                name="title"
                                value={uploadData.title}
                                onChange={handleChange}
                                disabled={loading}
                                error={uploadData.title.trim() === ''}
                                helperText={uploadData.title.trim() === '' ? t('documents.titleRequired') : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="document-category-label">{t('documents.category')}</InputLabel>
                                <Select
                                    labelId="document-category-label"
                                    name="category"
                                    value={uploadData.category}
                                    onChange={handleChange}
                                    label={t('documents.category')}
                                    disabled={loading}
                                >
                                    <MenuItem value="Pleading">{t('documents.categories.pleading')}</MenuItem>
                                    <MenuItem value="Evidence">{t('documents.categories.evidence')}</MenuItem>
                                    <MenuItem value="Correspondence">{t('documents.categories.correspondence')}</MenuItem>
                                    <MenuItem value="Contract">{t('documents.categories.contract')}</MenuItem>
                                    <MenuItem value="CourtFiling">{t('documents.categories.courtFiling')}</MenuItem>
                                    <MenuItem value="ClientDocument">{t('documents.categories.clientDocument')}</MenuItem>
                                    <MenuItem value="InternalMemo">{t('documents.categories.internalMemo')}</MenuItem>
                                    <MenuItem value="Research">{t('documents.categories.research')}</MenuItem>
                                    <MenuItem value="Financial">{t('documents.categories.financial')}</MenuItem>
                                    <MenuItem value="Other">{t('documents.categories.other')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={t('documents.description')}
                                name="description"
                                value={uploadData.description}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                disabled={loading}
                            />
                        </Grid>

                        {/* Case Selection */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="document-case-label">{t('documents.relatedCase')}</InputLabel>
                                <Select
                                    labelId="document-case-label"
                                    name="caseId"
                                    value={uploadData.caseId}
                                    onChange={handleChange}
                                    label={t('documents.relatedCase')}
                                    disabled={loading || casesLoading || !!caseIdFromQuery}
                                >
                                    <MenuItem value="">{t('common.none')}</MenuItem>
                                    {cases.map((caseItem) => (
                                        <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                            {caseItem.caseNumber} - {caseItem.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {caseError && (
                                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                        {caseError}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Tags */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={t('documents.tags')}
                                name="tags"
                                value={uploadData.tags}
                                onChange={handleChange}
                                placeholder={t('documents.tagsPlaceholder')}
                                helperText={t('documents.tagsHelp')}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        {/* Document Options */}
                        <Grid item xs={12}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={uploadData.isTemplate}
                                            onChange={handleChange}
                                            name="isTemplate"
                                            color="secondary"
                                            disabled={loading}
                                        />
                                    }
                                    label={t('documents.saveAsTemplate')}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={uploadData.isConfidential}
                                            onChange={handleChange}
                                            name="isConfidential"
                                            color="error"
                                            disabled={loading}
                                        />
                                    }
                                    label={t('documents.confidential')}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={uploadData.isSharedWithClient}
                                            onChange={handleChange}
                                            name="isSharedWithClient"
                                            color="info"
                                            disabled={loading}
                                        />
                                    }
                                    label={t('documents.shareWithClient')}
                                />
                            </Stack>
                        </Grid>

                        {/* Submit Buttons */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<BackIcon />}
                                    onClick={() => navigate(-1)}
                                    disabled={loading}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                                    disabled={loading || !uploadFile || !uploadData.title.trim() || !isOnline}
                                >
                                    {loading ? t('documents.uploading') : t('documents.upload')}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Document Policy Info */}
            <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    {t('documents.uploadPolicyTitle')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {t('documents.uploadPolicyText')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Link href="/help/document-policy" target="_blank" rel="noopener" underline="hover">
                        {t('documents.learnMoreAboutDocumentPolicy')}
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
};

export default DocumentUploadPage;