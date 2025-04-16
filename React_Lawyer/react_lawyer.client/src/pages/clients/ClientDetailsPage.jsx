// src/pages/clients/ClientDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Grid,
    Chip,
    Button,
    IconButton,
    Divider,
    Tabs,
    Tab,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Avatar
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Badge as BadgeIcon,
    Receipt as ReceiptIcon,
    Gavel as GavelIcon,
    CalendarToday as CalendarIcon,
    Visibility as ViewIcon,
    Add as AddIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import clientService from '../../services/clientService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// TabPanel component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`client-tabpanel-${index}`}
            aria-labelledby={`client-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ClientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch client data
    useEffect(() => {
        const fetchClientDetails = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = await clientService.getClientById(id);
                setClient(data);
            } catch (err) {
                console.error('Error fetching client details:', err);
                setError(t('clients.notFound'));
            } finally {
                setLoading(false);
            }
        };

        fetchClientDetails();
    }, [id, isOnline, t]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    // Handle client deletion
    const handleDeleteClient = async () => {
        if (!isOnline) return;

        setDeleteLoading(true);

        try {
            await clientService.deleteClient(id);
            navigate('/clients');
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(t('clients.deleteError'));
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
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

    // Get client type icon
    const getClientTypeIcon = (type) => {
        switch (type) {
            case 'Corporate':
                return <BusinessIcon />;
            case 'Individual':
            default:
                return <PersonIcon />;
        }
    };

    // Get client initials for avatar
    const getClientInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error && !client) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error}
                </Alert>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/clients')}
                    >
                        {t('common.back')}
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            {client && (
                <>
                    <PageHeader
                        title={`${client.firstName} ${client.lastName}`}
                        subtitle={client.type === 'Corporate' && client.companyName ? client.companyName : t(`clients.${client.type?.toLowerCase()}`)}
                        breadcrumbs={[
                            { text: t('app.dashboard'), link: '/' },
                            { text: t('clients.clients'), link: '/clients' },
                            { text: `${client.firstName} ${client.lastName}` }
                        ]}
                        action={t('common.edit')}
                        actionIcon={<EditIcon />}
                        onActionClick={() => navigate(`/clients/${id}/edit`)}
                    />

                    {/* Client Overview Card */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mb: 2,
                                        bgcolor: client.type === 'Corporate' ? 'primary.main' : 'secondary.main'
                                    }}
                                >
                                    {client.type === 'Corporate' ?
                                        <BusinessIcon sx={{ fontSize: 40 }} /> :
                                        getClientInitials(client.firstName, client.lastName)}
                                </Avatar>
                                <Chip
                                    icon={getClientTypeIcon(client.type)}
                                    label={t(`clients.${client.type?.toLowerCase()}`)}
                                    color={client.type === 'Corporate' ? 'primary' : 'default'}
                                    variant="outlined"
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                    {t('clients.created')}: {formatDate(client.createdAt)}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={9}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <EmailIcon color="action" sx={{ mr: 2 }} />
                                            <Typography variant="body1">
                                                {client.email || t('common.notAvailable')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <PhoneIcon color="action" sx={{ mr: 2 }} />
                                            <Typography variant="body1">
                                                {client.phoneNumber || t('common.notAvailable')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <HomeIcon color="action" sx={{ mr: 2 }} />
                                            <Typography variant="body1">
                                                {client.address || t('common.notAvailable')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <BadgeIcon color="action" sx={{ mr: 2 }} />
                                            <Typography variant="body1">
                                                {t('clients.idNumber')}: {client.idNumber || t('common.notAvailable')}
                                            </Typography>
                                        </Box>
                                        {client.type === 'Corporate' && (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <BusinessIcon color="action" sx={{ mr: 2 }} />
                                                    <Typography variant="body1">
                                                        {t('clients.companyName')}: {client.companyName || t('common.notAvailable')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <ReceiptIcon color="action" sx={{ mr: 2 }} />
                                                    <Typography variant="body1">
                                                        {t('clients.taxId')}: {client.taxId || t('common.notAvailable')}
                                                    </Typography>
                                                </Box>
                                            </>
                                        )}
                                    </Grid>
                                </Grid>

                                {client.notes && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                            {t('clients.notes')}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                            {client.notes}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={handleOpenDeleteDialog}
                                        disabled={!isOnline}
                                    >
                                        {t('common.delete')}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Tabs for Related Information */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="client details tabs"
                        >
                            <Tab label={`${t('cases.cases')} (${client.cases?.length || 0})`} id="client-tab-0" />
                            <Tab label={`${t('appointments.appointments')} (${client.appointments?.length || 0})`} id="client-tab-1" />
                            <Tab label={`${t('billing.invoices')} (${client.invoices?.length || 0})`} id="client-tab-2" />
                        </Tabs>

                        {/* Cases Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/cases/new', { state: { clientId: client.clientId } })}
                                    disabled={!isOnline}
                                >
                                    {t('cases.newCase')}
                                </Button>
                            </Box>

                            {client.cases && client.cases.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('cases.caseNumber')}</TableCell>
                                                <TableCell>{t('cases.title')}</TableCell>
                                                <TableCell>{t('cases.assignedTo')}</TableCell>
                                                <TableCell>{t('cases.status')}</TableCell>
                                                <TableCell align="right">{t('common.actions')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {client.cases.map((caseItem) => (
                                                <TableRow key={caseItem.caseId} hover>
                                                    <TableCell>{caseItem.caseNumber}</TableCell>
                                                    <TableCell>{caseItem.title}</TableCell>
                                                    <TableCell>
                                                        {caseItem.assignedLawyer && caseItem.assignedLawyer.user ?
                                                            `${caseItem.assignedLawyer.user.firstName} ${caseItem.assignedLawyer.user.lastName}` :
                                                            t('cases.unassigned')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={t(`cases.status.${caseItem.status?.toLowerCase() || 'intake'}`)}
                                                            color={caseItem.status === 'Active' ? 'primary' : 'default'}
                                                        />
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
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        {t('cases.noClientsAssociated')}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* Appointments Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/appointments/new', { state: { clientId: client.clientId } })}
                                    disabled={!isOnline}
                                >
                                    {t('appointments.newAppointment')}
                                </Button>
                            </Box>

                            {client.appointments && client.appointments.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('appointments.date')}</TableCell>
                                                <TableCell>{t('appointments.time')}</TableCell>
                                                <TableCell>{t('appointments.title')}</TableCell>
                                                <TableCell>{t('appointments.status')}</TableCell>
                                                <TableCell align="right">{t('common.actions')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {client.appointments.map((appointment) => (
                                                <TableRow key={appointment.appointmentId} hover>
                                                    <TableCell>{formatDate(appointment.startTime)}</TableCell>
                                                    <TableCell>
                                                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                                    </TableCell>
                                                    <TableCell>{appointment.title}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={t(`appointments.status.${appointment.status || 'Scheduled'}`)}
                                                            color={appointment.status === 'Scheduled' ? 'primary' :
                                                                appointment.status === 'Completed' ? 'success' :
                                                                    appointment.status === 'Cancelled' ? 'error' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title={t('common.view')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                                                            >
                                                                <ViewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        {t('appointments.noAppointmentsForDate', { date: client.firstName })}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* Invoices Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/billing/invoices/new', { state: { clientId: client.clientId } })}
                                    disabled={!isOnline}
                                >
                                    {t('billing.createInvoice')}
                                </Button>
                            </Box>

                            {client.invoices && client.invoices.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('billing.invoiceNumber')}</TableCell>
                                                <TableCell>{t('billing.issueDate')}</TableCell>
                                                <TableCell>{t('billing.dueDate')}</TableCell>
                                                <TableCell>{t('billing.amount')}</TableCell>
                                                <TableCell>{t('billing.status.title')}</TableCell>
                                                <TableCell align="right">{t('common.actions')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {client.invoices.map((invoice) => (
                                                <TableRow key={invoice.invoiceId} hover>
                                                    <TableCell>{invoice.invoiceNumber}</TableCell>
                                                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                                                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD'
                                                        }).format(invoice.totalAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={t(`billing.status.${invoice.status?.toLowerCase() || 'draft'}`)}
                                                            color={
                                                                invoice.status === 'Paid' ? 'success' :
                                                                    invoice.status === 'Overdue' ? 'error' :
                                                                        invoice.status === 'Sent' ? 'primary' : 'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title={t('billing.viewInvoice')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                                            >
                                                                <ViewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        {t('billing.noInvoices')}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>
                    </Paper>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>{t('clients.deleteClient')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {client && t('clients.deleteConfirmation', {
                            firstName: client.firstName,
                            lastName: client.lastName
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

export default ClientDetailsPage;