// src/pages/clients/ClientsListPage.jsx
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
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import clientService from '../../services/clientService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ClientsListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalClients, setTotalClients] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let data;

                if (searchTerm) {
                    setSearching(true);
                    data = await clientService.searchClients(searchTerm);
                    setSearching(false);
                } else {
                    data = await clientService.getClients();
                }

                // Apply type filter
                let filteredData = [...data];
                if (filterType !== 'All') {
                    filteredData = filteredData.filter(c => c.type === filterType);
                }

                // Sort by name
                filteredData.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));

                setTotalClients(filteredData.length);
                setClients(filteredData);
            } catch (err) {
                console.error('Error fetching clients:', err);
                setError(t('clients.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [user, searchTerm, filterType, refreshTrigger, isOnline, t]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(0); // Reset to first page when searching
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (client) => {
        setClientToDelete(client);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setClientToDelete(null);
    };

    // Handle client deletion
    const handleDeleteClient = async () => {
        if (!clientToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            await clientService.deleteClient(clientToDelete.clientId);

            // Show success message
            // Refresh clients list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(t('clients.deleteError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate paged data
    const pagedClients = clients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Get client type icon
    const getClientTypeIcon = (type) => {
        switch (type) {
            case 'Corporate':
                return <BusinessIcon fontSize="small" />;
            case 'Individual':
                return <PersonIcon fontSize="small" />;
            default:
                return null;
        }
    };

    // Get client type label
    const getClientTypeLabel = (type) => {
        return t(`clients.${type.toLowerCase()}`);
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('clients.clients')}
                subtitle={t('clients.clientsSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('clients.clients') }
                ]}
                action={t('clients.newClient')}
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/clients/new')}
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

            {/* Search and Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder={t('clients.searchPlaceholder')}
                            value={searchTerm}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClearSearch} size="small">
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                            fullWidth
                        >
                            {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                        </Button>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            disabled={!isOnline || loading}
                            fullWidth
                        >
                            {t('common.refresh')}
                        </Button>
                    </Grid>

                    {showFilters && (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="type-filter-label">{t('clients.type')}</InputLabel>
                                <Select
                                    labelId="type-filter-label"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    label={t('clients.type')}
                                >
                                    <MenuItem value="All">{t('common.all')}</MenuItem>
                                    <MenuItem value="Individual">{t('clients.individual')}</MenuItem>
                                    <MenuItem value="Corporate">{t('clients.corporate')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Clients Table */}
            <Paper>
                <TableContainer>
                    <Table aria-label="clients table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('clients.client')}</TableCell>
                                <TableCell>{t('clients.email')}</TableCell>
                                <TableCell>{t('clients.phone')}</TableCell>
                                <TableCell>{t('clients.type')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" height={200}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" height={100}>
                                        <Typography variant="body1" color="textSecondary">
                                            {searchTerm
                                                ? t('clients.noSearchResults')
                                                : t('clients.noClientsFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedClients.map((client) => (
                                    <TableRow key={client.clientId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getClientTypeIcon(client.type)}
                                                <Box sx={{ ml: 1 }}>
                                                    <Typography variant="body1">
                                                        {client.lastName}, {client.firstName}
                                                    </Typography>
                                                    {client.type === 'Corporate' && client.companyName && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {client.companyName}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{client.email || '-'}</TableCell>
                                        <TableCell>{client.phoneNumber || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={getClientTypeLabel(client.type)}
                                                color={client.type === 'Corporate' ? 'primary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('common.view')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/clients/${client.clientId}`)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/clients/${client.clientId}/edit`)}
                                                    disabled={!isOnline}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.delete')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDeleteDialog(client)}
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
                    count={totalClients}
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
                <DialogTitle>{t('clients.deleteClient')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {clientToDelete && t('clients.deleteConfirmation', {
                            firstName: clientToDelete.firstName,
                            lastName: clientToDelete.lastName
                        })}
                    </DialogContentText>
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                        {t('common.actionCannotBeUndone')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        disabled={deleteLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteClient}
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

export default ClientsListPage;