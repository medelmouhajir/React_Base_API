// src/pages/documents/DocumentsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    FormControlLabel,
    InputLabel,
    Select,
    Switch,
    Grid,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    CloudUpload as UploadIcon,
    CloudDownload as DownloadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    FileCopy as FileIcon,
    Description as DescriptionIcon,
    ListAlt as TemplateIcon,
    Share as ShareIcon,
    Lock as LockIcon
} from '@mui/icons-material';

// Components and Services
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

const DocumentsListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();
    const { isMobile } = useThemeMode();

    // State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [filterText, setFilterText] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [viewMode, setViewMode] = useState('All'); // All, Templates, Documents
    const [showFilters, setShowFilters] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Upload dialog
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: 'Other',
        isConfidential: false,
        isTemplate: false,
        isSharedWithClient: false,
        caseId: '', // Will be populated with available cases
        tags: ''
    });
    const [uploadLoading, setUploadLoading] = useState(false);
    const [cases, setCases] = useState([]);

    // Fetch documents
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!isOnline && documents.length === 0) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let fetchedDocuments;

                // Fetch based on view mode
                if (viewMode === 'Templates') {
                    fetchedDocuments = await documentService.getTemplates();
                } else if (viewMode === 'Documents') {
                    fetchedDocuments = await documentService.getDocuments();
                } else {
                    fetchedDocuments = await documentService.getAllDocuments();
                }

                // Apply filters
                let filteredDocs = fetchedDocuments;

                if (filterText) {
                    const searchTerm = filterText.toLowerCase();
                    filteredDocs = filteredDocs.filter(doc =>
                        doc.title.toLowerCase().includes(searchTerm) ||
                        (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
                        (doc.tags && doc.tags.toLowerCase().includes(searchTerm))
                    );
                }

                if (filterCategory !== 'All') {
                    filteredDocs = filteredDocs.filter(doc => doc.category === filterCategory);
                }

                if (filterType !== 'All') {
                    filteredDocs = filteredDocs.filter(doc => doc.fileType.toLowerCase().includes(filterType.toLowerCase()));
                }

                // Sort by upload date (newest first)
                filteredDocs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

                setTotalDocuments(filteredDocs.length);
                setDocuments(filteredDocs);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError(t('documents.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [refreshTrigger, viewMode, filterText, filterCategory, filterType, isOnline, t, documents.length]);

    // Fetch cases for document uploads
    useEffect(() => {
        const fetchCases = async () => {
            if (!isOnline) return;

            try {
                const casesData = await documentService.getCases();
                setCases(casesData);
            } catch (err) {
                console.error('Error fetching cases:', err);
            }
        };

        if (uploadDialogOpen) {
            fetchCases();
        }
    }, [uploadDialogOpen, isOnline]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle search text change
    const handleSearchChange = (event) => {
        setFilterText(event.target.value);
        setPage(0);
    };

    // Clear search
    const handleClearSearch = () => {
        setFilterText('');
    };

    // Handle category filter change
    const handleCategoryChange = (event) => {
        setFilterCategory(event.target.value);
        setPage(0);
    };

    // Handle file type filter change
    const handleTypeChange = (event) => {
        setFilterType(event.target.value);
        setPage(0);
    };

    // Handle view mode change
    const handleViewModeChange = (event) => {
        setViewMode(event.target.value);
        setPage(0);
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (document) => {
        setDocumentToDelete(document);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
    };

    // Handle document deletion
    const handleDeleteDocument = async () => {
        if (!documentToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            await documentService.deleteDocument(documentToDelete.documentId);

            // Show success message
            setSuccess(t('documents.deleteSuccess'));

            // Refresh documents list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting document:', err);
            setError(t('documents.deleteError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Open upload dialog
    const handleOpenUploadDialog = () => {
        setUploadDialogOpen(true);
        setUploadFile(null);
        setUploadData({
            title: '',
            description: '',
            category: 'Other',
            isConfidential: false,
            isTemplate: false,
            isSharedWithClient: false,
            caseId: '',
            tags: ''
        });
    };

    // Close upload dialog
    const handleCloseUploadDialog = () => {
        setUploadDialogOpen(false);
    };

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadFile(file);
            // Auto-fill title with file name (without extension)
            const fileName = file.name.split('.').slice(0, -1).join('.');
            setUploadData(prev => ({
                ...prev,
                title: fileName || file.name
            }));
        }
    };

    // Handle upload form field changes
    const handleUploadDataChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUploadData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Submit document upload
    const handleUploadSubmit = async () => {
        if (!uploadFile || !uploadData.title || !isOnline) return;

        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadData.title);
            formData.append('description', uploadData.description);
            formData.append('category', uploadData.category);
            formData.append('isConfidential', uploadData.isConfidential);
            formData.append('isTemplate', uploadData.isTemplate);
            formData.append('isSharedWithClient', uploadData.isSharedWithClient);
            formData.append('caseId', uploadData.caseId);
            formData.append('tags', uploadData.tags);
            formData.append('uploadedById', user.id);
            formData.append('lawFirmId', user?.lawFirmId || 0);

            await documentService.uploadDocument(formData);

            // Show success message
            setSuccess(t('documents.uploadSuccess'));

            // Close dialog and refresh
            handleCloseUploadDialog();
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error uploading document:', err);
            setError(t('documents.uploadError'));
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle document download
    const handleDownload = async (document) => {
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        try {
            await documentService.downloadDocument(document.documentId, document.title);
        } catch (err) {
            console.error('Error downloading document:', err);
            setError(t('documents.downloadError'));
        }
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

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Clear success message
    const handleClearSuccess = () => {
        setSuccess('');
    };

    // Calculate documents to display on current page
    const pagedDocuments = documents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('documents.documents')}
                subtitle={viewMode === 'Templates'
                    ? t('documents.templatesSubtitle')
                    : t('documents.documentsSubtitle', { count: totalDocuments })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('documents.documents') }
                ]}
                action={t('documents.uploadDocument')}
                actionIcon={<UploadIcon />}
                onActionClick={handleOpenUploadDialog}
            />

            {/* Success message */}
            {success && (
                <Alert
                    severity="success"
                    sx={{ mb: 3 }}
                    onClose={handleClearSuccess}
                >
                    {success}
                </Alert>
            )}

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

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Search and View Mode Controls */}
                    <Grid item xs={12} md={showFilters ? 6 : 8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder={t('documents.searchPlaceholder')}
                                variant="outlined"
                                size="small"
                                value={filterText}
                                onChange={handleSearchChange}
                                sx={{ minWidth: 200, flex: isMobile ? 1 : 'auto' }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filterText && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="clear search"
                                                onClick={handleClearSearch}
                                                edge="end"
                                                size="small"
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id="view-mode-label">{t('documents.viewMode')}</InputLabel>
                                <Select
                                    labelId="view-mode-label"
                                    value={viewMode}
                                    onChange={handleViewModeChange}
                                    label={t('documents.viewMode')}
                                >
                                    <MenuItem value="All">{t('common.all')}</MenuItem>
                                    <MenuItem value="Documents">{t('documents.documents')}</MenuItem>
                                    <MenuItem value="Templates">{t('documents.templates')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Filter Toggle and Refresh */}
                    <Grid item xs={12} md={showFilters ? 6 : 4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ mr: 1 }}
                        >
                            {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                        </Button>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            disabled={!isOnline || loading}
                        >
                            {t('common.refresh')}
                        </Button>
                    </Grid>

                    {/* Additional Filters */}
                    {showFilters && (
                        <>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="category-filter-label">{t('documents.category')}</InputLabel>
                                    <Select
                                        labelId="category-filter-label"
                                        id="category-filter"
                                        value={filterCategory}
                                        onChange={handleCategoryChange}
                                        label={t('documents.category')}
                                    >
                                        <MenuItem value="All">{t('common.all')}</MenuItem>
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

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="type-filter-label">{t('documents.fileType')}</InputLabel>
                                    <Select
                                        labelId="type-filter-label"
                                        id="type-filter"
                                        value={filterType}
                                        onChange={handleTypeChange}
                                        label={t('documents.fileType')}
                                    >
                                        <MenuItem value="All">{t('common.all')}</MenuItem>
                                        <MenuItem value="pdf">PDF</MenuItem>
                                        <MenuItem value="doc">Word</MenuItem>
                                        <MenuItem value="xls">Excel</MenuItem>
                                        <MenuItem value="ppt">PowerPoint</MenuItem>
                                        <MenuItem value="txt">Text</MenuItem>
                                        <MenuItem value="image">Images</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            {/* Documents table */}
            <Paper>

                <TableContainer sx={{
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme => theme.palette.divider,
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.05)',
                    }
                }}>
                    <Table aria-label="documents table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('documents.title')}</TableCell>
                                <TableCell>{t('documents.category')}</TableCell>
                                <TableCell>{t('documents.uploadDate')}</TableCell>
                                {!isMobile && <TableCell>{t('documents.uploadedBy')}</TableCell>}
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={isMobile ? 4 : 5} align="center" height={200}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isMobile ? 4 : 5} align="center" height={100}>
                                        <Typography variant="body1" color="textSecondary">
                                            {viewMode === 'Templates'
                                                ? t('documents.noTemplatesUploaded')
                                                : t('documents.noDocumentsUploaded')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedDocuments.map((document) => (
                                    <TableRow key={document.documentId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                {getFileTypeIcon(document.fileType)}
                                                <Box sx={{ ml: 2 }}>
                                                    <Typography fontWeight={document.isConfidential ? 'bold' : 'normal'}>
                                                        {document.title}
                                                    </Typography>
                                                    {document.description && (
                                                        <Typography variant="body2" color="textSecondary" noWrap>
                                                            {document.description.length > (isMobile ? 30 : 50)
                                                                ? `${document.description.substring(0, isMobile ? 30 : 50)}...`
                                                                : document.description}
                                                        </Typography>
                                                    )}
                                                    {/* Show uploader on mobile inline here since we hide that column */}
                                                    {isMobile && document.uploadedBy && (
                                                        <Typography variant="caption" color="textSecondary" display="block">
                                                            {t('documents.by')}: {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        {document.isTemplate && (
                                                            <Chip
                                                                label={t('documents.template')}
                                                                size="small"
                                                                color="secondary"
                                                                icon={<TemplateIcon />}
                                                            />
                                                        )}
                                                        {document.isConfidential && (
                                                            <Chip
                                                                label={t('documents.confidential')}
                                                                size="small"
                                                                color="error"
                                                                icon={<LockIcon />}
                                                            />
                                                        )}
                                                        {document.isSharedWithClient && (
                                                            <Chip
                                                                label={t('documents.sharedWithClient')}
                                                                size="small"
                                                                color="info"
                                                                icon={<ShareIcon />}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={CATEGORY_COLORS[document.category] || 'default'}
                                                size="small"
                                                label={t(`documents.categories.${document.category.charAt(0).toLowerCase() + document.category.slice(1)}`)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(document.uploadDate)}
                                            {document.lastModified && document.lastModified !== document.uploadDate && (
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    {t('documents.modified')}: {formatDate(document.lastModified)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        {!isMobile && (
                                            <TableCell>
                                                {document.uploadedBy
                                                    ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`
                                                    : t('common.unknown')}
                                            </TableCell>
                                        )}
                                        <TableCell align="right">
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                flexWrap: isMobile ? 'wrap' : 'nowrap',
                                                gap: isMobile ? 1 : 0
                                            }}>
                                                <Tooltip title={t('common.view')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/documents/${document.documentId}`)}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('documents.download')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownload(document)}
                                                        disabled={!isOnline}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common.edit')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/documents/${document.documentId}/edit`)}
                                                        disabled={!isOnline}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common.delete')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleOpenDeleteDialog(document)}
                                                        disabled={!isOnline}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalDocuments}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={t('common.rowsPerPage')}
                />
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>{t('documents.deleteDocument')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {documentToDelete && t('documents.deleteConfirmation', { title: documentToDelete.title })}
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

            {/* Upload Document Dialog */}
            <Dialog
                open={uploadDialogOpen}
                onClose={handleCloseUploadDialog}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>{t('documents.uploadDocument')}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        {/* File Upload */}
                        <Grid item xs={12}>
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
                                            id="upload-file-button"
                                            type="file"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="upload-file-button">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<UploadIcon />}
                                            >
                                                {t('documents.selectFile')}
                                            </Button>
                                        </label>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
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
                                        <Typography variant="body2" color="textSecondary">
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
                        </Grid>

                        {/* Document Metadata */}
                        {uploadFile && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label={t('documents.title')}
                                        name="title"
                                        value={uploadData.title}
                                        onChange={handleUploadDataChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('documents.description')}
                                        name="description"
                                        value={uploadData.description}
                                        onChange={handleUploadDataChange}
                                        multiline
                                        rows={2}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="document-category-label">{t('documents.category')}</InputLabel>
                                        <Select
                                            labelId="document-category-label"
                                            name="category"
                                            value={uploadData.category}
                                            onChange={handleUploadDataChange}
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
                                    <FormControl fullWidth>
                                        <InputLabel id="document-case-label">{t('documents.relatedCase')}</InputLabel>
                                        <Select
                                            labelId="document-case-label"
                                            name="caseId"
                                            value={uploadData.caseId}
                                            onChange={handleUploadDataChange}
                                            label={t('documents.relatedCase')}
                                        >
                                            <MenuItem value="">{t('common.none')}</MenuItem>
                                            {cases.map((caseItem) => (
                                                <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                                    {caseItem.caseNumber} - {caseItem.title}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('documents.tags')}
                                        name="tags"
                                        value={uploadData.tags}
                                        onChange={handleUploadDataChange}
                                        placeholder={t('documents.tagsPlaceholder')}
                                        helperText={t('documents.tagsHelp')}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={2}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={uploadData.isTemplate}
                                                    onChange={handleUploadDataChange}
                                                    name="isTemplate"
                                                    color="secondary"
                                                />
                                            }
                                            label={t('documents.saveAsTemplate')}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={uploadData.isConfidential}
                                                    onChange={handleUploadDataChange}
                                                    name="isConfidential"
                                                    color="error"
                                                />
                                            }
                                            label={t('documents.confidential')}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={uploadData.isSharedWithClient}
                                                    onChange={handleUploadDataChange}
                                                    name="isSharedWithClient"
                                                    color="info"
                                                />
                                            }
                                            label={t('documents.shareWithClient')}
                                        />
                                    </Stack>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUploadDialog} disabled={uploadLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleUploadSubmit}
                        variant="contained"
                        color="primary"
                        disabled={uploadLoading || !uploadFile || !uploadData.title || !isOnline}
                        startIcon={uploadLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {uploadLoading ? t('documents.uploading') : t('documents.upload')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DocumentsListPage;