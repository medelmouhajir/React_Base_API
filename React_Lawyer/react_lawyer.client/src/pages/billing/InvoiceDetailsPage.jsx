// src/pages/billing/InvoiceDetailsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Grid,
    Paper,
    Box,
    Typography,
    Button,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    FormHelperText,
    InputAdornment,
    useTheme,
    Stack,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Send as SendIcon,
    Assignment as AssignmentIcon,
    Payment as PaymentIcon,
    Person as PersonIcon,
    Folder as FolderIcon,
    AttachMoney as MoneyIcon,
    AccessTime as TimeIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Download as DownloadIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Today as DateIcon,
    AccountBalance as BankIcon,
    AccountBalanceWallet as WalletIcon,
    CreditCard as CreditCardIcon,
} from '@mui/icons-material';
// We'll use a simpler approach for printing
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import invoiceService from '../../services/invoiceService';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

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

// Payment method icon mapping
const PAYMENT_METHOD_ICONS = {
    'Cash': <MoneyIcon />,
    'Check': <AssignmentIcon />,
    'CreditCard': <CreditCardIcon />,
    'BankTransfer': <BankIcon />,
    'ElectronicPayment': <WalletIcon />,
    'Other': <PaymentIcon />
};

const InvoiceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();
    const theme = useTheme();
    const { isMobile } = useThemeMode();

    // Reference for printing
    // No longer need printRef for the simpler print approach

    // State
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'CreditCard',
        referenceNumber: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch invoice details
    useEffect(() => {
        const fetchInvoice = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = await invoiceService.getInvoiceById(parseInt(id));
                setInvoice(data);

                // Pre-fill payment amount with outstanding balance
                if (data) {
                    const totalAmount = data.amount + data.taxAmount;
                    const outstandingAmount = totalAmount - data.paidAmount;
                    setPaymentData(prev => ({
                        ...prev,
                        amount: outstandingAmount > 0 ? outstandingAmount : 0
                    }));
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(t('billing.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id, isOnline, refreshTrigger, t]);

    // Status update dialog
    const handleOpenStatusDialog = () => {
        if (invoice) {
            setNewStatus(invoice.status);
            setStatusUpdateOpen(true);
        }
    };

    const handleCloseStatusDialog = () => {
        setStatusUpdateOpen(false);
    };

    const handleStatusChange = (event) => {
        setNewStatus(event.target.value);
    };

    const handleUpdateStatus = async () => {
        if (!isOnline || !invoice) return;

        setStatusLoading(true);

        try {
            await invoiceService.updateInvoiceStatus(invoice.invoiceId, newStatus, {
                userId: user.id
            });

            // Refresh invoice data
            setRefreshTrigger(prev => prev + 1);
            handleCloseStatusDialog();
        } catch (err) {
            console.error('Error updating invoice status:', err);
            setError(t('billing.statusUpdateError'));
        } finally {
            setStatusLoading(false);
        }
    };

    // Payment dialog
    const handleOpenPaymentDialog = () => {
        setPaymentDialogOpen(true);
        setPaymentError('');
    };

    const handleClosePaymentDialog = () => {
        setPaymentDialogOpen(false);
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Enhanced payment functionality with validation
    const handleAddPayment = async () => {
        if (!isOnline || !invoice) return;

        // Validate payment data
        if (paymentData.amount <= 0) {
            setPaymentError(t('billing.validation.amountPositive'));
            return;
        }

        if (!paymentData.method) {
            setPaymentError(t('billing.validation.methodRequired'));
            return;
        }

        if (!paymentData.paymentDate) {
            setPaymentError(t('billing.validation.dateRequired'));
            return;
        }

        // Additional validation for specific payment methods
        if (paymentData.method === 'Check' && !paymentData.referenceNumber) {
            setPaymentError(t('billing.validation.checkNumberRequired'));
            return;
        }

        setPaymentLoading(true);
        setPaymentError('');

        try {
            // Call the API to add payment
            await invoiceService.addPayment(invoice.invoiceId, {
                ...paymentData,
                receivedById: user.id
            });

            // Show success message
            setError('');

            // Refresh invoice data
            setRefreshTrigger(prev => prev + 1);
            handleClosePaymentDialog();

            // Reset payment form for next use
            setPaymentData({
                amount: 0,
                method: 'CreditCard',
                referenceNumber: '',
                notes: '',
                paymentDate: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            console.error('Error adding payment:', err);
            setPaymentError(t('billing.addPaymentError'));
        } finally {
            setPaymentLoading(false);
        }
    };

    // Cancel invoice dialog
    const handleOpenCancelDialog = () => {
        setCancelDialogOpen(true);
    };

    const handleCloseCancelDialog = () => {
        setCancelDialogOpen(false);
    };

    const handleCancelInvoice = async () => {
        if (!isOnline || !invoice) return;

        setCancelLoading(true);

        try {
            await invoiceService.updateInvoiceStatus(invoice.invoiceId, 'Cancelled');

            // Refresh invoice data
            setRefreshTrigger(prev => prev + 1);
            handleCloseCancelDialog();
        } catch (err) {
            console.error('Error cancelling invoice:', err);
            setError(t('billing.cancelError'));
        } finally {
            setCancelLoading(false);
        }
    };

    // Navigate to print or download pages
    const handleNavigateToPrintPage = () => {
        navigate(`/billing/invoices/${id}/print`);
    };

    const handleNavigateToDownloadPage = () => {
        navigate(`/billing/invoices/${id}/download`);
    };

    // Simple print functionality using browser's print capability
    const handlePrint = () => {
        handleNavigateToPrintPage();
    };

    // Download PDF
    const handleDownload = () => {
        // In a production app, this would generate and download a PDF
        // For now, we'll just use the print functionality
        handlePrint();
    };

    // Mark as sent
    const handleMarkAsSent = async () => {
        if (!isOnline || !invoice) return;

        try {
            await invoiceService.updateInvoiceStatus(invoice.invoiceId, 'Sent');

            // Refresh invoice data
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error marking invoice as sent:', err);
            setError(t('billing.statusUpdateError'));
        }
    };

    // Format helpers
    const formatCurrency = (amount) => {
        return amount?.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        }) || '$0.00';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    // Calculate totals
    const calculateTotal = (invoice) => {
        if (!invoice) return 0;
        return invoice.amount + invoice.taxAmount;
    };

    const calculateOutstanding = (invoice) => {
        if (!invoice) return 0;
        return calculateTotal(invoice) - invoice.paidAmount;
    };

    // Get the appropriate actions based on invoice status
    const getStatusActions = () => {
        if (!invoice) return [];

        const actions = [];

        // Actions based on status
        switch (invoice.status) {
            case 'Draft':
                actions.push({
                    label: t('billing.edit'),
                    icon: <EditIcon />,
                    onClick: () => navigate(`/billing/invoices/${id}/edit`),
                    color: 'primary'
                });
                actions.push({
                    label: t('billing.markAsSent'),
                    icon: <SendIcon />,
                    onClick: handleMarkAsSent,
                    color: 'primary'
                });
                break;
            case 'Sent':
            case 'Overdue':
            case 'PartiallyPaid':
                actions.push({
                    label: t('billing.recordPayment'),
                    icon: <PaymentIcon />,
                    onClick: handleOpenPaymentDialog,
                    color: 'success'
                });
                break;
            case 'Paid':
                // No specific actions for paid invoices
                break;
            case 'Cancelled':
                // No specific actions for cancelled invoices
                break;
            default:
                break;
        }

        // Common actions for all invoices
        actions.push({
            label: t('billing.print'),
            icon: <PrintIcon />,
            onClick: handleNavigateToPrintPage
        });

        actions.push({
            label: t('billing.download'),
            icon: <DownloadIcon />,
            onClick: handleNavigateToDownloadPage
        });

        // Cancel action - only for Draft, Sent and certain other statuses
        if (['Draft', 'Sent', 'Overdue'].includes(invoice.status)) {
            actions.push({
                label: t('billing.cancel'),
                icon: <CancelIcon />,
                onClick: handleOpenCancelDialog,
                color: 'error'
            });
        }

        return actions;
    };

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Alert
                    severity="error"
                    sx={{ mt: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                        >
                            {t('common.retry')}
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!invoice) {
        return (
            <Container maxWidth="lg">
                <Alert severity="warning" sx={{ mt: 3 }}>
                    {t('billing.invoiceNotFound')}
                </Alert>
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/billing/invoices')}
                    >
                        {t('billing.backToInvoices')}
                    </Button>
                </Box>
            </Container>
        );
    }

    // Invoice data is loaded
    const totalAmount = calculateTotal(invoice);
    const outstandingAmount = calculateOutstanding(invoice);
    const statusActions = getStatusActions();

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={`${t('billing.invoice')} #${invoice.invoiceNumber}`}
                subtitle={invoice.client ? (
                    invoice.client.companyName || `${invoice.client.firstName} ${invoice.client.lastName}`
                ) : ''}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.invoices'), link: '/billing/invoices' },
                    { text: `${t('billing.invoice')} #${invoice.invoiceNumber}` }
                ]}
                action={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Chip
                            label={t(`billing.status.${invoice.status.charAt(0).toLowerCase() + invoice.status.slice(1)}`)}
                            color={STATUS_COLORS[invoice.status] || 'default'}
                            size="medium"
                            onClick={handleOpenStatusDialog}
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                }
            />

            {/* We'll use CSS media queries for print styling instead of a hidden div */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-invoice, #printable-invoice * {
                            visibility: visible;
                        }
                        #printable-invoice {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 20px;
                        }
                        #root > *:not(#printable-invoice) {
                            display: none;
                        }
                    }
                `}
            </style>

            {/* Printable invoice will use the same content as main display */}

            {/* Main content */}
            <Grid container spacing={3} id="printable-invoice">
                {/* Main invoice details */}
                <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
                    {/* Invoice items */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <ReceiptIcon sx={{ mr: 1 }} />
                            {t('billing.invoiceItems')}
                        </Typography>
                        <TableContainer>
                            <Table size={isMobile ? "small" : "medium"}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('common.description')}</TableCell>
                                        {!isMobile && <TableCell align="right">{t('billing.quantity')}</TableCell>}
                                        <TableCell align="right">{t('billing.unitPrice')}</TableCell>
                                        {!isMobile && <TableCell align="right">{t('billing.tax')}</TableCell>}
                                        <TableCell align="right">{t('billing.amount')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item, index) => {
                                            const lineAmount = item.quantity * item.unitPrice;
                                            const taxAmount = lineAmount * (item.taxRate / 100);

                                            return (
                                                <TableRow key={item.invoiceItemId || index}>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {item.description}
                                                        </Typography>
                                                        {isMobile && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                {t('billing.quantity')}: {item.quantity} × {formatCurrency(item.unitPrice)}
                                                                {item.taxRate > 0 && ` + ${item.taxRate}% ${t('billing.tax')}`}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    {!isMobile && <TableCell align="right">{item.quantity}</TableCell>}
                                                    {!isMobile && <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>}
                                                    {!isMobile && <TableCell align="right">{item.taxRate}%</TableCell>}
                                                    <TableCell align="right">{formatCurrency(lineAmount)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isMobile ? 2 : 5} align="center">
                                                <Typography variant="body2" color="textSecondary">
                                                    {t('billing.noItems')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Payment history */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <PaymentIcon sx={{ mr: 1 }} />
                            {t('billing.paymentHistory')}
                        </Typography>
                        {invoice.payments && invoice.payments.length > 0 ? (
                            <List>
                                {invoice.payments.map((payment) => (
                                    <ListItem
                                        key={payment.paymentId}
                                        divider
                                        sx={{ py: 2 }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                                {PAYMENT_METHOD_ICONS[payment.method] || <PaymentIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="subtitle1">
                                                        {t(`billing.paymentMethod.${payment.method}`)}
                                                    </Typography>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {formatCurrency(payment.amount)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {formatDate(payment.paymentDate)}
                                                        {payment.referenceNumber && ` • Ref: ${payment.referenceNumber}`}
                                                    </Typography>
                                                    {payment.notes && (
                                                        <Typography variant="body2" color="textSecondary">
                                                            {payment.notes}
                                                        </Typography>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="textSecondary">
                                    {t('billing.noPaymentsRecorded')}
                                </Typography>
                            </Box>
                        )}
                        {/* Show add payment button if invoice is not paid/cancelled */}
                        {['Sent', 'Overdue', 'PartiallyPaid'].includes(invoice.status) && (
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<PaymentIcon />}
                                    onClick={handleOpenPaymentDialog}
                                    disabled={!isOnline}
                                >
                                    {t('billing.recordPayment')}
                                </Button>
                            </Box>
                        )}
                    </Paper>

                    {/* Notes */}
                    {invoice.notes && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                {t('common.notes')}
                            </Typography>
                            <Typography variant="body1">
                                {invoice.notes}
                            </Typography>
                        </Paper>
                    )}
                </Grid>

                {/* Side panel */}
                <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
                    {/* Invoice summary */}
                    <Card sx={{ mb: 3, position: { md: 'sticky' }, top: { md: 16 } }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('billing.invoiceSummary')}
                            </Typography>

                            <Stack spacing={2} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body1">{t('billing.subtotal')}:</Typography>
                                    <Typography variant="body1">{formatCurrency(invoice.amount)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body1">{t('billing.tax')}:</Typography>
                                    <Typography variant="body1">{formatCurrency(invoice.taxAmount)}</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <Typography variant="h6">{t('billing.total')}:</Typography>
                                    <Typography variant="h6">{formatCurrency(totalAmount)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body1">{t('billing.amountPaid')}:</Typography>
                                    <Typography variant="body1">{formatCurrency(invoice.paidAmount)}</Typography>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    bgcolor: outstandingAmount > 0 ? 'error.lightest' : 'success.lightest',
                                    p: 1,
                                    borderRadius: 1
                                }}>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color={outstandingAmount > 0 ? 'error.main' : 'success.main'}
                                    >
                                        {t('billing.outstanding')}:
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color={outstandingAmount > 0 ? 'error.main' : 'success.main'}
                                    >
                                        {formatCurrency(outstandingAmount)}
                                    </Typography>
                                </Box>
                            </Stack>

                            {/* Client & Case info (compact) */}
                            <Stack spacing={2} sx={{ mb: 3 }}>
                                <Typography variant="subtitle1">
                                    {t('billing.details')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <PersonIcon color="primary" fontSize="small" />
                                    <Typography variant="body2">
                                        {invoice.client ? (
                                            invoice.client.companyName || `${invoice.client.firstName} ${invoice.client.lastName}`
                                        ) : t('common.notAvailable')}
                                    </Typography>
                                </Box>
                                {invoice.case && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FolderIcon color="secondary" fontSize="small" />
                                        <Typography variant="body2">
                                            {invoice.case.caseNumber}: {invoice.case.title}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <DateIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                        {t('billing.issueDate')}: {formatDate(invoice.issueDate)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <DateIcon
                                        color={invoice.status === 'Overdue' ? 'error' : 'action'}
                                        fontSize="small"
                                    />
                                    <Typography variant="body2">
                                        {t('billing.dueDate')}: {formatDate(invoice.dueDate)}
                                        {invoice.status === 'Overdue' && (
                                            <Typography component="span" color="error" sx={{ ml: 1 }}>
                                                ({t('billing.overdue')})
                                            </Typography>
                                        )}
                                    </Typography>
                                </Box>
                            </Stack>

                            {/* Actions */}
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>
                                {t('common.actions')}
                            </Typography>
                            <Stack spacing={1}>
                                {statusActions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant={action.color === 'error' ? 'outlined' : 'contained'}
                                        color={action.color || 'primary'}
                                        startIcon={action.icon}
                                        onClick={action.onClick}
                                        fullWidth
                                        disabled={!isOnline && action.requiresOnline !== false}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Status change dialog */}
            <Dialog open={statusUpdateOpen} onClose={handleCloseStatusDialog}>
                <DialogTitle>{t('billing.updateStatus')}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="status-select-label">{t('common.status')}</InputLabel>
                        <Select
                            labelId="status-select-label"
                            id="status-select"
                            value={newStatus}
                            label={t('common.status')}
                            onChange={handleStatusChange}
                        >
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseStatusDialog} disabled={statusLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleUpdateStatus}
                        color="primary"
                        disabled={statusLoading || !isOnline}
                        startIcon={statusLoading ? <CircularProgress size={24} /> : null}
                    >
                        {statusLoading ? t('common.updating') : t('common.update')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment dialog */}
            <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{t('billing.recordPayment')}</DialogTitle>
                <DialogContent>
                    {paymentError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            onClose={() => setPaymentError('')}
                        >
                            {paymentError}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label={t('billing.amount')}
                                name="amount"
                                value={paymentData.amount}
                                onChange={handlePaymentChange}
                                type="number"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label={t('billing.paymentDate')}
                                name="paymentDate"
                                value={paymentData.paymentDate}
                                onChange={handlePaymentChange}
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel id="payment-method-label">{t('billing.method')}</InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    id="method"
                                    name="method"
                                    value={paymentData.method}
                                    label={t('billing.method')}
                                    onChange={handlePaymentChange}
                                >
                                    <MenuItem value="Cash">{t('billing.paymentMethod.Cash')}</MenuItem>
                                    <MenuItem value="Check">{t('billing.paymentMethod.Check')}</MenuItem>
                                    <MenuItem value="CreditCard">{t('billing.paymentMethod.CreditCard')}</MenuItem>
                                    <MenuItem value="BankTransfer">{t('billing.paymentMethod.BankTransfer')}</MenuItem>
                                    <MenuItem value="ElectronicPayment">{t('billing.paymentMethod.ElectronicPayment')}</MenuItem>
                                    <MenuItem value="Other">{t('billing.paymentMethod.Other')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label={t('billing.referenceNumber')}
                                name="referenceNumber"
                                value={paymentData.referenceNumber}
                                onChange={handlePaymentChange}
                                fullWidth
                                placeholder={t('billing.referenceNumberPlaceholder')}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label={t('common.notes')}
                                name="notes"
                                value={paymentData.notes}
                                onChange={handlePaymentChange}
                                multiline
                                rows={2}
                                fullWidth
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('billing.paymentSummary')}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{t('billing.invoiceTotal')}:</Typography>
                            <Typography variant="body2">{formatCurrency(totalAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{t('billing.previouslyPaid')}:</Typography>
                            <Typography variant="body2">{formatCurrency(invoice.paidAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{t('billing.outstanding')}:</Typography>
                            <Typography variant="body2">{formatCurrency(outstandingAmount)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">{t('billing.thisPayment')}:</Typography>
                            <Typography variant="subtitle2">{formatCurrency(paymentData.amount)}</Typography>
                        </Box>
                        {paymentData.amount > outstandingAmount && outstandingAmount > 0 && (
                            <Alert severity="warning" sx={{ mt: 1, p: 1 }}>
                                {t('billing.overpaymentWarning')}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePaymentDialog} disabled={paymentLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleAddPayment}
                        color="success"
                        disabled={paymentLoading || !isOnline || paymentData.amount <= 0}
                        startIcon={paymentLoading ? <CircularProgress size={24} /> : <PaymentIcon />}
                    >
                        {paymentLoading ? t('common.processing') : t('billing.recordPayment')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel invoice dialog */}
            <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
                <DialogTitle>{t('billing.cancelInvoice')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('billing.cancelInvoiceConfirmation', { invoiceNumber: invoice.invoiceNumber })}
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
                        {t('common.actionCannotBeUndone')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCancelDialog} disabled={cancelLoading}>
                        {t('common.back')}
                    </Button>
                    <Button
                        onClick={handleCancelInvoice}
                        color="error"
                        disabled={cancelLoading || !isOnline}
                        startIcon={cancelLoading ? <CircularProgress size={24} /> : null}
                    >
                        {cancelLoading ? t('common.canceling') : t('billing.confirmCancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default InvoiceDetailsPage;