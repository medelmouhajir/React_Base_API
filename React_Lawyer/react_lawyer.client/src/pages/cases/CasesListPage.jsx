import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import caseService from '../../services/caseService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const CasesListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCases, setTotalCases] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [caseType, setCaseType] = useState('All');
    const [caseStatus, setCaseStatus] = useState('All');

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [caseToDelete, setCaseToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Case status color mapping
    const STATUS_COLORS = {
        0: 'info',      // Intake
        1: 'success',   // Active
        2: 'warning',   // Pending
        3: 'default',   // Closed
        4: 'default'    // Archived
    };

    // Case types
    const CASE_TYPES = [
        { value: 'All', label: t('common.all') },
        { value: 'Civil', label: t('cases.types.civil') },
        { value: 'Criminal', label: t('cases.types.criminal') },
        { value: 'Family', label: t('cases.types.family') },
        { value: 'Immigration', label: t('cases.types.immigration') },
        { value: 'Corporate', label: t('cases.types.corporate') },
        { value: 'RealEstate', label: t('cases.types.realEstate') },
        { value: 'Bankruptcy', label: t('cases.types.bankruptcy') },
        { value: 'IntellectualProperty', label: t('cases.types.intellectualProperty') },
        { value: 'Tax', label: t('cases.types.tax') },
        { value: 'Other', label: t('cases.types.other') }
    ];

    // Case statuses
    const CASE_STATUSES = [
        { value: 'All', label: t('common.all') },
        { value: 'Intake', label: t('cases.status.intake') },
        { value: 'Active', label: t('cases.status.active') },
        { value: 'Pending', label: t('cases.status.pending') },
        { value: 'Closed', label: t('cases.status.closed') },
        { value: 'Archived', label: t('cases.status.archived') }
    ];

    // Get status label from numeric value
    const getStatusLabel = (statusValue) => {
        switch (statusValue) {
            case 0: return t('cases.status.intake');
            case 1: return t('cases.status.active');
            case 2: return t('cases.status.pending');
            case 3: return t('cases.status.closed');
            case 4: return t('cases.status.archived');
            default: return t('common.unknown');
        }
    };

    // Get case type label
    const getCaseTypeLabel = (typeValue) => {
        const typeItem = CASE_TYPES.find(type => type.value === typeValue);
        return typeItem ? typeItem.label : t('common.unknown');
    };

    // Fetch cases
    useEffect(() => {
        const fetchCases = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let data;

                // Use search API if search term is provided
                if (searchTerm) {
                    data = await caseService.searchCases(searchTerm);
                } else {
                    // Otherwise get all cases or cases by firm
                    data = await caseService.getCases();
                }

                // Apply client-side filters
                let filteredData = [...data];

                // Filter by case type
                if (caseType !== 'All') {
                    // Find the index of the type in CASE_TYPES, subtracting 1 to account for "All"
                    const typeEnumValue = CASE_TYPES.findIndex(t => t.value === caseType) - 1;
                    if (typeEnumValue >= 0) {
                        filteredData = filteredData.filter(c => c.type === typeEnumValue);
                    }
                }

                // Filter by case status
                if (caseStatus !== 'All') {
                    // Find the index of the status in CASE_STATUSES, subtracting 1 to account for "All"
                    const statusEnumValue = CASE_STATUSES.findIndex(s => s.value === caseStatus) - 1;
                    if (statusEnumValue >= 0) {
                        filteredData = filteredData.filter(c => c.status === statusEnumValue);
                    }
                }

                // Sort by case creation date (newest first)
                filteredData.sort((a, b) => new Date(b.openDate) - new Date(a.openDate));

                setTotalCases(filteredData.length);
                setCases(filteredData);
            } catch (err) {
                console.error('Error fetching cases:', err);
                setError(t('cases.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, [user, searchTerm, caseType, caseStatus, refreshTrigger, isOnline, t]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (caseItem) => {
        setCaseToDelete(caseItem);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setCaseToDelete(null);
    };

    // Handle case deletion
    const handleDeleteCase = async () => {
        if (!caseToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            await caseService.deleteCase(caseToDelete.caseId);

            // Refresh cases list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting case:', err);
            setError(t('cases.deleteError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate paged data
    const pagedCases = cases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Container width="lg" maxWidth="lg">
            <PageHeader
                title={t('cases.cases')}
                subtitle={t('cases.casesSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('cases.cases') }
                ]}
                action={t('cases.newCase')}
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/cases/new')}
            />

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

            {/* Search and filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder={t('cases.searchPlaceholder')}
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="type-filter-label">{t('cases.type')}</InputLabel>
                            <Select
                                labelId="type-filter-label"
                                id="type-filter"
                                value={caseType}
                                onChange={(e) => setCaseType(e.target.value)}
                                label={t('cases.type')}
                            >
                                {CASE_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="status-filter-label">{t('cases.status')}</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                id="status-filter"
                                value={caseStatus}
                                onChange={(e) => setCaseStatus(e.target.value)}
                                label={t('cases.status')}
                            >
                                {CASE_STATUSES.map(status => (
                                    <MenuItem key={status.value} value={status.value}>
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                        <Grid item>
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                disabled={!isOnline || loading}
                            >
                                {t('common.refresh')}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cases table */}
            <Paper>
                <TableContainer sx={{
                    overflowX: 'auto',
                    '& .MuiTableCell-root': {
                        px: { xs: 1, sm: 2 },
                        py: { xs: 1.5, sm: 2 },
                        whiteSpace: { xs: 'nowrap', sm: 'normal' }
                    }
                }}>
                    <Table aria-label="cases table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('cases.caseNumber')}</TableCell>
                                <TableCell>{t('cases.title')}</TableCell>
                                <TableCell>{t('cases.type')}</TableCell>
                                <TableCell>{t('cases.status')}</TableCell>
                                <TableCell>{t('cases.openDate')}</TableCell>
                                <TableCell>{t('cases.assignedTo')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={200}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedCases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={100}>
                                        <Typography variant="body1" color="textSecondary">
                                            {searchTerm
                                                ? t('cases.noSearchResults')
                                                : t('cases.noCasesFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedCases.map((caseItem) => (
                                    <TableRow key={caseItem.caseId} hover>
                                        <TableCell>{caseItem.caseNumber}</TableCell>
                                        <TableCell>
                                            <Typography
                                                fontWeight={caseItem.isUrgent ? 'bold' : 'normal'}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {caseItem.isUrgent && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            bgcolor: 'error.main',
                                                            borderRadius: '50%',
                                                            display: 'inline-block',
                                                            mr: 1
                                                        }}
                                                    />
                                                )}
                                                {caseItem.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getCaseTypeLabel(caseItem.type)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={STATUS_COLORS[caseItem.status] || 'default'}
                                                size="small"
                                                label={getStatusLabel(caseItem.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(caseItem.openDate)}
                                        </TableCell>
                                        <TableCell>
                                            {caseItem.assignedLawyer && caseItem.assignedLawyer.user
                                                ? `${caseItem.assignedLawyer.user.firstName} ${caseItem.assignedLawyer.user.lastName}`
                                                : t('cases.unassigned')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('common.view')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}/edit`)}
                                                    disabled={!isOnline}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.delete')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDeleteDialog(caseItem)}
                                                    disabled={!isOnline}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
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
                    count={totalCases}
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
                <DialogTitle>{t('cases.deleteCase')}</DialogTitle>
                <DialogContent>
                    {caseToDelete && (
                        <Typography variant="body1">
                            {t('cases.deleteConfirmation', {
                                caseNumber: caseToDelete.caseNumber || '',
                                title: caseToDelete.title || ''
                            })}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        disabled={deleteLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteCase}
                        color="error"
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CasesListPage;