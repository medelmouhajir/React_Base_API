// src/pages/clients/ClientDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    Grid,
    Typography,
    Divider,
    Button,
    Tab,
    Tabs,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Description as DescriptionIcon,
    Gavel as GavelIcon,
    EventNote as EventNoteIcon,
    Receipt as ReceiptIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Tab Panel Component
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
                <Box sx={{ p: 3 }}>
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

    // State variables
    const [client, setClient] = useState(null);
    const [cases, setCases] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch client data
    useEffect(() => {
        const fetchClientData = async () => {
            if (!isOnline) {
                setLoading(false);
                setError('You are offline. Some data may be unavailable.');
                return;
            }

            try {
                // Fetch client details
                const response = await fetch(`/api/clients/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch client details');
                }

                const data = await response.json();
                setClient(data);

                // Fetch related data
                const [casesRes, appointmentsRes, invoicesRes] = await Promise.all([
                    fetch(`/api/clients/${id}/cases`, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    }),
                    fetch(`/api/clients/${id}/appointments`, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    }),
                    fetch(`/api/clients/${id}/invoices`, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    })
                ]);

                if (casesRes.ok) {
                    const casesData = await casesRes.json();
                    setCases(casesData);
                }

                if (appointmentsRes.ok) {
                    const appointmentsData = await appointmentsRes.json();
                    setAppointments(appointmentsData);
                }

                if (invoicesRes.ok) {
                    const invoicesData = await invoicesRes.json();
                    setInvoices(invoicesData);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching client data:', err);
                setError('Failed to load client information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [id, user, isOnline]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Navigate to edit client page
    const handleEditClient = () => {
        navigate(`/clients/edit/${id}`);
    };

    // Open delete confirmation dialog
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleDeleteClose = () => {
        setDeleteDialogOpen(false);
    };

    // Handle client deletion
    const handleDeleteConfirm = async () => {
        if (!isOnline) {
            setError('You are offline. Cannot delete client at this time.');
            setDeleteDialogOpen(false);
            return;
        }

        setDeleteLoading(true);

        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete client');
            }

            // Navigate back to clients list on success
            navigate('/clients', {
                state: { notification: `Client ${client?.firstName} ${client?.lastName || client?.companyName} deleted successfully` }
            });
        } catch (err) {
            console.error('Error deleting client:', err);
            setError('Failed to delete client. Please try again later.');
            setDeleteDialogOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Format address for display
    const formatAddress = (client) => {
        if (!client) return '';

        const parts = [
            client.address,
            client.city,
            client.state,
            client.zipCode
        ].filter(Boolean);

        return parts.join(', ');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!client && !loading) {
        return (
            <Box>
                <PageHeader
                    title="Client Not Found"
                    breadcrumbs={[
                        { text: 'Dashboard', link: '/' },
                        { text: 'Clients', link: '/clients' },
                        { text: 'Client Details' }
                    ]}
                />
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || 'Client not found. The client may have been deleted or you may not have permission to view it.'}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/clients')}
                    sx={{ mt: 2 }}
                >
                    Back to Clients
                </Button>
            </Box>
        );
    }

    return (
        <>
            <PageHeader
                title={client.isIndividual ? `${client.firstName} ${client.lastName}` : client.companyName}
                subtitle={client.isIndividual ?
                    (client.companyName ? `Individual Client - ${client.companyName}` : 'Individual Client') :
                    'Business Client'
                }
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients', link: '/clients' },
                    { text: client.isIndividual ? `${client.firstName} ${client.lastName}` : client.companyName }
                ]}
                action
                actionText="Edit Client"
                actionIcon={<EditIcon />}
                onActionClick={handleEditClient}
            />

            {error && (
                <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {client.isIndividual ? (
                                <PersonIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                            ) : (
                                <BusinessIcon fontSize="large" color="secondary" sx={{ mr: 2 }} />
                            )}
                            <Typography variant="h5">
                                {client.isIndividual ?
                                    `${client.firstName} ${client.lastName}` :
                                    client.companyName}
                            </Typography>
                            <Chip
                                label={client.isIndividual ? "Individual" : "Business"}
                                color={client.isIndividual ? "primary" : "secondary"}
                                size="small"
                                sx={{ ml: 2 }}
                            />
                            {!client.isActive && (
                                <Chip
                                    label="Inactive"
                                    color="error"
                                    size="small"
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Box>
                        <IconButton
                            color="error"
                            onClick={handleDeleteClick}
                            aria-label="delete client"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        {/* Contact Information */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Contact Information
                            </Typography>

                            {client.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {client.email}
                                    </Typography>
                                </Box>
                            )}

                            {client.phoneNumber && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {client.phoneNumber}
                                    </Typography>
                                </Box>
                            )}

                            {formatAddress(client) && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                    <LocationIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {formatAddress(client)}
                                    </Typography>
                                </Box>
                            )}
                        </Grid>

                        {/* Additional Information */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Additional Information
                            </Typography>

                            {client.createdAt && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Client since: {new Date(client.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Cases: {cases.length || 0}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Appointments: {appointments.length || 0}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Invoices: {invoices.length || 0}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Notes */}
                        {client.notes && (
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <DescriptionIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Notes
                                        </Typography>
                                        <Typography variant="body1">
                                            {client.notes}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Card>

            {/* Tabs for related data */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="client details tabs"
                    >
                        <Tab
                            icon={<GavelIcon />}
                            iconPosition="start"
                            label={`Cases (${cases.length})`}
                            id="client-tab-0"
                            aria-controls="client-tabpanel-0"
                        />
                        <Tab
                            icon={<EventNoteIcon />}
                            iconPosition="start"
                            label={`Appointments (${appointments.length})`}
                            id="client-tab-1"
                            aria-controls="client-tabpanel-1"
                        />
                        <Tab
                            icon={<ReceiptIcon />}
                            iconPosition="start"
                            label={`Invoices (${invoices.length})`}
                            id="client-tab-2"
                            aria-controls="client-tabpanel-2"
                        />
                    </Tabs>
                </Box>

                {/* Cases Tab */}
                <TabPanel value={tabValue} index={0}>
                    {cases.length > 0 ? (
                        <Grid container spacing={2}>
                            {cases.map(caseItem => (
                                <Grid item xs={12} md={6} key={caseItem.caseId}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1">
                                                {caseItem.title}
                                            </Typography>
                                            <Chip
                                                label={caseItem.status}
                                                size="small"
                                                color={
                                                    caseItem.status === 'Active' ? 'success' :
                                                        caseItem.status === 'Pending' ? 'warning' :
                                                            caseItem.status === 'Closed' ? 'error' : 'default'
                                                }
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {caseItem.caseNumber}
                                        </Typography>
                                        <Button
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                        >
                                            View Details
                                        </Button>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No cases found for this client.
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={() => navigate('/cases/new', { state: { clientId: client.clientId } })}
                            >
                                Create New Case
                            </Button>
                        </Box>
                    )}
                </TabPanel>

                {/* Appointments Tab */}
                <TabPanel value={tabValue} index={1}>
                    {appointments.length > 0 ? (
                        <Grid container spacing={2}>
                            {appointments.map(appointment => (
                                <Grid item xs={12} key={appointment.appointmentId}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1">
                                                {appointment.title}
                                            </Typography>
                                            <Chip
                                                label={appointment.status}
                                                size="small"
                                                color={
                                                    appointment.status === 'Scheduled' ? 'primary' :
                                                        appointment.status === 'Completed' ? 'success' :
                                                            appointment.status === 'Cancelled' ? 'error' : 'default'
                                                }
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(appointment.startTime).toLocaleString()} -
                                            {new Date(appointment.endTime).toLocaleTimeString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {appointment.location || 'No location specified'}
                                        </Typography>
                                        <Button
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                                        >
                                            View Details
                                        </Button>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No appointments found for this client.
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={() => navigate('/appointments/new', { state: { clientId: client.clientId } })}
                            >
                                Schedule Appointment
                            </Button>
                        </Box>
                    )}
                </TabPanel>

                {/* Invoices Tab */}
                <TabPanel value={tabValue} index={2}>
                    {invoices.length > 0 ? (
                        <Grid container spacing={2}>
                            {invoices.map(invoice => (
                                <Grid item xs={12} md={6} key={invoice.invoiceId}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1">
                                                {invoice.invoiceNumber}
                                            </Typography>
                                            <Chip
                                                label={invoice.status}
                                                size="small"
                                                color={
                                                    invoice.status === 'Paid' ? 'success' :
                                                        invoice.status === 'Overdue' ? 'error' :
                                                            invoice.status === 'Pending' ? 'warning' : 'default'
                                                }
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Amount: ${invoice.amount.toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                        </Typography>
                                        <Button
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                        >
                                            View Details
                                        </Button>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No invoices found for this client.
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={() => navigate('/billing/invoices/new', { state: { clientId: client.clientId } })}
                            >
                                Create New Invoice
                            </Button>
                        </Box>
                    )}
                </TabPanel>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteClose}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Delete Client
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete {client.isIndividual ?
                            `${client.firstName} ${client.lastName}` :
                            client.companyName}? This action cannot be undone.
                        {(cases.length > 0 || appointments.length > 0 || invoices.length > 0) && (
                            <span>
                                <br /><br />
                                <strong>Warning:</strong> This client has associated data ({cases.length} cases,
                                {appointments.length} appointments, {invoices.length} invoices) that may be affected.
                            </span>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} disabled={deleteLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        autoFocus
                        disabled={deleteLoading}
                        startIcon={deleteLoading && <CircularProgress size={20} />}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ClientDetailsPage;