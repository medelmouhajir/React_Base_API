import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Box, Typography, Button, Tabs, Tab,
    Chip, Grid, Card, CardContent, Divider, IconButton,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Avatar, CircularProgress, Snackbar, Alert, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Select, FormControl, InputLabel, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow
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
    FileCopy as DocumentIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';

// Case status color mapping
const STATUS_COLORS = {
    Intake: 'info',
    Active: 'success',
    Pending: 'warning',
    Closed: 'default',
    Archived: 'default'
};

// Case statuses
const CASE_STATUSES = [
    { value: 'Intake', label: 'Intake' },
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Archived', label: 'Archived' }
];

// Tab panel component
function TabPanel(props) {
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
}

const CaseDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    // Fetch case data
    useEffect(() => {
        const fetchCaseData = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(`/api/Cases/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch case details');
                }

                const data = await response.json();
                setCaseData(data);
                setNewStatus(data.status); // Initialize status dialog with current status
            } catch (err) {
                console.error('Error fetching case details:', err);
                setError('Failed to load case details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCaseData();
        }
    }, [id]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Open status change dialog
    const handleOpenStatusDialog = () => {
        setStatusDialogOpen(true);
    };

    // Handle status change
    const handleStatusChange = async () => {
        setStatusDialogLoading(true);

        try {
            const response = await fetch(`/api/Cases/${id}/Status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newStatus,
                    userId: user?.id,
                    notes: statusNotes
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update case status');
            }

            // Update local case data
            setCaseData(prev => ({
                ...prev,
                status: newStatus
            }));

            setStatusDialogOpen(false);
            setStatusNotes('');
        } catch (err) {
            setError('Error updating case status');
        } finally {
            setStatusDialogLoading(false);
        }
    };

    // Open add event dialog
    const handleOpenEventDialog = () => {
        setEventDialogOpen(true);
    };

    // Handle add event
    const handleAddEvent = async () => {
        if (!eventTitle) {
            setError('Event title is required');
            return;
        }

        setEventDialogLoading(true);

        try {
            const response = await fetch(`/api/Cases/${id}/Events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    caseId: Number(id),
                    createdById: user?.id,
                    title: eventTitle,
                    description: eventDescription,
                    date: new Date().toISOString(),
                    eventType: 'Note',
                    createdAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add case event');
            }

            // Refetch case data to get the new event
            const caseResponse = await fetch(`/api/Cases/${id}`);
            if (caseResponse.ok) {
                setCaseData(await caseResponse.json());
            }

            setEventDialogOpen(false);
            setEventTitle('');
            setEventDescription('');
        } catch (err) {
            setError('Error adding case event');
        } finally {
            setEventDialogLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!caseData) {
        return (
            <Container>
                <Paper sx={{ p: 4, my: 4, textAlign: 'center' }}>
                    <Typography variant="h5" color="error">Case not found</Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/cases')}
                    >
                        Back to Cases
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={caseData.title}
                subtitle={`Case #${caseData.caseNumber}`}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Cases', link: '/cases' },
                    { text: caseData.caseNumber || caseData.caseId }
                ]}
                action="Edit Case"
                actionIcon={<EditIcon />}
                onActionClick={() => navigate(`/cases/${id}/edit`)}
            />

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
                    <Box>
                        <Chip
                            label={caseData.status}
                            color={STATUS_COLORS[caseData.status] || 'default'}
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        {caseData.isUrgent && (
                            <Chip label="URGENT" color="error" size="small" />
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={handleOpenStatusDialog}
                    >
                        Change Status
                    </Button>
                </Box>

                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Type
                            </Typography>
                            <Typography variant="body1">
                                {caseData.type || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Open Date
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(caseData.openDate)}
                            </Typography>
                        </Box>

                        {caseData.closeDate && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Close Date
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(caseData.closeDate)}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Assigned Lawyer
                            </Typography>
                            <Typography variant="body1">
                                {caseData.assignedLawyer ?
                                    `${caseData.assignedLawyer.user.firstName} ${caseData.assignedLawyer.user.lastName}` :
                                    'Unassigned'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Court
                            </Typography>
                            <Typography variant="body1">
                                {caseData.courtName || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Court Case Number
                            </Typography>
                            <Typography variant="body1">
                                {caseData.courtCaseNumber || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Next Hearing
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(caseData.nextHearingDate)}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Opposing Party
                            </Typography>
                            <Typography variant="body1">
                                {caseData.opposingParty || 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Description
                        </Typography>
                        <Typography variant="body1">
                            {caseData.description || 'No description provided.'}
                        </Typography>
                    </Grid>
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
                    <Tab label="Clients" icon={<PersonIcon />} iconPosition="start" />
                    <Tab label="Events" icon={<EventIcon />} iconPosition="start" />
                    <Tab label="Documents" icon={<DocumentIcon />} iconPosition="start" />
                    <Tab label="Billing" icon={<MoneyIcon />} iconPosition="start" />
                    <Tab label="Notes" icon={<NotesIcon />} iconPosition="start" />
                </Tabs>

                {/* Clients Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/cases/${id}/clients/add`)}
                        >
                            Add Client
                        </Button>
                    </Box>

                    {caseData.case_Clients && caseData.case_Clients.length > 0 ? (
                        <Grid container spacing={2}>
                            {caseData.case_Clients.map(clientRelation => (
                                <Grid item xs={12} md={6} key={clientRelation.client.clientId}>
                                    <Card sx={{ height: '100%' }}>
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
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/clients/${clientRelation.client.clientId}`)}
                                                >
                                                    <PersonIcon />
                                                </IconButton>
                                            </Box>

                                            <Divider sx={{ my: 1 }} />

                                            <Typography variant="body2">
                                                <strong>Email:</strong> {clientRelation.client.email}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Phone:</strong> {clientRelation.client.phoneNumber}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body1" color="textSecondary" align="center">
                            No clients associated with this case.
                        </Typography>
                    )}
                </TabPanel>

                {/* Events Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenEventDialog}
                        >
                            Add Event
                        </Button>
                    </Box>

                    {caseData.events && caseData.events.length > 0 ? (
                        <List>
                            {caseData.events.sort((a, b) => new Date(b.date) - new Date(a.date)).map(event => (
                                <ListItem
                                    key={event.caseEventId}
                                    alignItems="flex-start"
                                    sx={{
                                        mb: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1
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
                                            <Typography variant="subtitle1">
                                                {event.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(event.date).toLocaleString()}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {event.description}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Typography variant="caption" color="textSecondary">
                                            {event.createdBy ?
                                                `${event.createdBy.firstName} ${event.createdBy.lastName}` :
                                                'System'}
                                        </Typography>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="textSecondary" align="center">
                            No events recorded for this case.
                        </Typography>
                    )}
                </TabPanel>

                {/* Documents Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/documents/upload?caseId=${id}`)}
                        >
                            Upload Document
                        </Button>
                    </Box>

                    {caseData.documents && caseData.documents.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="documents table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Uploaded By</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.documents.map(doc => (
                                        <TableRow key={doc.documentId}>
                                            <TableCell>{doc.title}</TableCell>
                                            <TableCell>{doc.documentType}</TableCell>
                                            <TableCell>{doc.uploadedBy}</TableCell>
                                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => window.open(`/api/Documents/${doc.documentId}/download`)}
                                                >
                                                    <PdfIcon />
                                                </IconButton>
                                                <IconButton size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body1" color="textSecondary" align="center">
                            No documents uploaded for this case.
                        </Typography>
                    )}
                </TabPanel>

                {/* Billing Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Invoices</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/billing/invoices/new?caseId=${id}`)}
                        >
                            Create Invoice
                        </Button>
                    </Box>

                    {caseData.invoices && caseData.invoices.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="invoices table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice #</TableCell>
                                        <TableCell>Issue Date</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.invoices.map(invoice => (
                                        <TableRow key={invoice.invoiceId}>
                                            <TableCell>{invoice.invoiceNumber}</TableCell>
                                            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.status}
                                                    color={invoice.status === 'Paid' ? 'success' :
                                                        invoice.status === 'Overdue' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/billing/invoices/${invoice.invoiceId}`)}
                                                >
                                                    <MoneyIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body1" color="textSecondary" align="center">
                            No invoices created for this case.
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2 }}>
                        <Typography variant="h6">Time Entries</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/time-entries/new?caseId=${id}`)}
                        >
                            Add Time Entry
                        </Button>
                    </Box>

                    {caseData.timeEntries && caseData.timeEntries.length > 0 ? (
                        <TableContainer>
                            <Table aria-label="time entries table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Hours</TableCell>
                                        <TableCell>Billable</TableCell>
                                        <TableCell>Lawyer</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {caseData.timeEntries.map(entry => (
                                        <TableRow key={entry.timeEntryId}>
                                            <TableCell>{formatDate(entry.date)}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>{entry.hours}</TableCell>
                                            <TableCell>
                                                {entry.isBillable ?
                                                    <Chip label="Billable" color="success" size="small" /> :
                                                    <Chip label="Non-billable" color="default" size="small" />
                                                }
                                            </TableCell>
                                            <TableCell>{entry.lawyer}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/time-entries/${entry.timeEntryId}/edit`)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body1" color="textSecondary" align="center">
                            No time entries recorded for this case.
                        </Typography>
                    )}
                </TabPanel>

                {/* Notes Tab */}
                <TabPanel value={tabValue} index={4}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>Case Notes</Typography>
                        <Typography variant="body1">
                            {caseData.notes || 'No notes have been added to this case.'}
                        </Typography>
                    </Box>
                </TabPanel>
            </Paper>

            {/* Status Change Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
                <DialogTitle>Change Case Status</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 400, mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="status-change-label">New Status</InputLabel>
                            <Select
                                labelId="status-change-label"
                                id="new-status"
                                value={newStatus}
                                label="New Status"
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
                            label="Notes"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            placeholder="Add notes about this status change"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleStatusChange}
                        disabled={!newStatus || statusDialogLoading}
                    >
                        {statusDialogLoading ? <CircularProgress size={24} /> : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Event Dialog */}
            <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)}>
                <DialogTitle>Add Case Event</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 400, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Event Title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            placeholder="Describe the event"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddEvent}
                        disabled={!eventTitle || eventDialogLoading}
                    >
                        {eventDialogLoading ? <CircularProgress size={24} /> : 'Add Event'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error message */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
};

export default CaseDetailsPage;