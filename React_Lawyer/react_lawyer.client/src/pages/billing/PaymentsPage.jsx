// src/pages/billing/PaymentsPage.jsx
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
    Search as SearchIcon,
    Visibility as ViewIcon,
    Print as PrintIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    Sort as SortIcon,
    Receipt as ReceiptIcon,
    MoneyOff as RefundIcon,
    Email as EmailIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import invoiceService from '../../services/invoiceService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Payment status color mapping
const STATUS_COLORS = {
    'Pending': 'warning',
    'Completed': 'success',
    'Failed': 'error',
    'Refunded': 'default'
};

// Payment methods display mapping
const PAYMENT_METHODS = {
    'Cash': 'Cash',
    'Check': 'Check',
    'CreditCard': 'Credit Card',
    'BankTransfer': 'Bank Transfer',
    'ElectronicPayment': 'Electronic Payment',
    'Other': 'Other'
};

const PaymentsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPayments, setTotalPayments] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [filterText, setFilterText] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMethod, setFilterMethod] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Refund dialog
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [paymentToRefund, setPaymentToRefund] = useState(null);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundReason, setRefundReason] = useState('');

    // Receipt dialog
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [paymentForReceipt, setPaymentForReceipt] = useState(null);

    // Mock fetch payments (replace with actual service call when available)
    useEffect(() => {
        const fetchPayments = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                // Mock data - Replace with actual API call
                // In a real implementation, you would use a paymentService.getPayments() method

                // For now, get invoices that have payments
                const invoicesData = await invoiceService.getAllInvoices();

                console.log(invoicesData);

                // Extract payments from invoices
                let allPayments = [];
                invoicesData.forEach(invoice => {
                    if (invoice.payments && invoice.payments.length > 0) {
                        invoice.payments.forEach(payment => {
                            allPayments.push({
                                ...payment,
                                invoiceNumber: invoice.invoiceNumber,
                                invoiceId: invoice.invoiceId,
                                clientName: invoice.client ?
                                    `${invoice.client.firstName} ${invoice.client.lastName}` :
                                    'Unknown Client',
                                clientId: invoice.clientId
                            });
                        });
                    }
                });

                console.log(allPayments);
                // Apply filters
                let filteredData = [...allPayments];

                // Filter by status
                if (filterStatus !== 'All') {
                    filteredData = filteredData.filter(p => p.status === filterStatus);
                }

                // Filter by payment method
                if (filterMethod !== 'All') {
                    filteredData = filteredData.filter(p => p.method === filterMethod);
                }

                // Filter by text (payment reference, client name, etc.)
                if (filterText) {
                    const searchTerm = filterText.toLowerCase();
                    filteredData = filteredData.filter(p =>
                        (p.reference && p.reference.toLowerCase().includes(searchTerm)) ||
                        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm)) ||
                        (p.clientName && p.clientName.toLowerCase().includes(searchTerm))
                    );
                }

                // Filter by date range
                if (dateRange.startDate) {
                    const startDate = new Date(dateRange.startDate);
                    filteredData = filteredData.filter(p => new Date(p.paymentDate) >= startDate);
                }

                if (dateRange.endDate) {
                    const endDate = new Date(dateRange.endDate);
                    endDate.setHours(23, 59, 59, 999); // End of day
                    filteredData = filteredData.filter(p => new Date(p.paymentDate) <= endDate);
                }

                // Sort by payment date (most recent first)
                filteredData.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

                setTotalPayments(filteredData.length);
                setPayments(filteredData);
            } catch (err) {
                console.error('Error fetching payments:', err);
                setError(t('billing.fetchPaymentsError'));
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user, filterText, filterStatus, filterMethod, dateRange, refreshTrigger, isOnline, t]);

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

    // Handle method filter change
    const handleMethodChange = (event) => {
        setFilterMethod(event.target.value);
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

    // Open refund confirmation dialog
    const handleOpenRefundDialog = (payment) => {
        setPaymentToRefund(payment);
        setRefundReason('');
        setRefundDialogOpen(true);
    };

    // Close refund confirmation dialog
    const handleCloseRefundDialog = () => {
        setRefundDialogOpen(false);
        setPaymentToRefund(null);
        setRefundReason('');
    };

    // Open receipt dialog
    const handleOpenReceiptDialog = (payment) => {
        setPaymentForReceipt(payment);
        setReceiptDialogOpen(true);
    };

    // Close receipt dialog
    const handleCloseReceiptDialog = () => {
        setReceiptDialogOpen(false);
        setPaymentForReceipt(null);
    };

    // Handle payment refund
    const handleRefundPayment = async () => {
        if (!paymentToRefund || !isOnline) return;

        setRefundLoading(true);

        try {
            // In a real implementation, you would call paymentService.refundPayment(paymentToRefund.paymentId, refundReason)
            // For now, simulate a successful refund
            setTimeout(() => {
                // Update the payment's status in the list
                setPayments(prevPayments =>
                    prevPayments.map(p =>
                        p.paymentId === paymentToRefund.paymentId
                            ? { ...p, status: 'Refunded', refundReason: refundReason }
                            : p
                    )
                );

                handleCloseRefundDialog();
                setRefundLoading(false);
            }, 1000);
        } catch (err) {
            console.error('Error refunding payment:', err);
            setError(t('billing.refundError'));
            setRefundLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Format currency
    const formatCurrency = (amount) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'MAD'
        });
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Calculate paged data
    const pagedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Get payment method display name
    const getPaymentMethodName = (method) => {
        return PAYMENT_METHODS[method] || method;
    };

    // Print receipt
    const handlePrintReceipt = (payment) => {
        // In a real implementation, you would generate and print a receipt
        window.print();
    };

    // Email receipt
    const handleEmailReceipt = (payment) => {
        // In a real implementation, you would send an email with the receipt
        alert(`Receipt would be emailed to client: ${payment.clientName}`);
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('billing.payments')}
                subtitle={t('billing.paymentsSubtitle', { count: totalPayments })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.payments') }
                ]}
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
                                placeholder={t('billing.searchPaymentsPlaceholder')}
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
                                <MenuItem value="Pending">{t('billing.paymentStatus.pending')}</MenuItem>
                                <MenuItem value="Completed">{t('billing.paymentStatus.completed')}</MenuItem>
                                <MenuItem value="Failed">{t('billing.paymentStatus.failed')}</MenuItem>
                                <MenuItem value="Refunded">{t('billing.paymentStatus.refunded')}</MenuItem>
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
                                <FormControl fullWidth size="small">
                                    <InputLabel id="method-filter-label">{t('billing.paymentMethods')}</InputLabel>
                                    <Select
                                        labelId="method-filter-label"
                                        id="method-filter"
                                        value={filterMethod}
                                        onChange={handleMethodChange}
                                        label={t('billing.paymentMethods')}
                                    >
                                        <MenuItem value="All">{t('common.all')}</MenuItem>
                                        <MenuItem value="Cash">{t('billing.paymentMethod.cash')}</MenuItem>
                                        <MenuItem value="Check">{t('billing.paymentMethod.check')}</MenuItem>
                                        <MenuItem value="CreditCard">{t('billing.paymentMethod.creditCard')}</MenuItem>
                                        <MenuItem value="BankTransfer">{t('billing.paymentMethod.bankTransfer')}</MenuItem>
                                        <MenuItem value="ElectronicPayment">{t('billing.paymentMethod.electronicPayment')}</MenuItem>
                                        <MenuItem value="Other">{t('billing.paymentMethod.other')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            {/* Payments table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('billing.paymentDate')}</TableCell>
                                <TableCell>{t('billing.reference')}</TableCell>
                                <TableCell>{t('billing.invoice')}</TableCell>
                                <TableCell>{t('billing.client')}</TableCell>
                                <TableCell>{t('billing.paymentMethods')}</TableCell>
                                <TableCell align="right">{t('billing.amount')}</TableCell>
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
                            ) : pagedPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <Typography variant="body1" color="textSecondary">
                                            {t('billing.noPaymentsFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedPayments.map((payment) => (
                                    <TableRow key={payment.paymentId} hover>
                                        <TableCell>
                                            {formatDate(payment.paymentDate)}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <MoneyIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                                                {payment.reference || `PMT-${payment.paymentId}`}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => navigate(`/billing/invoices/${payment.invoiceId}`)}
                                                sx={{ minWidth: 'auto', p: 0.5 }}
                                            >
                                                {payment.invoiceNumber}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {payment.clientName}
                                        </TableCell>
                                        <TableCell>
                                            {t(`billing.paymentMethod.${payment.method}`)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={STATUS_COLORS[payment.status] || 'default'}
                                                size="small"
                                                label={t(`billing.paymentStatus.${payment.status.toLowerCase()}`)}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('billing.viewPayment')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenReceiptDialog(payment)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title={t('billing.printReceipt')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handlePrintReceipt(payment)}
                                                >
                                                    <PrintIcon />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title={t('billing.emailReceipt')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEmailReceipt(payment)}
                                                    disabled={!isOnline}
                                                >
                                                    <EmailIcon />
                                                </IconButton>
                                            </Tooltip>

                                            {payment.status === 'Completed' && (
                                                <Tooltip title={t('billing.refundPayment')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleOpenRefundDialog(payment)}
                                                        disabled={!isOnline}
                                                    >
                                                        <RefundIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
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
                    count={totalPayments}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={t('common.rowsPerPage')}
                />
            </Paper>

            {/* Refund Dialog */}
            <Dialog
                open={refundDialogOpen}
                onClose={handleCloseRefundDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('billing.refundPayment')}</DialogTitle>
                <DialogContent>
                    <DialogContentText paragraph>
                        {paymentToRefund && t('billing.refundConfirmation', {
                            amount: formatCurrency(paymentToRefund.amount),
                            date: formatDate(paymentToRefund.paymentDate),
                            reference: paymentToRefund.reference || `PMT-${paymentToRefund.paymentId}`
                        })}
                    </DialogContentText>

                    <Box sx={{ mt: 2 }}>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="refundReason"
                            label={t('billing.refundReason')}
                            type="text"
                            fullWidth
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseRefundDialog}
                        disabled={refundLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleRefundPayment}
                        color="error"
                        variant="contained"
                        disabled={refundLoading || !refundReason}
                        startIcon={refundLoading ? <CircularProgress size={20} /> : <RefundIcon />}
                    >
                        {refundLoading ? t('billing.processing') : t('billing.processRefund')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog
                open={receiptDialogOpen}
                onClose={handleCloseReceiptDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {t('billing.paymentReceipt')}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseReceiptDialog}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {paymentForReceipt && (
                        <Box sx={{ p: 2 }}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h5" gutterBottom>
                                    {t('app.title')}
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    {t('billing.receiptTitle')}
                                </Typography>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">{t('billing.receiptNumber')}:</Typography>
                                    <Typography variant="body1">{`RCP-${paymentForReceipt.paymentId}`}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="subtitle2">{t('billing.paymentDate')}:</Typography>
                                    <Typography variant="body1">{formatDate(paymentForReceipt.paymentDate)}</Typography>
                                </Grid>
                            </Grid>

                            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {t('billing.paymentDetails')}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">{t('billing.paymentMethods')}:</Typography>
                                        <Typography variant="body1">
                                            {getPaymentMethodName(paymentForReceipt.method)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">{t('billing.status')}:</Typography>
                                        <Chip
                                            size="small"
                                            color={STATUS_COLORS[paymentForReceipt.status] || 'default'}
                                            label={t(`billing.paymentStatus.${paymentForReceipt.status.toLowerCase()}`)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">{t('billing.invoice')}:</Typography>
                                        <Typography variant="body1">{paymentForReceipt.invoiceNumber}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">{t('billing.reference')}:</Typography>
                                        <Typography variant="body1">
                                            {paymentForReceipt.reference || `PMT-${paymentForReceipt.paymentId}`}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2">{t('billing.client')}:</Typography>
                                        <Typography variant="body1">{paymentForReceipt.clientName}</Typography>
                                    </Grid>
                                    {paymentForReceipt.notes && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2">{t('billing.notes')}:</Typography>
                                            <Typography component="div">{paymentForReceipt.notes}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>

                            <Box sx={{ textAlign: 'right', mb: 2 }}>
                                <Typography variant="h6">{t('billing.amount')}:</Typography>
                                <Typography variant="h5" color="primary">
                                    {formatCurrency(paymentForReceipt.amount)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={() => handlePrintReceipt(paymentForReceipt)}
                                >
                                    {t('billing.printReceipt')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EmailIcon />}
                                    onClick={() => handleEmailReceipt(paymentForReceipt)}
                                    disabled={!isOnline}
                                >
                                    {t('billing.emailReceipt')}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default PaymentsPage;