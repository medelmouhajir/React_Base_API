// src/pages/billing/NewInvoicePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    InputAdornment,
    Alert,
    CircularProgress,
    Divider,
    FormHelperText,
    Card,
    CardContent,
    Stack,
    Checkbox,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon,
    Receipt as ReceiptIcon,
    Money as MoneyIcon,
    Person as PersonIcon,
    Folder as FolderIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import invoiceService from '../../services/invoiceService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const NewInvoicePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // Extract any pre-selected client or case from location state
    const preSelectedClient = location.state?.clientId || null;
    const preSelectedCase = location.state?.caseId || null;

    // Form data
    const [formData, setFormData] = useState({
        clientId: preSelectedClient,
        caseId: preSelectedCase,
        lawFirmId: user?.lawFirmId || 0,
        paymentTermDays: 30,
        taxRate: 0,
        notes: '',
        timeEntryIds: [],
        additionalItems: []
    });

    // Form state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [availableTimeEntries, setAvailableTimeEntries] = useState([]);
    const [selectedTimeEntries, setSelectedTimeEntries] = useState([]);
    const [additionalItems, setAdditionalItems] = useState([]);
    const [newItem, setNewItem] = useState({
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        itemType: invoiceService.stringToInvoiceItemType('Service'),
        itemCode: ''
    });

    // Calculation state
    const [subtotal, setSubtotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [total, setTotal] = useState(0);

    // Load reference data
    useEffect(() => {
        const loadReferenceData = async () => {
            if (!isOnline) {
                setInitialLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setInitialLoading(true);
            setError('');

            try {
                // Load clients
                const clientsData = await invoiceService.getClients();
                setClients(clientsData);

                // Load cases
                const casesData = await invoiceService.getCases();
                setCases(casesData);

                // If client is preselected, set selected client
                if (preSelectedClient) {
                    const client = clientsData.find(c => c.clientId === preSelectedClient);
                    if (client) {
                        setSelectedClient(client);
                        await loadTimeEntries(preSelectedClient, preSelectedCase);
                    }
                }

                // If case is preselected, set selected case
                if (preSelectedCase) {
                    const caseItem = casesData.find(c => c.caseId === preSelectedCase);
                    if (caseItem) {
                        setSelectedCase(caseItem);
                    }
                }
            } catch (err) {
                console.error('Error loading reference data:', err);
                setError(t('common.referenceDataError'));
            } finally {
                setInitialLoading(false);
            }
        };

        loadReferenceData();
    }, [isOnline, preSelectedClient, preSelectedCase, t]);

    // Load time entries when client or case changes
    const loadTimeEntries = async (clientId, caseId) => {
        if (!isOnline || !clientId) return;

        try {
            let timeEntries;
            if (caseId) {
                timeEntries = await invoiceService.getUnbilledTimeEntriesByCase(caseId);
            } else {
                timeEntries = await invoiceService.getUnbilledTimeEntries(clientId);
            }
            setAvailableTimeEntries(timeEntries);
        } catch (err) {
            console.error('Error loading time entries:', err);
        }
    };

    // Handle client change
    // Handle client change
    const handleClientChange = async (event, value) => {
        setSelectedClient(value);
        console.log(value);
        if (value) {
            setFormData(prev => ({
                ...prev,
                clientId: value.clientId,
                // Clear case if changing client
                caseId: null
            }));
            setSelectedCase(null);

            // Fetch client-specific cases
            try {
                const clientCases = await invoiceService.getClientCases(value.clientId);
                console.log(clientCases);
                setCases(clientCases);
            } catch (err) {
                console.error('Error loading client cases:', err);
            }

            // Load time entries for the client
            await loadTimeEntries(value.clientId, null);
        } else {
            setFormData(prev => ({
                ...prev,
                clientId: null,
                caseId: null
            }));
            setSelectedCase(null);
            setAvailableTimeEntries([]);

            // Reset to all cases if client is deselected
            try {
                const allCases = await invoiceService.getCases();
                setCases(allCases);
            } catch (err) {
                console.error('Error loading all cases:', err);
            }
        }

        // Clear validation error
        if (submitAttempted) {
            validateField('clientId', value?.clientId);
        }
    };

    // Handle case change
    const handleCaseChange = async (event, value) => {
        setSelectedCase(value);

        if (value) {
            setFormData(prev => ({
                ...prev,
                caseId: value.caseId
            }));
            await loadTimeEntries(formData.clientId, value.caseId);
        } else {
            setFormData(prev => ({
                ...prev,
                caseId: null
            }));
            // Reload time entries for the client
            if (formData.clientId) {
                await loadTimeEntries(formData.clientId, null);
            }
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));

        // Clear validation error if present
        if (submitAttempted && validationErrors[name]) {
            validateField(name, value);
        }
    };

    // Handle time entry selection
    const handleTimeEntrySelection = (timeEntry) => {
        // Check if already selected
        const isAlreadySelected = selectedTimeEntries.some(te => te.timeEntryId === timeEntry.timeEntryId);

        if (isAlreadySelected) {
            // Remove from selection
            setSelectedTimeEntries(prev => prev.filter(te => te.timeEntryId !== timeEntry.timeEntryId));
            setFormData(prev => ({
                ...prev,
                timeEntryIds: prev.timeEntryIds.filter(id => id !== timeEntry.timeEntryId)
            }));
        } else {
            // Add to selection
            setSelectedTimeEntries(prev => [...prev, timeEntry]);
            setFormData(prev => ({
                ...prev,
                timeEntryIds: [...prev.timeEntryIds, timeEntry.timeEntryId]
            }));
        }
    };

    // Handle new item field changes
    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'unitPrice' || name === 'taxRate' ?
                (value === '' ? '' : Number(value)) : value
        }));
    };

    // Add new item to invoice
    const handleAddItem = () => {
        // Validate item
        if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
            return;
        }

        // Add item
        setAdditionalItems(prev => [...prev, { ...newItem }]);
        setFormData(prev => ({
            ...prev,
            additionalItems: [...prev.additionalItems, { ...newItem }]
        }));

        // Reset new item form
        setNewItem({
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: formData.taxRate,
            itemType: invoiceService.stringToInvoiceItemType('Service'),
            itemCode: ''
        });
    };

    // Remove additional item
    const handleRemoveItem = (index) => {
        setAdditionalItems(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            additionalItems: prev.additionalItems.filter((_, i) => i !== index)
        }));
    };

    // Calculate totals whenever selected time entries or additional items change
    useEffect(() => {
        let subtotalAmount = 0;
        let taxAmount = 0;

        // Calculate from time entries
        selectedTimeEntries.forEach(entry => {
            const lineAmount = entry.hours * (entry.hourlyRate || 0);
            subtotalAmount += lineAmount;
            taxAmount += lineAmount * (formData.taxRate / 100);
        });

        // Calculate from additional items
        additionalItems.forEach(item => {
            const lineAmount = item.quantity * item.unitPrice;
            subtotalAmount += lineAmount;
            taxAmount += lineAmount * (item.taxRate / 100);
        });

        setSubtotal(subtotalAmount);
        setTaxAmount(taxAmount);
        setTotal(subtotalAmount + taxAmount);
    }, [selectedTimeEntries, additionalItems, formData.taxRate]);

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'clientId':
                if (!value) {
                    error = t('billing.validation.clientRequired');
                }
                break;
            case 'paymentTermDays':
                if (value <= 0) {
                    error = t('billing.validation.paymentTermsInvalid');
                }
                break;
            default:
                break;
        }

        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));

        return !error;
    };

    // Validate form
    const validateForm = () => {
        const fieldsToValidate = ['clientId', 'paymentTermDays'];
        let isValid = true;

        fieldsToValidate.forEach(field => {
            const fieldIsValid = validateField(field, formData[field]);
            isValid = isValid && fieldIsValid;
        });

        // Check if we have at least one item (time entry or additional item)
        if (selectedTimeEntries.length === 0 && additionalItems.length === 0) {
            setValidationErrors(prev => ({
                ...prev,
                items: t('billing.validation.noItems')
            }));
            isValid = false;
        }

        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);

        // Validate form
        if (!validateForm()) {
            setError(t('common.validationError'));
            return;
        }

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create invoice
            const result = await invoiceService.createInvoice(formData);

            // Navigate to invoice details
            navigate(`/billing/invoices/${result.invoiceId}`);
        } catch (err) {
            console.error('Error creating invoice:', err);
            setError(err.message || t('billing.createError'));
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('billing.createInvoice')}
                subtitle={t('billing.createInvoiceSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.invoices'), link: '/billing/invoices' },
                    { text: t('billing.createInvoice') }
                ]}
            />

            {/* Error message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {/* Loading state */}
            {initialLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Client & Case Information */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('billing.clientInfo')}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            value={selectedClient}
                                            onChange={handleClientChange}
                                            options={clients}
                                            getOptionLabel={(option) =>
                                                option.companyName ?
                                                    `${option.companyName} (${option.firstName} ${option.lastName})` :
                                                    `${option.firstName} ${option.lastName}`
                                            }
                                            isOptionEqualToValue={(option, value) => option.clientId === value.clientId}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('billing.client')}
                                                    required
                                                    error={!!validationErrors.clientId}
                                                    helperText={validationErrors.clientId}
                                                />
                                            )}
                                        />
                                    </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Autocomplete
                                                value={selectedCase}
                                                onChange={handleCaseChange}
                                                options={cases}
                                                getOptionLabel={(option) => `${option.caseNumber} - ${option.title}`}
                                                isOptionEqualToValue={(option, value) => option.caseId === value.caseId}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={t('billing.case')}
                                                    />
                                                )}
                                                disabled={!formData.clientId}
                                            />
                                        </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.paymentTerms')}
                                            name="paymentTermDays"
                                            value={formData.paymentTermDays}
                                            onChange={handleChange}
                                            type="number"
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">{t('billing.days')}</InputAdornment>,
                                            }}
                                            error={!!validationErrors.paymentTermDays}
                                            helperText={validationErrors.paymentTermDays}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.taxRate')}
                                            name="taxRate"
                                            value={formData.taxRate}
                                            onChange={handleChange}
                                            type="number"
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.notes')}
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            multiline
                                            rows={3}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Time Entries */}
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('billing.timeEntries')}
                                </Typography>

                                {formData.clientId ? (
                                    availableTimeEntries.length > 0 ? (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell padding="checkbox"></TableCell>
                                                        <TableCell>{t('common.date')}</TableCell>
                                                        <TableCell>{t('common.description')}</TableCell>
                                                        <TableCell>{t('billing.hours')}</TableCell>
                                                        <TableCell>{t('billing.rate')}</TableCell>
                                                        <TableCell align="right">{t('billing.amount')}</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {availableTimeEntries.map((entry) => {
                                                        const isSelected = selectedTimeEntries.some(te => te.timeEntryId === entry.timeEntryId);
                                                        const amount = entry.hours * (entry.hourlyRate || 0);

                                                        return (
                                                            <TableRow
                                                                key={entry.timeEntryId}
                                                                hover
                                                                selected={isSelected}
                                                                onClick={() => handleTimeEntrySelection(entry)}
                                                                sx={{ cursor: 'pointer' }}
                                                            >
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={() => { }}
                                                                        color="primary"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{formatDate(entry.date)}</TableCell>
                                                                <TableCell>{entry.description}</TableCell>
                                                                <TableCell>{entry.hours}</TableCell>
                                                                <TableCell>{formatCurrency(entry.hourlyRate || 0)}</TableCell>
                                                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Alert severity="info">
                                            {t('billing.noUnbilledTimeEntries')}
                                        </Alert>
                                    )
                                ) : (
                                    <Alert severity="info">
                                        {t('billing.selectClientFirst')}
                                    </Alert>
                                )}
                            </Paper>

                            {/* Additional Items */}
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('billing.additionalItems')}
                                </Typography>

                                {/* Add items form */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            fullWidth
                                            label={t('common.description')}
                                            name="description"
                                            value={newItem.description}
                                            onChange={handleNewItemChange}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.quantity')}
                                            name="quantity"
                                            value={newItem.quantity}
                                            onChange={handleNewItemChange}
                                            type="number"
                                            inputProps={{ min: 0, step: 0.01 }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.unitPrice')}
                                            name="unitPrice"
                                            value={newItem.unitPrice}
                                            onChange={handleNewItemChange}
                                            type="number"
                                            inputProps={{ min: 0, step: 0.01 }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            fullWidth
                                            label={t('billing.taxRate')}
                                            name="taxRate"
                                            value={newItem.taxRate}
                                            onChange={handleNewItemChange}
                                            type="number"
                                            inputProps={{ min: 0, step: 0.1 }}
                                            size="small"
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={1}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={handleAddItem}
                                            disabled={!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0}
                                            sx={{ height: '100%' }}
                                        >
                                            <AddIcon />
                                        </Button>
                                    </Grid>
                                </Grid>

                                {/* Additional items table */}
                                {additionalItems.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>{t('common.description')}</TableCell>
                                                    <TableCell>{t('billing.quantity')}</TableCell>
                                                    <TableCell>{t('billing.unitPrice')}</TableCell>
                                                    <TableCell>{t('billing.tax')}</TableCell>
                                                    <TableCell align="right">{t('billing.amount')}</TableCell>
                                                    <TableCell padding="checkbox"></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {additionalItems.map((item, index) => {
                                                    const amount = item.quantity * item.unitPrice;

                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell>{item.description}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                            <TableCell>{item.taxRate}%</TableCell>
                                                            <TableCell align="right">{formatCurrency(amount)}</TableCell>
                                                            <TableCell padding="checkbox">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography variant="body2" color="textSecondary" align="center">
                                        {t('billing.noAdditionalItems')}
                                    </Typography>
                                )}

                                {validationErrors.items && (
                                    <FormHelperText error>{validationErrors.items}</FormHelperText>
                                )}
                            </Paper>
                        </Grid>

                        {/* Invoice Summary */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ position: 'sticky', top: 16 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {t('billing.invoiceSummary')}
                                    </Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body1">{t('billing.subtotal')}</Typography>
                                                <Typography variant="body1">{formatCurrency(subtotal)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body1">{t('billing.tax')} ({formData.taxRate}%)</Typography>
                                                <Typography variant="body1">{formatCurrency(taxAmount)}</Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                <Typography variant="h6">{t('billing.total')}</Typography>
                                                <Typography variant="h6">{formatCurrency(total)}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {t('billing.selectedItems')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TimeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">
                                                    {selectedTimeEntries.length} {t('billing.timeEntries')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <ReceiptIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">
                                                    {additionalItems.length} {t('billing.additionalItems')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            fullWidth
                                            onClick={() => navigate('/billing/invoices')}
                                            startIcon={<CancelIcon />}
                                            disabled={loading}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            type="submit"
                                            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                                            disabled={loading || !isOnline}
                                        >
                                            {loading ? t('common.creating') : t('common.create')}
                                        </Button>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            {t('billing.draftInvoiceNote')}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </form>
            )}
        </Container>
    );
};

export default NewInvoicePage;