import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container, Paper, Box, Typography, Button, Tabs, Tab,
    Chip, Grid, Card, CardContent, CardHeader, Divider, IconButton,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Avatar, CircularProgress, Snackbar, Alert, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Select, FormControl, InputLabel, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tooltip,
    Skeleton
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PictureAsPdf as PdfIcon,
    Event as EventIcon,
    AttachMoney as MoneyIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    Notes as NotesIcon,
    Add as AddIcon,
    FileCopy as DocumentIcon,
    CheckCircleOutline as CheckIcon,
    ErrorOutline as WarningIcon,
    ArrowBack as BackIcon,
    LinkOff as OfflineIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import PortalDataSection from '../../components/cases/PortalDataSection';
import caseService from '../../services/caseService';
import clientService from '../../services/clientService';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import DocumentGenerationForm from '../../components/documents/DocumentGenerationForm';


// Tab panel component
const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`case-tabpanel-${index}`}
            aria-labelledby={`case-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const CaseDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Status dialog state
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [statusDialogLoading, setStatusDialogLoading] = useState(false);

    // Add event dialog state
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDialogLoading, setEventDialogLoading] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Success message state
    const [successMessage, setSuccessMessage] = useState('');

    // Case status options - mapped from the backend enum
    const CASE_STATUSES = [
        { value: 0, label: t('cases.status.Intake'), color: 'info' },
        { value: 1, label: t('cases.status.Opened'), color: 'success' },
        { value: 2, label: t('cases.status.InProgress'), color: 'success' },
        { value: 3, label: t('cases.status.PendingCourt'), color: 'warning' },
        { value: 4, label: t('cases.status.PendingClient'), color: 'warning' },
        { value: 5, label: t('cases.status.PendingOpposingParty'), color: 'warning' },
        { value: 6, label: t('cases.status.InNegotiation'), color: 'info' },
        { value: 7, label: t('cases.status.InMediation'), color: 'info' },
        { value: 8, label: t('cases.status.InTrial'), color: 'info' },
        { value: 9, label: t('cases.status.Settlement'), color: 'light' },
        { value: 10, label: t('cases.status.Judgment'), color: 'light' },
        { value: 11, label: t('cases.status.Appeal'), color: 'light' },
        { value: 12, label: t('cases.status.Closed'), color: 'default' },
        { value: 13, label: t('cases.status.Archived'), color: 'default' }
    ];

    // Case type options - mapped from the backend enum
    const CASE_TYPES = [
        { value: 0, label: t('cases.types.FamilyLaw') },
        { value: 1, label: t('cases.types.CriminalLaw') },
        { value: 2, label: t('cases.types.CivilLaw') },
        { value: 3, label: t('cases.types.CommercialLaw') },
        { value: 4, label: t('cases.types.AdministrativeLaw') },
        { value: 5, label: t('cases.types.LaborLaw') },
        { value: 6, label: t('cases.types.IntellectualProperty') },
        { value: 7, label: t('cases.types.RealEstate') },
        { value: 8, label: t('cases.types.Immigration') },
        { value: 10, label: t('cases.type.Other') }
    ];

    // Fetch case data
    useEffect(() => {
        const fetchCaseData = async () => {
            setLoading(true);
            setError('');

            try {
                if (!isOnline) {
                    // If offline, try to get from localStorage or show offline message
                    const cachedCase = localStorage.getItem(`case_${id}`);
                    if (cachedCase) {
                        setCaseData(JSON.parse(cachedCase));
                        setError(t('common.offlineMode'));
                    } else {
                        setError(t('common.offlineNoData'));
                    }
                    setLoading(false);
                    return;
                }

                const data = await caseService.getCaseById(id);

                // Store in localStorage for offline access
                localStorage.setItem(`case_${id}`, JSON.stringify(data));

                setCaseData(data);

                // Initialize status dialog with current status
                if (data) {
                    setNewStatus(data.status);
                }
            } catch (err) {
                console.error('Error fetching case details:', err);
                setError(t('cases.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCaseData();
        }
    }, [id, isOnline, t]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Open status change dialog
    const handleOpenStatusDialog = () => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }
        setStatusDialogOpen(true);
    };

    // Handle status change
    const handleStatusChange = async () => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }

        setStatusDialogLoading(true);

        try {
            await caseService.updateCaseStatus(id, newStatus, user?.id, statusNotes);

            // Update local case data
            setCaseData(prev => ({
                ...prev,
                status: newStatus
            }));

            setSuccessMessage(t('cases.statusUpdateSuccess'));
            setStatusDialogOpen(false);
            setStatusNotes('');
        } catch (err) {
            setError(t('cases.statusUpdateError'));
        } finally {
            setStatusDialogLoading(false);
        }
    };

    // Open add event dialog
    const handleOpenEventDialog = () => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }
        setEventDialogOpen(true);
    };

    // Handle add event
    const handleAddEvent = async () => {
        setSubmitAttempted(true);

        if (!eventTitle) {
            setError(t('cases.events.titleRequired'));
            return;
        }

        setEventDialogLoading(true);

        try {
            await caseService.addCaseEvent(id, {
                caseId: Number(id),
                createdById: user?.id,
                title: eventTitle,
                description: eventDescription,
                date: new Date().toISOString(),
                eventType: 'Note',
                createdAt: new Date().toISOString()
            });

            // Refetch case data to get the new event
            const updatedCase = await caseService.getCaseById(id);
            setCaseData(updatedCase);

            setSuccessMessage(t('cases.events.addSuccess'));
            setEventDialogOpen(false);
            setEventTitle('');
            setEventDescription('');
        } catch (err) {
            setError(t('cases.events.addError'));
        } finally {
            setEventDialogLoading(false);
        }
    };

    // Handle case deletion
    const handleDeleteCase = async () => {
        if (!isOnline) {
            setError(t('common.offlineActionError'));
            return;
        }

        try {
            await caseService.deleteCase(id);
            setSuccessMessage(t('cases.deleteSuccess'));

            // Wait a moment before navigating
            setTimeout(() => {
                navigate('/cases');
            }, 1500);
        } catch (err) {
            setError(t('cases.deleteError'));
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleDateString();
    };

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleString();
    };

    // Get status chip color
    const getStatusColor = (status) => {
        const statusItem = CASE_STATUSES.find(s => s.value === status);
        return statusItem ? statusItem.color : 'default';
    };

    // Get status label
    const getStatusLabel = (status) => {
        const statusItem = CASE_STATUSES.find(s => s.value === status);
        return statusItem ? statusItem.label : t('common.unknown');
    };

    // Get case type label
    const getCaseTypeLabel = (type) => {
        const typeItem = CASE_TYPES.find(t => t.value === type);
        return typeItem ? typeItem.label : t('common.unknown');
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Clear success message
    const handleClearSuccess = () => {
        setSuccessMessage('');
    };

    // Loading skeleton
    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mb: 3 }}>
                    <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
                </Box>

                <Skeleton variant="rectangular" height={180} sx={{ mb: 3, borderRadius: 1 }} />

                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
            </Container>
        );
    }

    // Error state when case not found
    if (!caseData && error) {
        return (
            <Container maxWidth="lg">
                <Paper sx={{ p: 4, my: 4, textAlign: 'center' }}>
                    <WarningIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h5" color="error" gutterBottom>
                        {t('cases.notFound')}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<BackIcon />}
                        onClick={() => navigate('/cases')}
                    >
                        {t('common.backToList')}
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            {/* Page Header */}
            <PageHeader
                title={caseData?.title}
                subtitle={t('cases.caseNumber', { number: caseData?.caseNumber })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('cases.cases'), link: '/cases' },
                    { text: caseData?.caseNumber || caseData?.caseId }
                ]}
                action={t('common.edit')}
                actionIcon={<EditIcon />}
                onActionClick={() => navigate(`/cases/${id}/edit`)}
            />

            {/* Offline Mode Warning */}
            {!isOnline && (
                <Alert
                    severity="warning"
                    icon={<OfflineIcon />}
                    sx={{ mb: 3 }}
                >
                    {t('common.offlineMode')}
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert
                    severity="error"
                    onClose={handleClearError}
                    sx={{ mb: 3 }}
                >
                    {error}
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

            {/* Case Summary Card */}
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                            label={getStatusLabel(caseData?.status)}
                            color={getStatusColor(caseData?.status)}
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        {caseData?.isUrgent && (
                            <Chip label={t('cases.urgent')} color="error" size="small" />
                        )}
                    </Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={handleOpenStatusDialog}
                            disabled={!isOnline}
                            sx={{ mr: 1 }}
                        >
                            {t('cases.changeStatus')}
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={!isOnline}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white',
                                }
                            }}
                        >
                            {t('common.delete')}
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.type')}
                            </Typography>
                            <Typography variant="body1">
                                {getCaseTypeLabel(caseData?.type)}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.openDate')}
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(caseData?.openDate)}
                            </Typography>
                        </Box>

                        {caseData?.closeDate && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    {t('cases.closeDate')}
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(caseData?.closeDate)}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.assignedLawyer')}
                            </Typography>
                            <Typography variant="body1">
                                {caseData?.assignedLawyer && caseData?.assignedLawyer.user
                                    ? `${caseData.assignedLawyer.user.firstName} ${caseData.assignedLawyer.user.lastName}`
                                    : t('cases.unassigned')}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.court')}
                            </Typography>
                            <Typography variant="body1">
                                {caseData?.juridiction?.name || t('common.notAvailable')}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.courtCaseNumber')}
                            </Typography>
                            <Typography variant="body1">
                                {caseData?.courtCaseNumber || t('common.notAvailable')}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.nextHearing')}
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(caseData?.nextHearingDate)}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {t('cases.opposingParty')}
                            </Typography>
                            <Typography variant="body1">
                                {caseData?.opposingParty || t('common.notAvailable')}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {t('cases.description')}
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {caseData?.description || t('common.noDescriptionProvided')}
                        </Typography>
                    </Grid>
                </Grid>


                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title={t('documents.documents')} />
                        <CardContent>
                            {/* Existing document list */}

                            {/* Add the document generation form */}
                            <DocumentGenerationForm
                                caseId={parseInt(id)}
                                entityType="case"
                                onSuccess={() => fetchCaseData()}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label={t('clients.clients')} icon={<PersonIcon />} iconPosition="start" />
                    <Tab label={t('cases.events.events')} icon={<EventIcon />} iconPosition="start" />
                    <Tab label={t('documents.documents')} icon={<DocumentIcon />} iconPosition="start" />
                    <Tab label={t('billing.billing')} icon={<MoneyIcon />} iconPosition="start" />
                    <Tab label={t('cases.notes')} icon={<NotesIcon />} iconPosition="start" />
                    <Tab label={t('cases.portal.moroccanTribunalPortal')} icon={<GavelIcon />} iconPosition="start" />
                </Tabs>

                {/* Clients Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/cases/${id}/clients/add`)}
                            disabled={!isOnline}
                        >
                            {t('clients.addClient')}
                        </Button>
                    </Box>

                    {caseData?.case_Clients && caseData.case_Clients.length > 0 ? (
                        <Grid container spacing={2}>
                            {caseData.case_Clients.map(clientRelation => (
                                <Grid item xs={12} md={6} key={clientRelation.client.clientId}>
                                    <Card sx={{
                                        height: '100%',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: 4,
                                            transform: 'translateY(-2px)'
                                        }
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography variant="h6">
                                                        {clientRelation.client.firstName} {clientRelation.client.lastName}
                                                    </Typography>
                                                    {clientRelation.client.companyName && (
                                                        <Typography variant="body2" color="textSecondary">
                                                            {clientRelation.client.companyName}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Tooltip title={t('clients.viewClient')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/clients/${clientRelation.client.clientId}`)}
                                                    >
                                                        <PersonIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>

                                            <Divider sx={{ my: 1 }} />

                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <strong>{t('clients.email')}:</strong> {clientRelation.client.email || t('common.notAvailable')}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>{t('clients.phone')}:</strong> {clientRelation.client.phoneNumber || t('common.notAvailable')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PersonIcon color="disabled" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary">
                                {t('cases.noClientsAssociated')}
                            </Typography>
                        </Box>
                    )}
                </TabPanel>

                {/* Events Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenEventDialog}
                            disabled={!isOnline}
                        >
                            {t('cases.events.addEvent')}
                        </Button>
                    </Box>

                    {caseData?.events && caseData.events.length > 0 ? (
                        <List>
                            {caseData.events
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map(event => (
                                    <ListItem
                                        key={event.caseEventId}
                                        alignItems="flex-start"
                                        sx={{
                                            mb: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: event.isImportant ? 'rgba(255, 0, 0, 0.05)' : 'transparent'
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Avatar
                                                sx={{
                                                    bgcolor: event.eventType === 'StatusChange' ? 'primary.main' : 'secondary.main'
                                                }}
                                            >
                                                {event.eventType === 'StatusChange' ? <GavelIcon /> : <EventIcon />}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight={event.isImportant ? 'bold' : 'normal'}>
                                                    {event.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {formatDateTime(event.date)}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                                        {event.description}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Typography variant="caption" color="textSecondary">
                                                {event.createdBy ?
                                                    `${event.createdBy.firstName} ${event.createdBy.lastName}` :
                                                    t('common.system')}
                                            </Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                        </List>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <EventIcon color="disabled" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary">
                                {t('cases.events.noEventsRecorded')}
                            </Typography>
                        </Box>
                    )}
                </TabPanel>

                {/* Documents Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/documents/upload?caseId=${id}`)}
                            disabled={!isOnline}
                        >
                            {t('documents.uploadDocument')}
                        </Button>
                    </Box>

                    {caseData?.documents && caseData.documents.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="documents table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('documents.title')}</TableCell>
                                        <TableCell>{t('documents.type')}</TableCell>
                                        <TableCell>{t('documents.uploadedBy')}</TableCell>
                                        <TableCell>{t('documents.date')}</TableCell>
                                        <TableCell align="right">{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.documents.map(doc => (
                                        <TableRow key={doc.documentId} hover>
                                            <TableCell>{doc.title || doc.fileName}</TableCell>
                                            <TableCell>{doc.documentType || doc.fileType}</TableCell>
                                            <TableCell>{doc.uploadedBy.firstName || t('common.system')}</TableCell>
                                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('documents.download')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => window.open(`/api/Documents/${doc.documentId}/download`)}
                                                        disabled={!isOnline}
                                                    >
                                                        <PdfIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common.delete')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={!isOnline}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <DocumentIcon color="disabled" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary">
                                {t('documents.noDocumentsUploaded')}
                            </Typography>
                        </Box>
                    )}
                </TabPanel>

                {/* Billing Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">{t('billing.invoices')}</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/billing/invoices/new?caseId=${id}`)}
                            disabled={!isOnline}
                        >
                            {t('billing.createInvoice')}
                        </Button>
                    </Box>

                    {caseData?.invoices && caseData.invoices.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="invoices table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('billing.invoiceNumber')}</TableCell>
                                        <TableCell>{t('billing.issueDate')}</TableCell>
                                        <TableCell>{t('billing.dueDate')}</TableCell>
                                        <TableCell>{t('billing.amount')}</TableCell>
                                        <TableCell>{t('common.status')}</TableCell>
                                        <TableCell align="right">{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.invoices.map(invoice => (
                                        <TableRow key={invoice.invoiceId} hover>
                                            <TableCell>{invoice.invoiceNumber}</TableCell>
                                            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.status === 0 ? t('billing.status.draft') :
                                                        invoice.status === 1 ? t('billing.status.sent') :
                                                            invoice.status === 2 ? t('billing.status.partiallypaid') :
                                                                invoice.status === 3 ? t('billing.status.paid') :
                                                                    invoice.status === 4 ? t('billing.status.overdue') :
                                                                        t('billing.status.cancelled')}
                                                    color={invoice.status === 3 ? 'success' :
                                                        invoice.status === 4 ? 'error' :
                                                            invoice.status === 2 ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('billing.viewInvoice')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                                    >
                                                        <MoneyIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ textAlign: 'center', p: 3, mb: 4 }}>
                            <MoneyIcon color="disabled" sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                            <Typography color="textSecondary">{t('billing.noInvoices')}</Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 4 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">{t('billing.timeEntries.title')}</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/time-entries/new?caseId=${id}`)}
                            disabled={!isOnline}
                        >
                            {t('billing.addTimeEntry')}
                        </Button>
                    </Box>

                    {caseData?.timeEntries && caseData.timeEntries.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="time entries table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('billing.date')}</TableCell>
                                        <TableCell>{t('common.description')}</TableCell>
                                        <TableCell>{t('common.minutes')}</TableCell>
                                        <TableCell>{t('billing.billable')}</TableCell>
                                        <TableCell>{t('cases.lawyer')}</TableCell>
                                        <TableCell align="right">{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.timeEntries.map(entry => (
                                        <TableRow key={entry.timeEntryId} hover>
                                            <TableCell>{formatDate(entry.activityDate)}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>{entry.durationMinutes}</TableCell>
                                            <TableCell>
                                                {entry.isBillable ?
                                                    <Chip label={t('billing.billableYes')} color="success" size="small" /> :
                                                    <Chip label={t('billing.billableNo')} color="default" size="small" />
                                                }
                                            </TableCell>
                                            <TableCell>{entry.lawyer}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('common.edit')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/time-entries/${entry.timeEntryId}/edit`)}
                                                        disabled={!isOnline}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                            <ScheduleIcon color="disabled" sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                            <Typography color="textSecondary">{t('billing.noTimeEntries')}</Typography>
                        </Box>
                    )}
                </TabPanel>

                {/* Notes Tab */}
                <TabPanel value={tabValue} index={4}>
                    <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>{t('cases.notes')}</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {caseData?.notes || t('cases.noNotes')}
                        </Typography>

                        {!caseData?.notes && isOnline && (
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                sx={{ mt: 2 }}
                                onClick={() => navigate(`/cases/${id}/edit?tab=notes`)}
                            >
                                {t('cases.addNotes')}
                            </Button>
                        )}
                    </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={5}> {/* Assuming it's the 6th tab (index 5) */}
                    <PortalDataSection caseId={id} caseNumber={caseData?.courtCaseNumber} juridiction={caseData?.juridiction?.portal_Identifier} />
                </TabPanel>
            </Paper>

            {/* Status Change Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
                <DialogTitle>{t('cases.changeStatus')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 400, mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>{t('cases.newStatus')}</InputLabel>
                            <Select
                                value={newStatus}
                                label={t('cases.newStatus')}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                {CASE_STATUSES.map(status => (
                                    <MenuItem key={status.value} value={status.value}>
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label={t('common.notes')}
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            placeholder={t('cases.statusNotesPlaceholder')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleStatusChange}
                        disabled={!newStatus || statusDialogLoading}
                        startIcon={statusDialogLoading ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                        {statusDialogLoading ? t('common.updating') : t('common.update')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Event Dialog */}
            <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)}>
                <DialogTitle>{t('cases.events.addEvent')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 400, mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('cases.events.title')}
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                            error={!eventTitle && submitAttempted}
                            helperText={!eventTitle && submitAttempted ? t('cases.events.titleRequired') : ''}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label={t('common.description')}
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            placeholder={t('cases.events.descriptionPlaceholder')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEventDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddEvent}
                        disabled={!eventTitle || eventDialogLoading}
                        startIcon={eventDialogLoading ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {eventDialogLoading ? t('common.adding') : t('common.add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('cases.deleteCase')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {t('cases.deleteConfirmation', {
                            caseNumber: caseData?.caseNumber,
                            title: caseData?.title
                        })}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        {t('common.actionCannotBeUndone')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteCase}
                        color="error"
                        variant="contained"
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CaseDetailsPage;