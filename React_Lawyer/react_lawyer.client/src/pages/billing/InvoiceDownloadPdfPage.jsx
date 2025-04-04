// src/pages/billing/InvoiceDownloadPdfPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Paper,
    CircularProgress,
    Button,
    Alert,
    Container,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import invoiceService from '../../services/invoiceService';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

// Note: In a real application, you would use a PDF generation library
// like jsPDF, pdfmake, or html2pdf to generate the actual PDF
// For this example, we'll create a visual representation and simulate the download

const InvoiceDownloadPdfPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();
    const { isMobile } = useThemeMode();
    const pdfContentRef = useRef(null);

    // State
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generationComplete, setGenerationComplete] = useState(false);

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
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(t('billing.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id, isOnline, t]);

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

    // Simulate PDF download
    const handleDownloadPdf = () => {
        // In a real app, this would call a library like jspdf, html2pdf, etc.
        setGenerating(true);

        // Simulate processing time
        setTimeout(() => {
            // In a real app, this is where you would create the PDF

            // Simulate PDF creation and download
            if (pdfContentRef.current) {
                // In a real app: const pdf = new jsPDF();
                // pdf.html(pdfContentRef.current, { callback: function(pdf) { pdf.save('invoice.pdf'); }});

                // For now, just simulate with window.print()
                window.print();
                setGenerationComplete(true);
                setGenerating(false);
            }
        }, 2000);
    };

    // Go back to invoice page
    const handleBack = () => {
        navigate(`/billing/invoices/${id}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={handleBack}>
                            {t('common.back')}
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
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Alert severity="warning">
                    {t('billing.invoiceNotFound')}
                </Alert>
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/billing/invoices')}
                        startIcon={<ArrowBackIcon />}
                    >
                        {t('billing.backToInvoices')}
                    </Button>
                </Box>
            </Container>
        );
    }

    const totalAmount = calculateTotal(invoice);
    const outstandingAmount = calculateOutstanding(invoice);

    return (
        <Container maxWidth="xl">
            {/* Controls */}
            <Box sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                '@media print': { display: 'none' }
            }}>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                >
                    {t('common.back')}
                </Button>

                <Button
                    variant="contained"
                    onClick={handleDownloadPdf}
                    startIcon={<DownloadIcon />}
                    disabled={generating}
                    color="primary"
                >
                    {generating
                        ? t('billing.generatingPdf')
                        : generationComplete
                            ? t('billing.downloadAgain')
                            : t('billing.downloadPdf')
                    }
                </Button>
            </Box>

            {/* PDF Generation Status */}
            {generating && (
                <Box sx={{ width: '100%', mb: 3, '@media print': { display: 'none' } }}>
                    <LinearProgress />
                    <Typography align="center" variant="body2" sx={{ mt: 1 }}>
                        {t('billing.preparingPdf')}
                    </Typography>
                </Box>
            )}

            {/* PDF Preview Card */}
            <Box sx={{ '@media print': { display: 'none' }, mb: 3 }}>
                <Typography variant="h5" gutterBottom align="center">
                    {t('billing.pdfPreview')}
                </Typography>

                <Card sx={{
                    maxWidth: '8.5in',
                    margin: '0 auto',
                    boxShadow: 3,
                    border: '1px solid #e0e0e0'
                }}>
                    <CardContent>
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                {t('billing.pdfDocumentPreview')}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Actual Content for PDF Generation - Hidden from normal view but used for PDF generation */}
            <Box
                ref={pdfContentRef}
                sx={{
                    maxWidth: '8.5in',
                    margin: '0 auto',
                    p: 4,
                    border: '1px solid #e0e0e0',
                    '@media screen': { display: 'none' },
                    '@media print': {
                        display: 'block',
                        maxWidth: '100%',
                        width: '100%',
                        margin: 0,
                        padding: '0.5in',
                        border: 'none'
                    }
                }}
            >
                {/* Header with Logo and Invoice Title */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            {t('billing.invoice')}
                        </Typography>
                        <Typography variant="h6" color="primary">
                            #{invoice.invoiceNumber}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" gutterBottom>
                            <strong>{t('billing.issueDate')}:</strong> {formatDate(invoice.issueDate)}
                        </Typography>
                        <Typography variant="body1">
                            <strong>{t('billing.dueDate')}:</strong> {formatDate(invoice.dueDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>{t('common.status')}:</strong> {t(`billing.status.${invoice.status.charAt(0).toLowerCase() + invoice.status.slice(1)}`)}
                        </Typography>
                    </Box>
                </Box>

                {/* From/To Addresses */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={6}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {t('billing.from')}:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {invoice.lawFirm?.name || 'Your Law Firm'}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.lawFirm?.address || 'Your Address'}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.lawFirm?.email || 'Your Email'}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.lawFirm?.phone || 'Your Phone'}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {t('billing.to')}:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {invoice.client?.companyName || `${invoice.client?.firstName || ''} ${invoice.client?.lastName || ''}`}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.client?.address || ''}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.client?.email || ''}
                        </Typography>
                        <Typography variant="body2">
                            {invoice.client?.phone || ''}
                        </Typography>
                    </Grid>
                </Grid>

                {/* Case Reference */}
                {invoice.case && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            <strong>{t('billing.case')}:</strong> {invoice.case.caseNumber} - {invoice.case.title}
                        </Typography>
                    </Box>
                )}

                {/* Invoice Items */}
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>{t('common.description')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('billing.quantity')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('billing.unitPrice')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('billing.tax')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('billing.amount')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoice.items && invoice.items.map((item, index) => {
                                const lineAmount = item.quantity * item.unitPrice;
                                const taxAmount = lineAmount * (item.taxRate / 100);

                                return (
                                    <TableRow key={item.invoiceItemId || index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell align="right">{item.taxRate}%</TableCell>
                                        <TableCell align="right">{formatCurrency(lineAmount)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                    <Box sx={{ width: '300px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">{t('billing.subtotal')}:</Typography>
                            <Typography variant="body1">{formatCurrency(invoice.amount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">{t('billing.tax')}:</Typography>
                            <Typography variant="body1">{formatCurrency(invoice.taxAmount)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 'bold' }}>
                            <Typography variant="body1" fontWeight="bold">{t('billing.total')}:</Typography>
                            <Typography variant="body1" fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">{t('billing.amountPaid')}:</Typography>
                            <Typography variant="body1">{formatCurrency(invoice.paidAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 'bold' }}>
                            <Typography variant="body1" fontWeight="bold">{t('billing.outstanding')}:</Typography>
                            <Typography variant="body1" fontWeight="bold">{formatCurrency(outstandingAmount)}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Payment Information */}
                {invoice.payments && invoice.payments.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {t('billing.paymentHistory')}:
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('billing.paymentDate')}</TableCell>
                                        <TableCell>{t('billing.method')}</TableCell>
                                        <TableCell>{t('billing.referenceNumber')}</TableCell>
                                        <TableCell align="right">{t('billing.amount')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.payments.map((payment) => (
                                        <TableRow key={payment.paymentId}>
                                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                            <TableCell>{t(`billing.paymentMethod.${payment.method}`)}</TableCell>
                                            <TableCell>{payment.referenceNumber || '-'}</TableCell>
                                            <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Notes */}
                {invoice.notes && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {t('common.notes')}:
                        </Typography>
                        <Typography variant="body2">
                            {invoice.notes}
                        </Typography>
                    </Box>
                )}

                {/* Payment Terms and Thank You */}
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        {t('billing.paymentTerms')}: {t('billing.dueWithin', { days: 30 })}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t('billing.thankYou')}
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default InvoiceDownloadPdfPage;