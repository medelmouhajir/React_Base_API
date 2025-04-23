// src/pages/cases/CaseClientsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Avatar,
    IconButton,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Snackbar,
    Tooltip
} from '@mui/material';
import {
    Person as PersonIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
    CheckCircle as CheckCircleIcon,
    LinkOff as OfflineIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import caseService from '../../services/caseService';
import clientService from '../../services/clientService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const CaseClientsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // State
    const [caseData, setCaseData] = useState(null);
    const [availableClients, setAvailableClients] = useState([]);
    const [existingClients, setExistingClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [caseLoading, setCaseLoading] = useState(true);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Dialog states
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [clientToRemove, setClientToRemove] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);

    // Fetch case data
    useEffect(() => {
        const fetchCaseData = async () => {
            setCaseLoading(true);
            try {
                if (!isOnline) {
                    throw new Error(t('common.offlineMode'));
                }

                const data = await caseService.getCaseById(id);
                setCaseData(data);

                // Extract existing clients from case
                if (data.case_Clients && Array.isArray(data.case_Clients)) {
                    setExistingClients(data.case_Clients.map(cc => cc.client));
                }
            } catch (err) {
                console.error('Error fetching case details:', err);
                setError(t('cases.fetchError'));
            } finally {
                setCaseLoading(false);
            }
        };

        if (id) {
            fetchCaseData();
        }
    }, [id, isOnline, t]);

    // Fetch all clients
    useEffect(() => {
        const fetchClients = async () => {
            setClientsLoading(true);
            try {
                if (!isOnline) {
                    throw new Error(t('common.offlineMode'));
                }

                const allClients = await clientService.getClients();

                // Filter out clients already associated with this case
                const existingClientIds = existingClients.map(c => c.clientId);
                const filtered = allClients.filter(c => !existingClientIds.includes(c.clientId));

                setAvailableClients(filtered);
            } catch (err) {
                console.error('Error fetching clients:', err);
                setError(err.message || t('clients.fetchError'));
            } finally {
                setClientsLoading(false);
            }
        };

        fetchClients();
    }, [existingClients, isOnline, t]);

    // Update loading state based on both data fetch operations
    useEffect(() => {
        setLoading(caseLoading || clientsLoading);
    }, [caseLoading, clientsLoading]);

    // Filter available clients based on search term
    const filteredAvailableClients = availableClients.filter(client => {
        if (!searchTerm) return true;

        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const companyName = (client.companyName || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return fullName.includes(search) ||
            companyName.includes(search) ||
            email.includes(search);
    });

    // Handle add client to case
    const handleAddClient = async (clientId) => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }

        setActionInProgress(true);

        try {
            await caseService.addClientToCase(id, clientId);

            // Update local state
            const clientToAdd = availableClients.find(c => c.clientId === clientId);
            setExistingClients(prev => [...prev, clientToAdd]);
            setAvailableClients(prev => prev.filter(c => c.clientId !== clientId));

            setSuccessMessage(t('cases.clientAddedSuccess'));
        } catch (err) {
            console.error('Error adding client to case:', err);
            setError(t('cases.clientAddError'));
        } finally {
            setActionInProgress(false);
        }
    };

    // Open remove client dialog
    const handleOpenRemoveDialog = (client) => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }

        setClientToRemove(client);
        setRemoveDialogOpen(true);
    };

    // Handle remove client from case
    const handleRemoveClient = async () => {
        if (!clientToRemove || !isOnline) return;

        setActionInProgress(true);

        try {
            await caseService.removeClientFromCase(id, clientToRemove.clientId);

            // Update local state
            setExistingClients(prev => prev.filter(c => c.clientId !== clientToRemove.clientId));
            setAvailableClients(prev => [...prev, clientToRemove]);

            setSuccessMessage(t('cases.clientRemovedSuccess'));
            setRemoveDialogOpen(false);
            setClientToRemove(null);
        } catch (err) {
            console.error('Error removing client from case:', err);
            setError(t('cases.clientRemoveError'));
        } finally {
            setActionInProgress(false);
        }
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Clear success message
    const handleClearSuccess = () => {
        setSuccessMessage('');
    };

    return (
        <Container maxWidth="lg">
            {/* Page Header */}
            <PageHeader
                title={t('cases.manageClients')}
                subtitle={caseData ? `${t('cases.case')}: ${caseData.title} (${caseData.caseNumber})` : ''}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('cases.cases'), link: '/cases' },
                    { text: caseData?.caseNumber || id, link: `/cases/${id}` },
                    { text: t('cases.manageClients') }
                ]}
                action={t('cases.backToCase')}
                actionIcon={<BackIcon />}
                onActionClick={() => navigate(`/cases/${id}`)}
            />

            {/* Error Message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={handleClearError}
                >
                    {error}
                </Alert>
            )}

            {/* Offline Warning */}
            {!isOnline && (
                <Alert
                    severity="warning"
                    icon={<OfflineIcon />}
                    sx={{ mb: 3 }}
                >
                    {t('common.offlineMode')}
                </Alert>
            )}

            {/* Success Message */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={handleClearSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClearSuccess}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Current Clients */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                <Typography variant="h6">
                                    {t('cases.currentClients')} ({existingClients.length})
                                </Typography>
                            </Box>

                            <List sx={{ p: 0, maxHeight: '500px', overflow: 'auto' }}>
                                {existingClients.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <PersonIcon color="disabled" sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
                                        <Typography color="textSecondary">
                                            {t('cases.noClientsAssociated')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    existingClients.map(client => (
                                        <React.Fragment key={client.clientId}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`${client.firstName} ${client.lastName}`}
                                                    secondary={
                                                        <>
                                                            {client.companyName && (
                                                                <Typography component="span" variant="body2" display="block">
                                                                    {client.companyName}
                                                                </Typography>
                                                            )}
                                                            <Typography component="span" variant="body2">
                                                                {client.email}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Tooltip title={t('clients.viewClient')}>
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => navigate(`/clients/${client.clientId}`)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <PersonIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('cases.removeClient')}>
                                                        <IconButton
                                                            edge="end"
                                                            color="error"
                                                            onClick={() => handleOpenRemoveDialog(client)}
                                                            disabled={!isOnline || actionInProgress}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Available Clients */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                                <Typography variant="h6">
                                    {t('cases.availableClients')} ({filteredAvailableClients.length})
                                </Typography>
                            </Box>

                            <Box sx={{ p: 2 }}>
                                <TextField
                                    fullWidth
                                    placeholder={t('clients.searchPlaceholder')}
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
                            </Box>

                            <List sx={{ p: 0, maxHeight: '430px', overflow: 'auto' }}>
                                {filteredAvailableClients.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="textSecondary">
                                            {searchTerm
                                                ? t('clients.noSearchResults')
                                                : t('cases.noAvailableClients')}
                                        </Typography>
                                        <Button
                                            variant="text"
                                            color="primary"
                                            startIcon={<AddIcon />}
                                            sx={{ mt: 2 }}
                                            onClick={() => navigate('/clients/new')}
                                        >
                                            {t('clients.createNew')}
                                        </Button>
                                    </Box>
                                ) : (
                                    filteredAvailableClients.map(client => (
                                        <React.Fragment key={client.clientId}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`${client.firstName} ${client.lastName}`}
                                                    secondary={
                                                        <>
                                                            {client.companyName && (
                                                                <Typography component="span" variant="body2" display="block">
                                                                    {client.companyName}
                                                                </Typography>
                                                            )}
                                                            <Typography component="span" variant="body2">
                                                                {client.email}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Tooltip title={t('clients.viewClient')}>
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => navigate(`/clients/${client.clientId}`)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <PersonIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('cases.addClient')}>
                                                        <IconButton
                                                            edge="end"
                                                            color="primary"
                                                            onClick={() => handleAddClient(client.clientId)}
                                                            disabled={!isOnline || actionInProgress}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Create Client Button (Bottom) */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/clients/new')}
                    disabled={!isOnline}
                >
                    {t('clients.createNew')}
                </Button>
            </Box>

            {/* Remove Client Confirmation Dialog */}
            <Dialog
                open={removeDialogOpen}
                onClose={() => setRemoveDialogOpen(false)}
            >
                <DialogTitle>{t('cases.removeClientConfirmTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {clientToRemove && (
                            t('cases.removeClientConfirmMessage', {
                                client: `${clientToRemove.firstName} ${clientToRemove.lastName}`,
                                caseTitle: caseData?.title
                            })
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setRemoveDialogOpen(false)}
                        disabled={actionInProgress}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleRemoveClient}
                        color="error"
                        variant="contained"
                        disabled={actionInProgress}
                        startIcon={actionInProgress ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {actionInProgress ? t('common.removing') : t('common.remove')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CaseClientsPage;