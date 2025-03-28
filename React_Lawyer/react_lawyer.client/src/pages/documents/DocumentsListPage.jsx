// src/pages/documents/DocumentsListPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Chip,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
    Snackbar,
    Alert,
    Skeleton,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudDownload as DownloadIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import documentService from '../../services/documentService';
import PageHeader from '../../components/common/PageHeader';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Document type display names and colors
const DOCUMENT_TYPES = {
    LETTER: { label: 'Letter', color: 'primary' },
    CONTRACT: { label: 'Contract', color: 'secondary' },
    PLEADING: { label: 'Pleading', color: 'success' },
    MOTION: { label: 'Motion', color: 'warning' },
    AGREEMENT: { label: 'Agreement', color: 'info' },
    MEMO: { label: 'Memo', color: 'default' },
    OTHER: { label: 'Other', color: 'default' }
};

const DocumentsListPage = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    // State for documents data
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filtering and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCase, setFilterCase] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);

    // Fetch documents on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const documentsData = await documentService.getDocuments();

                // Also fetch cases and clients for filter dropdowns
                const [casesData, clientsData] = await Promise.all([
                    documentService.getCases(),
                    documentService.getClients()
                ]);

                setDocuments(documentsData);
                setCases(casesData);
                setClients(clientsData);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError('Failed to load documents. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle pagination change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    // Reset all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setFilterCase('');
        setFilterClient('');
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
        if (!documentToDelete) return;

        try {
            await documentService.deleteDocument(documentToDelete.documentId);

            // Remove deleted document from state
            setDocuments(documents.filter(doc => doc.documentId !== documentToDelete.documentId));

            setSuccess('Document deleted successfully');
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Failed to delete document. Please try again.');
        }
    };

    // Apply filters to documents
    const filteredDocuments = documents.filter(document => {
        // Apply text search
        const matchesSearch = searchTerm === '' ||
            document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // Apply document type filter
        const matchesType = filterType === '' || document.documentType === filterType;

        // Apply case filter
        const matchesCase = filterCase === '' || document.caseId === parseInt(filterCase);

        // Apply client filter
        const matchesClient = filterClient === '' || document.clientId === parseInt(filterClient);

        return matchesSearch && matchesType && matchesCase && matchesClient;
    });

    // Apply pagination
    const paginatedDocuments = filteredDocuments.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Document type chip component
    const DocumentTypeChip = ({ type }) => {
        const docType = DOCUMENT_TYPES[type] || DOCUMENT_TYPES.OTHER;
        return (
            <Chip
                label={docType.label}
                color={docType.color}
                size="small"
                variant="outlined"
            />
        );
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <Box>
            <PageHeader
                title="Documents"
                subtitle="Create, edit and manage legal documents"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Documents' }
                ]}
                action={true}
                actionText="Create Document"
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/documents/create')}
            />

            {/* Filters and Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Search Documents"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Document Type</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                label="Document Type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                {Object.entries(DOCUMENT_TYPES).map(([value, { label }]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Case</InputLabel>
                            <Select
                                value={filterCase}
                                onChange={(e) => setFilterCase(e.target.value)}
                                label="Case"
                            >
                                <MenuItem value="">All Cases</MenuItem>
                                {cases.map((caseItem) => (
                                    <MenuItem key={caseItem.caseId} value={caseItem.caseId.toString()}>
                                        {caseItem.title} ({caseItem.caseNumber})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Client</InputLabel>
                            <Select
                                value={filterClient}
                                onChange={(e) => setFilterClient(e.target.value)}
                                label="Client"
                            >
                                <MenuItem value="">All Clients</MenuItem>
                                {clients.map((client) => (
                                    <MenuItem key={client.clientId} value={client.clientId.toString()}>
                                        {client.firstName} {client.lastName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} display="flex" justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={handleClearFilters}
                            disabled={!searchTerm && !filterType && !filterCase && !filterClient}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Documents Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '60vh' }}>
                    <Table stickyHeader aria-label="documents table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Related Case</TableCell>
                                <TableCell>Related Client</TableCell>
                                <TableCell>Last Modified</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                // Show skeleton loading state
                                Array.from(new Array(5)).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                        <TableCell align="center">
                                            <Skeleton variant="rectangular" width={120} height={36} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedDocuments.length === 0 ? (
                                // No results message
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body1" sx={{ py: 5 }}>
                                            {documents.length === 0
                                                ? "No documents found. Create your first document by clicking the 'Create Document' button."
                                                : "No documents match your search criteria."}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Document rows
                                paginatedDocuments.map((document) => {
                                    // Find related case and client info
                                    const relatedCase = cases.find(c => c.caseId === document.caseId);
                                    const relatedClient = clients.find(c => c.clientId === document.clientId);

                                    return (
                                        <TableRow key={document.documentId} hover>
                                            <TableCell>
                                                <Typography variant="body2">{document.title}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <DocumentTypeChip type={document.documentType} />
                                            </TableCell>
                                            <TableCell>
                                                {relatedCase ? (
                                                    <Typography variant="body2">
                                                        {relatedCase.title}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        None
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {relatedClient ? (
                                                    <Typography variant="body2">
                                                        {relatedClient.firstName} {relatedClient.lastName}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        None
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(document.lastModified)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Document">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => navigate(`/documents/${document.documentId}`)}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Document">
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={() => navigate(`/documents/${document.documentId}/edit`)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download">
                                                    <IconButton
                                                        color="default"
                                                        onClick={() => {
                                                            // In a real app, implement download logic
                                                            setSuccess('Download started');
                                                        }}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleOpenDeleteDialog(document)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredDocuments.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the document "{documentToDelete?.title}"?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button
                        onClick={handleDeleteDocument}
                        color="error"
                        autoFocus
                        disabled={!isOnline}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentsListPage;