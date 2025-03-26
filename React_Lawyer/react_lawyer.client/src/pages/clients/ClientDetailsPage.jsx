// src/pages/clients/ClientDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Divider,
    Chip,
    Button,
    Tabs,
    Tab,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    PersonOutline as PersonIcon,
    Business as BusinessIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    InsertDriveFile as FileIcon,
    EventNote as EventIcon,
    Receipt as ReceiptIcon,
    Gavel as GavelIcon
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import clientService from '../../services/clientService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

function ClientDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    // State
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cases, setCases] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    // Load client data
    useEffect(() => {
        const fetchClient = async () => {
            try {
                setLoading(true);
                const data = await clientService.getClientById(parseInt(id));
                setClient(data);
                setError('');
            } catch (err) {
                console.error('Error fetching client:', err);
                setError('Failed to load client details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (isOnline) {
            fetchClient();
        } else {
            setError('You are offline. Some data may not be available.');
            setLoading(false);
        }
    }, [id, isOnline]);

    // Fetch related data when tab changes
    useEffect(() => {
        const fetchRelatedData = async () => {
            if (!client) return;

            setLoadingRelated(true);
            try {
                if (tabValue === 1) {
                    // Fetch cases
                    const casesData = await clientService.getClientCases(client.clientId);
                    setCases(casesData);
                } else if (tabValue === 2) {
                    // Fetch appointments
                    const appointmentsData = await clientService.getClientAppointments(client.clientId);
                    setAppointments(appointmentsData);
                } else if (tabValue === 3) {
                    // Fetch invoices
                    const invoicesData = await clientService.getClientInvoices(client.clientId);
                    setInvoices(invoicesData);
                }
            } catch (err) {
                console.error('Error fetching related data:', err);
            } finally {
                setLoadingRelated(false);
            }
        };

        if (isOnline) {
            fetchRelatedData();
        }
    }, [tabValue, client, isOnline]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle edit client
    const handleEditClient = () => {
        navigate(`/clients/edit/${id}`);
    };

    // Handle delete client
    const handleDeleteClient = async () => {
        if (!isOnline) {
            setError('Cannot delete client while offline');
            return;
        }

        try {
            await clientService.deleteClient(parseInt(id));
            navigate('/clients', { replace: true });
        } catch (err) {
            console.error('Error deleting client:', err);
            setError('Failed to delete client. Please try again.');
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error state
    if (error && !client) {
        return (
            <Box sx={{ mt: 4, mx: 2 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/clients')}
                >
                    Back to Clients
                </Button>
            </Box>
        );
    }

    // If client not found
    if (!client) {
        return (
            <Box sx={{ mt: 4, mx: 2 }}>
                <Alert severity="warning">Client not found</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/clients')}
                >
                    Back to Clients
                </Button>
            </Box>
        );
    }

    return (
        <>
            <PageHeader
                title={`${client.firstName} ${client.lastName}`}
                subtitle={client.type === 'Corporate' ? client.companyName : 'Individual Client'}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients', link: '/clients' },
                    { text: `${client.firstName} ${client.lastName}` }
                ]}
                action={handleEditClient}
                actionText="Edit Client"
                actionIcon={<EditIcon />}
            />

            {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Client Overview Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {client.type === 'Corporate' ? (
                                    <BusinessIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                                ) : (
                                    <PersonIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                                )}
                                <Typography variant="h6">
                                    {client.firstName} {client.lastName}
                                </Typography>
                            </Box>

                            {client.type === 'Corporate' && (
                                <>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Company</Typography>
                                    <Typography variant="body1" sx={{ mb: 2 }}>{client.companyName}</Typography>
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography>{client.email || 'No email provided'}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography>{client.phoneNumber || 'No phone number provided'}</Typography>
                            </Box>

                            {client.address && (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    <strong>Address:</strong><br />
                                    {client.address}
                                </Typography>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Chip
                                    label={client.type}
                                    color={client.type === 'Corporate' ? 'primary' : 'secondary'}
                                    size="small"
                                />
                                <IconButton
                                    color="error"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={!isOnline}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Client Details and Related Items */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                        >
                            <Tab icon={<PersonIcon />} label="Details" />
                            <Tab icon={<GavelIcon />} label="Cases" />
                            <Tab icon={<EventIcon />} label="Appointments" />
                            <Tab icon={<ReceiptIcon />} label="Invoices" />
                        </Tabs>

                        <CardContent>
                            {/* Details Tab */}
                            {tabValue === 0 && (
                                <Grid container spacing={2}>
                                    {client.idNumber && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">ID Number</Typography>
                                            <Typography variant="body1">{client.idNumber}</Typography>
                                        </Grid>
                                    )}

                                    {client.type === 'Corporate' && client.taxId && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Tax ID</Typography>
                                            <Typography variant="body1">{client.taxId}</Typography>
                                        </Grid>
                                    )}

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Created</Typography>
                                        <Typography variant="body1">
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Grid>

                                    {client.notes && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Notes</Typography>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {client.notes}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            )}

                            {/* Cases Tab */}
                            {tabValue === 1 && (
                                <>
                                    {loadingRelated ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                            <CircularProgress size={30} />
                                        </Box>
                                    ) : cases.length > 0 ? (
                                        <>
                                            {cases.map((caseItem) => (
                                                <Box
                                                    key={caseItem.caseId}
                                                    sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                                                    }}
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <GavelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="subtitle1">{caseItem.title}</Typography>
                                                    </Box>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2" color="text.secondary">Case Number</Typography>
                                                            <Typography variant="body2">{caseItem.caseNumber}</Typography>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                                            <Chip label={caseItem.status} size="small" />
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            ))}
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <FileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography color="text.secondary">No cases found for this client</Typography>
                                            <Button
                                                variant="contained"
                                                sx={{ mt: 2 }}
                                                onClick={() => navigate('/cases/new', { state: { clientId: client.clientId } })}
                                            >
                                                Create New Case
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}

                            {/* Appointments Tab */}
                            {tabValue === 2 && (
                                <>
                                    {loadingRelated ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                            <CircularProgress size={30} />
                                        </Box>
                                    ) : appointments.length > 0 ? (
                                        <>
                                            {appointments.map((appointment) => (
                                                <Box
                                                    key={appointment.appointmentId}
                                                    sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="subtitle1">{appointment.title}</Typography>
                                                    </Box>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                                                            <Typography variant="body2">
                                                                {new Date(appointment.startTime).toLocaleString()}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                                            <Chip label={appointment.status} size="small" />
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            ))}
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography color="text.secondary">No appointments found for this client</Typography>
                                            <Button
                                                variant="contained"
                                                sx={{ mt: 2 }}
                                                onClick={() => navigate('/appointments/new', { state: { clientId: client.clientId } })}
                                            >
                                                Schedule Appointment
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}

                            {/* Invoices Tab */}
                            {tabValue === 3 && (
                                <>
                                    {loadingRelated ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                            <CircularProgress size={30} />
                                        </Box>
                                    ) : invoices.length > 0 ? (
                                        <>
                                            {invoices.map((invoice) => (
                                                <Box
                                                    key={invoice.invoiceId}
                                                    sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                                                    }}
                                                    onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <ReceiptIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="subtitle1">Invoice #{invoice.invoiceNumber}</Typography>
                                                    </Box>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                                                            <Typography variant="body2">
                                                                ${(invoice.amount + invoice.taxAmount).toFixed(2)}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">Date</Typography>
                                                            <Typography variant="body2">
                                                                {new Date(invoice.issueDate).toLocaleDateString()}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                                            <Chip
                                                                label={invoice.status}
                                                                color={invoice.status === 'Paid' ? 'success' :
                                                                    invoice.status === 'Overdue' ? 'error' : 'default'}
                                                                size="small"
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            ))}
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <ReceiptIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography color="text.secondary">No invoices found for this client</Typography>
                                            <Button
                                                variant="contained"
                                                sx={{ mt: 2 }}
                                                onClick={() => navigate('/billing/invoices/new', { state: { clientId: client.clientId } })}
                                            >
                                                Create New Invoice
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Client</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete client {client.firstName} {client.lastName}?
                    This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteClient}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ClientDetailsPage;