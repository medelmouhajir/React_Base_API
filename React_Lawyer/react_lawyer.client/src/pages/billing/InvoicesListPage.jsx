// src/pages/billing/InvoicesListPage.jsx
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
    InputLabel,
    Select,
    Grid,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Receipt as ReceiptIcon,
    PaymentOutlined as PaymentIcon,
    Send as SendIcon,
    Print as PrintIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    Sort as SortIcon,
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import invoiceService from '../../services/invoiceService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Invoice status color mapping
const STATUS_COLORS = {
    'Draft': 'default',
    'Issued': 'primary',
    'Sent': 'info',
    'Overdue': 'error',
    'PartiallyPaid': 'warning',
    'Paid': 'success',
    'Cancelled': 'error',
    'Disputed': 'error'
};

const InvoicesListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [filterText, setFilterText] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Payment dialog
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [invoiceToPayment, setInvoiceToPayment] = useState(null);

    // Fetch invoices
    useEffect(() => {
        const fetchInvoices = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let data;

                // Get the appropriate invoices based on the user's role and firm
                if (user?.lawFirmId) {
                    data = await invoiceService.getInvoicesByFirm(user.lawFirmId);
                } else {
                    data = await invoiceService.getAllInvoices();
                }

                // Apply filters
                let filteredData = [...data];

                // Filter by status
                if (filterStatus !== 'All') {
                    filteredData = filteredData.filter(i => i.status === filterStatus);
                }

                // Filter by text (invoice number, client name, etc.)
                if (filterText) {
                    const searchTerm = filterText.toLowerCase();
                    filteredData = filteredData.filter(i =>
                        i.invoiceNumber.toLowerCase().includes(searchTerm) ||
                        (i.client && (
                            `${i.client.firstName} ${i.client.lastName}`.toLowerCase().includes(searchTerm) ||
                            (i.client.companyName && i.client.companyName.toLowerCase().includes(searchTerm))
                        )) ||
                        (i.case && i.case.title.toLowerCase().includes(searchTerm))
                    );
                }

                // Filter by date range
                if (dateRange.startDate) {
                    const startDate = new Date(dateRange.startDate);
                    filteredData = filteredData.filter(i => new Date(i.issueDate) >= startDate);
                }

                if (dateRange.endDate) {
                    const endDate = new Date(dateRange.endDate);
                    endDate.setHours(23, 59, 59, 999); // End of day
                    filteredData = filteredData.filter(i => new Date(i.issueDate) <= endDate);
                }

                // Sort by issue date (most recent first)
                filteredData.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

                setTotalInvoices(filteredData.length);
                setInvoices(filteredData);
            } catch (err) {
                console.error('Error fetching invoices:', err);
                setError(t('billing.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [user, filterText, filterStatus, dateRange, refreshTrigger, isOnline, t]);

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

    // Handle status filter change
    const handleStatusChange = (event) => {
        setFilterStatus(event.target.value);
        setPage(0);
    };

    // Handle date range change
    const handleDateRangeChange = (event) => {
        const { name, value } = event.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
        setPage(0);
    };

    // Clear date range
    const handleClearDateRange = () => {
        setDateRange({ startDate: '', endDate: '' });
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (invoice) => {
        setInvoiceToDelete(invoice);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
    };

    // Handle invoice deletion
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            await invoiceService.deleteInvoice(invoiceToDelete.invoiceId);

            // Refresh invoices list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting invoice:', err);
            setError(t('billing.deleteError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Open payment dialog
    const handleOpenPaymentDialog = (invoice) => {
        setInvoiceToPayment(invoice);
        setPaymentDialogOpen(true);
    };

    // Close payment dialog
    const handleClosePaymentDialog = () => {
        setPaymentDialogOpen(false);
        setInvoiceToPayment(null);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Format currency
    const formatCurrency = (amount) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    // Calculate total and outstanding amount
    const calculateTotal = (invoice) => {
        return invoice.amount + invoice.taxAmount;
    };

    const calculateOutstanding = (invoice) => {
        return calculateTotal(invoice) - invoice.paidAmount;
    };

    // Handle invoice status update (e.g., mark as sent)
    const handleUpdateStatus = async (invoice, newStatus) => {
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        try {
            await invoiceService.updateInvoiceStatus(invoice.invoiceId, newStatus, {
                userId: user.id
            });

            // Refresh invoices list
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error updating invoice status:', err);
            setError(t('billing.statusUpdateError'));
        }
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Calculate paged data
    const pagedInvoices = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('billing.invoices')}
                subtitle={t('billing.invoicesSubtitle', { count: totalInvoices })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.invoices') }
                ]}
                action={t('billing.createInvoice')}
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/billing/invoices/new')}
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

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                placeholder={t('billing.searchPlaceholder')}
                                variant="outlined"
                                size="small"
                                value={filterText}
                                onChange={handleSearchChange}
                                sx={{ flex: 1 }}
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
                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 1 }}>
                            <InputLabel id="status-filter-label">{t('common.status')}</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                id="status-filter"
                                value={filterStatus}
                                onChange={handleStatusChange}
                                label={t('common.status')}
                            >
                                <MenuItem value="All">{t('common.all')}</MenuItem>
                                <MenuItem value="Draft">{t('billing.status.draft')}</MenuItem>
                                <MenuItem value="Issued">{t('billing.status.issued')}</MenuItem>
                                <MenuItem value="Sent">{t('billing.status.sent')}</MenuItem>
                                <MenuItem value="Overdue">{t('billing.status.overdue')}</MenuItem>
                                <MenuItem value="PartiallyPaid">{t('billing.status.partiallyPaid')}</MenuItem>
                                <MenuItem value="Paid">{t('billing.status.paid')}</MenuItem>
                                <MenuItem value="Cancelled">{t('billing.status.cancelled')}</MenuItem>
                                <MenuItem value="Disputed">{t('billing.status.disputed')}</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            disabled={!isOnline || loading}
                        >
                            {t('common.refresh')}
                        </Button>
                    </Grid>

                    {/* Additional filters */}
                    {showFilters && (
                        <>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    {t('reports.dateRange')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label={t('reports.startDate')}
                                        type="date"
                                        name="startDate"
                                        value={dateRange.startDate}
                                        onChange={handleDateRangeChange}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label={t('reports.endDate')}
                                        type="date"
                                        name="endDate"
                                        value={dateRange.endDate}
                                        onChange={handleDateRangeChange}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                        fullWidth
                                    />
                                    <Button
                                        size="small"
                                        startIcon={<ClearIcon />}
                                        onClick={handleClearDateRange}
                                        disabled={!dateRange.startDate && !dateRange.endDate}
                                    >
                                        {t('common.clear')}
                                    </Button>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                {/* Additional filters can be added here */}
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            {/* Invoices table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('billing.invoiceNumber')}</TableCell>
                                <TableCell>{t('billing.client')}</TableCell>
                                <TableCell>{t('billing.issueDate')}</TableCell>
                                <TableCell>{t('billing.dueDate')}</TableCell>
                                <TableCell align="right">{t('billing.amount')}</TableCell>
                                <TableCell align="right">{t('billing.outstanding')}</TableCell>
                                <TableCell>{t('common.status')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <Typography variant="body1" color="textSecondary">
                                            {t('billing.noInvoicesFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedInvoices.map((invoice) => {
                                    const total = calculateTotal(invoice);
                                    const outstanding = calculateOutstanding(invoice);
                                    return (
                                        <TableRow key={invoice.invoiceId} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <ReceiptIcon
                                                        fontSize="small"
                                                        color="inherit"
                                                        sx={{ mr: 1, opacity: 0.7 }}
                                                    />
                                                    {invoice.invoiceNumber}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.client ? (
                                                    <Typography variant="body2">
                                                        {invoice.client.companyName || `${invoice.client.firstName} ${invoice.client.lastName}`}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary">
                                                        {t('common.notAvailable')}
                                                    </Typography>
                                                )}
                                                {invoice.case && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {invoice.case.caseNumber}: {invoice.case.title}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                                            <TableCell>
                                                <Box>
                                                    {formatDate(invoice.dueDate)}
                                                    {invoice.status === 'Overdue' && (
                                                        <Typography variant="caption" color="error">
                                                            {t('billing.overdue')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(total)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    variant="body2"
                                                    color={outstanding > 0 ? 'error' : 'success'}
                                                >
                                                    {formatCurrency(outstanding)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={STATUS_COLORS[invoice.status] || 'default'}
                                                    size="small"
                                                    label={t(`billing.status.${invoice.status.charAt(0).toLowerCase() + invoice.status.slice(1)}`)}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('common.view')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                {invoice.status === 'Draft' && (
                                                    <>
                                                        <Tooltip title={t('common.edit')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}/edit`)}
                                                                disabled={!isOnline}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={t('billing.markAsSent')}>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleUpdateStatus(invoice, 'Sent')}
                                                                disabled={!isOnline}
                                                            >
                                                                <SendIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}

                                                {(invoice.status === 'Sent' || invoice.status === 'Overdue' || invoice.status === 'PartiallyPaid') && (
                                                    <Tooltip title={t('billing.recordPayment')}>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleOpenPaymentDialog(invoice)}
                                                            disabled={!isOnline}
                                                        >
                                                            <PaymentIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                <Tooltip title={t('billing.print')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => window.print()}
                                                    >
                                                        <PrintIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                {invoice.status === 'Draft' && (
                                                    <Tooltip title={t('common.delete')}>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleOpenDeleteDialog(invoice)}
                                                            disabled={!isOnline}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalInvoices}
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
                <DialogTitle>{t('billing.deleteInvoice')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {invoiceToDelete && t('billing.deleteConfirmation', { invoiceNumber: invoiceToDelete.invoiceNumber })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteInvoice}
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog would go here */}
            {/* It would be complex enough to warrant its own component */}
        </Container>
    );
};

export default InvoicesListPage;