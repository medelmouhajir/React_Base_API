// src/pages/documents/DocumentDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Grid,
    Button,
    Chip,
    IconButton,
    Card,
    CardContent,
    CardActions,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
    Tooltip,
    Breadcrumbs,
    Avatar,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Snackbar,
    useTheme
} from '@mui/material';
import {
    Description as DescriptionIcon,
    CloudDownload as DownloadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    FileCopy as FileIcon,
    RestorePage as VersionIcon,
    CloudUpload as UploadIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    Folder as FolderIcon,
    AssignmentTurnedIn as CaseIcon,
    NavigateNext as NavigateNextIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import PageHeader from '../../components/common/PageHeader';
import documentService from '../../services/documentService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

// Document category color mapping
const CATEGORY_COLORS = {
    'Pleading': 'primary',
    'Evidence': 'success',
    'Correspondence': 'info',
    'Contract': 'secondary',
    'CourtFiling': 'warning',
    'ClientDocument': 'default',
    'InternalMemo': 'info',
    'Research': 'primary',
    'Financial': 'error',
    'Other': 'default'
};

const DocumentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();
    const { isMobile } = useThemeMode();
    const theme = useTheme();

    // State
    const [document, setDocument] = useState(null);
    const [documentVersions, setDocumentVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Dialogs
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [uploadVersionDialogOpen, setUploadVersionDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    // Fetch document details
    useEffect(() => {
        const fetchDocumentDetails = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                const documentData = await documentService.getDocumentById(id);
                setDocument(documentData);

                // Fetch document versions
                try {
                    const versions = await documentService.getDocumentVersions(id);
                    setDocumentVersions(versions);
                } catch (versionError) {
                    console.error('Error fetching document versions:', versionError);
                }
            } catch (err) {
                console.error('Error fetching document details:', err);
                setError(t('documents.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentDetails();
    }, [id, isOnline, t]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle document download
    const handleDownload = async () => {
        if (!isOnline || !document) {
            setError(t('common.offlineError'));
            return;
        }

        try {
            await documentService.downloadDocument(document.documentId, document.title);
            setSuccess(t('documents.downloadSuccess'));
        } catch (err) {
            console.error('Error downloading document:', err);
            setError(t('documents.downloadError'));
        }
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    // Handle document deletion
    const handleDeleteDocument = async () => {
        if (!isOnline || !document) return;

        setDeleteLoading(true);

        try {
            await documentService.deleteDocument(document.documentId);

            // Show success message
            setSuccess(t('documents.deleteSuccess'));

            // Navigate back to documents list after a delay
            setTimeout(() => {
                navigate('/documents');
            }, 2000);
        } catch (err) {
            console.error('Error deleting document:', err);
            setError(t('documents.deleteError'));
            setDeleteLoading(false);
        }
    };

    // Open upload new version dialog
    const handleOpenUploadVersionDialog = () => {
        setUploadVersionDialogOpen(true);
        setUploadFile(null);
    };

    // Close upload new version dialog
    const handleCloseUploadVersionDialog = () => {
        setUploadVersionDialogOpen(false);
    };

    // Handle file selection for new version
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadFile(file);
        }
    };

    // Submit new version upload
    const handleUploadVersion = async () => {
        if (!uploadFile || !isOnline || !document) return;

        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            await documentService.updateDocumentVersion(document.documentId, formData);

            // Show success message
            setSuccess(t('documents.versionUploadSuccess'));

            // Close dialog and refresh document data
            handleCloseUploadVersionDialog();

            // Reload document data
            const documentData = await documentService.getDocumentById(id);
            setDocument(documentData);

            // Reload versions
            const versions = await documentService.getDocumentVersions(id);
            setDocumentVersions(versions);
        } catch (err) {
            console.error('Error uploading new version:', err);
            setError(t('documents.versionUploadError'));
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle sharing toggle
    const handleShareWithClient = async (event) => {
        if (!isOnline || !document) {
            setError(t('common.offlineError'));
            return;
        }

        const isShared = event.target.checked;

        try {
            await documentService.shareDocument(document.documentId, isShared);

            // Update document in state
            setDocument({
                ...document,
                isSharedWithClient: isShared
            });

            setSuccess(isShared ? t('documents.sharedSuccess') : t('documents.unsharedSuccess'));
        } catch (err) {
            console.error('Error updating document sharing:', err);
            setError(t('documents.shareError'));
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get file type icon
    const getFileTypeIcon = (fileType) => {
        if (!fileType) return <DescriptionIcon />;

        const type = fileType.toLowerCase();

        if (type.includes('pdf')) return <DescriptionIcon color="error" />;
        if (type.includes('doc') || type.includes('word')) return <DescriptionIcon color="primary" />;
        if (type.includes('xls') || type.includes('sheet')) return <DescriptionIcon color="success" />;
        if (type.includes('ppt') || type.includes('presentation')) return <DescriptionIcon color="warning" />;
        if (type.includes('txt') || type.includes('text')) return <FileIcon />;
        if (type.includes('image') || type.includes('jpg') || type.includes('png')) return <FileIcon color="info" />;

        return <DescriptionIcon />;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file extension from path
    const getFileExtension = (filePath) => {
        if (!filePath) return '';
        return filePath.split('.').pop().toUpperCase();
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Clear success message
    const handleClearSuccess = () => {
        setSuccess('');
    };

    // Check if user is admin or lawyer
    const isAdminOrLawyer = user?.role === 'Admin' || user?.role === 'Lawyer';

    // Extract document tags
    const documentTags = document?.tags ? document.tags.split(',').map(tag => tag.trim()) : [];

    return (
        <Container maxWidth="lg">
            {/* Breadcrumb and back button */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/documents')}
                    sx={{ mr: 2 }}
                >
                    {t('common.back')}
                </Button>

                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    <Link underline="hover" color="inherit" component={Link} to="/">
                        {t('app.dashboard')}
                    </Link>
                    <Link underline="hover" color="inherit" component={Link} to="/documents">
                        {t('documents.documents')}
                    </Link>
                    <Typography color="text.primary">
                        {document?.title || t('documents.documentDetails')}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Page header */}
            {document && (
                <PageHeader
                    title={document.title}
                    subtitle={document.description || t('documents.noDescription')}
                    action={t('documents.download')}
                    actionIcon={<DownloadIcon />}
                    onActionClick={handleDownload}
                >
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            icon={getFileTypeIcon(document.fileType)}
                            label={getFileExtension(document.filePath)}
                            color="default"
                            size="small"
                        />
                        <Chip
                            color={CATEGORY_COLORS[document.category] || 'default'}
                            label={t(`documents.categories.${document.category.charAt(0).toLowerCase() + document.category.slice(1)}`)}
                            size="small"
                        />
                        {document.isTemplate && (
                            <Chip
                                icon={<FileIcon />}
                                label={t('documents.template')}
                                color="secondary"
                                size="small"
                            />
                        )}
                        {document.isConfidential && (
                            <Chip
                                icon={<LockIcon />}
                                label={t('documents.confidential')}
                                color="error"
                                size="small"
                            />
                        )}
                        {document.isSharedWithClient && (
                            <Chip
                                icon={<ShareIcon />}
                                label={t('documents.sharedWithClient')}
                                color="info"
                                size="small"
                            />
                        )}
                    </Box>
                </PageHeader>
            )}

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
                <>
                    {/* Tabs for different sections */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant={isMobile ? "scrollable" : "fullWidth"}
                            scrollButtons={isMobile ? "auto" : false}
                            centered={!isMobile}
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label={t('documents.details')} />
                            <Tab label={t('documents.versions')} />
                            <Tab label={t('documents.sharing')} />
                        </Tabs>
                    </Paper>

                    {/* Document Details Tab */}
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            {/* Main document info */}
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {t('documents.documentInfo')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.title')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {document.title}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.category')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {t(`documents.categories.${document.category.charAt(0).toLowerCase() + document.category.slice(1)}`)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.description')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {document.description || t('documents.noDescription')}
                                            </Typography>
                                        </Grid>
                                        {document.case && (
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {t('documents.relatedCase')}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <CaseIcon color="primary" sx={{ mr: 1 }} />
                                                    <Link
                                                        href={`/cases/${document.case.caseId}`}
                                                        underline="hover"
                                                        color="primary"
                                                    >
                                                        {document.case.caseNumber}: {document.case.title}
                                                    </Link>
                                                </Box>
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.tags')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                {documentTags.length > 0 ? (
                                                    documentTags.map((tag, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={tag}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('documents.noTags')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {t('documents.fileInfo')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.fileType')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                {getFileTypeIcon(document.fileType)}
                                                <Typography variant="body1" sx={{ ml: 1 }}>
                                                    {document.fileType || getFileExtension(document.filePath)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.fileSize')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatFileSize(document.fileSize)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('documents.uploadDate')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatDate(document.uploadDate)} {formatTime(document.uploadDate)}
                                            </Typography>
                                        </Grid>
                                        {document.lastModified && document.lastModified !== document.uploadDate && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {t('documents.lastModified')}
                                                </Typography>
                                                <Typography variant="body1">
                                                    {formatDate(document.lastModified)} {formatTime(document.lastModified)}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {document.versionNumber && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {t('documents.version')}
                                                </Typography>
                                                <Typography variant="body1">
                                                    {t('documents.versionNumber', { version: document.versionNumber })}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Sidebar - Actions and Metadata */}
                            <Grid item xs={12} md={4}>
                                {/* Document actions */}
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {t('documents.actions')}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<DownloadIcon />}
                                            onClick={handleDownload}
                                            disabled={!isOnline}
                                            sx={{ mb: 1 }}
                                        >
                                            {t('documents.download')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<UploadIcon />}
                                            onClick={handleOpenUploadVersionDialog}
                                            disabled={!isOnline}
                                            sx={{ mb: 1 }}
                                        >
                                            {t('documents.uploadNewVersion')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/documents/${document.documentId}/edit`)}
                                            disabled={!isOnline}
                                            sx={{ mb: 1 }}
                                        >
                                            {t('common.edit')}
                                        </Button>
                                        {isAdminOrLawyer && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                fullWidth
                                                startIcon={<DeleteIcon />}
                                                onClick={handleOpenDeleteDialog}
                                                disabled={!isOnline}
                                            >
                                                {t('common.delete')}
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>

                                {/* Uploader info */}
                                {document.uploadedBy && (
                                    <Card sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {t('documents.uploadedBy')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                                <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                                                    <PersonIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1">
                                                        {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDate(document.uploadDate)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Document properties */}
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {t('documents.properties')}
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    {document.isTemplate ? <FileIcon color="secondary" /> : <DescriptionIcon />}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={t('documents.isTemplate')}
                                                    secondary={document.isTemplate ? t('common.yes') : t('common.no')}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    {document.isConfidential ? <LockIcon color="error" /> : <UnlockIcon />}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={t('documents.isConfidential')}
                                                    secondary={document.isConfidential ? t('common.yes') : t('common.no')}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <ShareIcon color={document.isSharedWithClient ? "info" : "disabled"} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={t('documents.sharedWithClient')}
                                                    secondary={document.isSharedWithClient ? t('common.yes') : t('common.no')}
                                                />
                                            </ListItem>
                                        </List>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Versions Tab */}
                    {tabValue === 1 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                {t('documents.documentVersions')}
                            </Typography>

                            {documentVersions.length > 0 ? (
                                <List>
                                    {documentVersions.map((version, index) => (
                                        <React.Fragment key={version.documentId}>
                                            {index > 0 && <Divider component="li" />}
                                            <ListItem
                                                alignItems="flex-start"
                                                sx={{
                                                    backgroundColor: version.documentId === document.documentId ?
                                                        (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.08)')
                                                        : 'transparent'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: version.documentId === document.documentId ?
                                                                theme.palette.primary.main : theme.palette.grey[500]
                                                        }}
                                                    >
                                                        <VersionIcon />
                                                    </Avatar>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight={version.documentId === document.documentId ? 'bold' : 'normal'}>
                                                            {t('documents.versionNumber', { version: version.versionNumber || 1 })}
                                                            {version.documentId === document.documentId &&
                                                                ` (${t('documents.currentVersion')})`}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" color="text.primary">
                                                                {formatDate(version.uploadDate)} {formatTime(version.uploadDate)}
                                                            </Typography>
                                                            <Typography variant="body2" display="block">
                                                                {t('documents.uploadedBy')}: {version.uploadedBy?.firstName} {version.uploadedBy?.lastName}
                                                            </Typography>
                                                            <Typography variant="body2" display="block">
                                                                {t('documents.fileSize')}: {formatFileSize(version.fileSize)}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Tooltip title={t('documents.download')}>
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => documentService.downloadDocument(version.documentId, version.title)}
                                                            disabled={!isOnline}
                                                        >
                                                            <DownloadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        {t('documents.noVersionsFound')}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<UploadIcon />}
                                    onClick={handleOpenUploadVersionDialog}
                                    disabled={!isOnline}
                                >
                                    {t('documents.uploadNewVersion')}
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {/* Sharing Tab */}
                    {tabValue === 2 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                {t('documents.sharingSettings')}
                            </Typography>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="body1" paragraph>
                                    {t('documents.sharingDescription')}
                                </Typography>

                                <Alert severity="info" sx={{ mb: 3 }}>
                                    {t('documents.sharingInfo')}
                                </Alert>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={document.isSharedWithClient}
                                            onChange={handleShareWithClient}
                                            color="primary"
                                            disabled={!isOnline || document.isConfidential}
                                        />
                                    }
                                    label={t('documents.shareWithClient')}
                                />

                                {document.isConfidential && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        {t('documents.cannotShareConfidential')}
                                    </Alert>
                                )}
                            </Box>

                            {document.case && (
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {t('documents.relatedClients')}
                                    </Typography>

                                    {document.case.clients && document.case.clients.length > 0 ? (
                                        <List>
                                            {document.case.clients.map((client) => (
                                                <ListItem key={client.clientId}>
                                                    <ListItemIcon>
                                                        <Avatar>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`${client.firstName} ${client.lastName}`}
                                                        secondary={client.email}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {t('documents.noClientsForCase')}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    )}
                </>
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
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/documents')}
                    >
                        {t('documents.backToDocuments')}
                    </Button>
                </Paper>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>{t('documents.deleteDocument')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {document && t('documents.deleteConfirmation', { title: document.title })}
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="error">
                            {t('common.actionCannotBeUndone')}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteDocument}
                        color="error"
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {deleteLoading ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload New Version Dialog */}
            <Dialog
                open={uploadVersionDialogOpen}
                onClose={handleCloseUploadVersionDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{t('documents.uploadNewVersion')}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        {t('documents.uploadNewVersionDesc')}
                    </DialogContentText>

                    <Box sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        mb: 2,
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}>
                        {!uploadFile ? (
                            <>
                                <input
                                    accept="*/*"
                                    style={{ display: 'none' }}
                                    id="upload-version-button"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="upload-version-button">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<UploadIcon />}
                                    >
                                        {t('documents.selectFile')}
                                    </Button>
                                </label>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {t('documents.dragAndDropHint')}
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {getFileTypeIcon(uploadFile.type)}
                                    <Typography variant="body1" sx={{ ml: 1 }}>
                                        {uploadFile.name}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {t('documents.fileSize')}: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    onClick={() => setUploadFile(null)}
                                    sx={{ mt: 1 }}
                                >
                                    {t('documents.selectDifferentFile')}
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {document && (
                        <Typography variant="body2" color="text.secondary">
                            {t('documents.currentVersion')}: {t('documents.versionNumber', { version: document.versionNumber || 1 })}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUploadVersionDialog} disabled={uploadLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleUploadVersion}
                        variant="contained"
                        color="primary"
                        disabled={uploadLoading || !uploadFile || !isOnline}
                        startIcon={uploadLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {uploadLoading ? t('documents.uploading') : t('documents.upload')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DocumentDetailsPage;