// src/pages/documents/DocumentEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Snackbar,
    Autocomplete,
    Tooltip,
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

import PageHeader from '../../components/common/PageHeader';
import documentService from '../../services/documentService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const DocumentEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();
    const { user } = useAuth();

    // State
    const [document, setDocument] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Other',
        caseId: '',
        isConfidential: false,
        isTemplate: false,
        isSharedWithClient: false,
        tags: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);

    // Fetch document and cases
    useEffect(() => {
        const fetchData = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                // Fetch document details
                const documentData = await documentService.getDocumentById(id);
                setDocument(documentData);

                // Extract tags
                const documentTags = documentData.tags ? documentData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                setTags(documentTags);

                // Set form data
                setFormData({
                    documentId: documentData.documentId,
                    title: documentData.title || '',
                    description: documentData.description || '',
                    category: documentData.category || 'Other',
                    caseId: documentData.caseId || '',
                    isConfidential: documentData.isConfidential || false,
                    isTemplate: documentData.isTemplate || false,
                    isSharedWithClient: documentData.isSharedWithClient || false,
                    tags: documentData.tags || ''
                });

                // Fetch available cases
                try {
                    const casesData = await documentService.getCases();
                    setCases(casesData);

                    // Set selected case
                    if (documentData.caseId) {
                        const selectedCase = casesData.find(c => c.caseId === documentData.caseId);
                        setSelectedCase(selectedCase || null);
                    }
                } catch (casesError) {
                    console.error('Error fetching cases:', casesError);
                }
            } catch (err) {
                console.error('Error fetching document details:', err);
                setError(t('documents.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isOnline, t]);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle case selection
    const handleCaseChange = (event, newValue) => {
        setSelectedCase(newValue);
        setFormData(prev => ({
            ...prev,
            caseId: newValue?.caseId || ''
        }));
    };

    // Add a tag
    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            const newTags = [...tags, tagInput.trim()];
            setTags(newTags);
            setFormData(prev => ({
                ...prev,
                tags: newTags.join(',')
            }));
            setTagInput('');
        }
    };

    // Remove a tag
    const handleDeleteTag = (tagToDelete) => {
        const newTags = tags.filter(tag => tag !== tagToDelete);
        setTags(newTags);
        setFormData(prev => ({
            ...prev,
            tags: newTags.join(',')
        }));
    };

    // Handle tag input key press (add on Enter)
    const handleTagKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setSaving(true);
        setError('');

        try {
            await documentService.updateDocument(id, formData);
            setSuccess(t('documents.updateSuccess'));

            // Navigate back to document details after a delay
            setTimeout(() => {
                navigate(`/documents/${id}`);
            }, 2000);
        } catch (err) {
            console.error('Error updating document:', err);
            setError(t('documents.updateError'));
            setSaving(false);
        }
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Clear success message
    const handleClearSuccess = () => {
        setSuccess('');
    };

    // Format for display
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('documents.editDocument')}
                subtitle={document?.title || t('documents.loading')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('documents.documents'), link: '/documents' },
                    { text: document?.title || t('documents.document'), link: `/documents/${id}` },
                    { text: t('documents.edit') }
                ]}
            />

            {/* Success message */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={handleClearSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClearSuccess}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {success}
                </Alert>
            </Snackbar>

            {/* Error message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={handleClearError}
                >
                    {error}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Loading state */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : document ? (
                <Paper sx={{ p: 3 }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Document Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    {t('documents.documentInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('documents.title')}
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('documents.description')}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="category-label">{t('documents.category')}</InputLabel>
                                    <Select
                                        labelId="category-label"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        label={t('documents.category')}
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

                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    value={selectedCase}
                                    onChange={handleCaseChange}
                                    options={cases}
                                    getOptionLabel={(option) => `${option.caseNumber || ''}: ${option.title}`}
                                    isOptionEqualToValue={(option, value) => option.caseId === value.caseId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('documents.relatedCase')}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {t('documents.tags')}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        fullWidth
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={handleTagKeyPress}
                                        placeholder={t('documents.tagsPlaceholder')}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddTag}
                                        disabled={!tagInput.trim()}
                                        startIcon={<AddIcon />}
                                    >
                                        {t('common.add')}
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                    {tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            onDelete={() => handleDeleteTag(tag)}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Grid>

                            {/* Document Properties */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    {t('documents.properties')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isTemplate}
                                            onChange={handleChange}
                                            name="isTemplate"
                                            color="secondary"
                                        />
                                    }
                                    label={t('documents.saveAsTemplate')}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isConfidential}
                                            onChange={handleChange}
                                            name="isConfidential"
                                            color="error"
                                        />
                                    }
                                    label={t('documents.confidential')}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Tooltip title={formData.isConfidential ? t('documents.cannotShareConfidential') : ''}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isSharedWithClient}
                                                onChange={handleChange}
                                                name="isSharedWithClient"
                                                color="info"
                                                disabled={formData.isConfidential}
                                            />
                                        }
                                        label={t('documents.shareWithClient')}
                                    />
                                </Tooltip>
                            </Grid>

                            {/* Document Information (Read-only) */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    {t('documents.fileInfo')}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('documents.fileType')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {document.fileType || t('common.unknown')}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('documents.fileSize')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatFileSize(document.fileSize)}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('documents.uploadDate')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(document.uploadDate).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Action Buttons */}
                            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={() => navigate(`/documents/${id}`)}
                                    disabled={saving}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={!isOnline || saving}
                                >
                                    {saving ? t('common.saving') : t('common.save')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            ) : (
                // Document not found state
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        {t('documents.documentNotFound')}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t('documents.documentNotFoundDesc')}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/documents')}
                    >
                        {t('documents.backToDocuments')}
                    </Button>
                </Paper>
            )}
        </Container>
    );
};

export default DocumentEditor;