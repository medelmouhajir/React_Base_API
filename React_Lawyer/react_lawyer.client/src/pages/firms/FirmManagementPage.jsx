// src/pages/firms/FirmsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Chip,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/common/PageHeader';
import firmsService from '../../services/firmsService';

const FirmManagementPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State for firms data
    const [firms, setFirms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // State for delete confirmation dialog
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [firmToDelete, setFirmToDelete] = useState(null);

    // State for notifications
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchFirms();
    }, []);

    // Fetch firms data
    const fetchFirms = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await firmsService.getLawFirms();
            setFirms(data);
        } catch (err) {
            setError('Failed to load law firms. Please try again later.');
            console.error('Error fetching firms:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle pagination change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle firm deletion
    const handleDeleteClick = (firm) => {
        setFirmToDelete(firm);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!firmToDelete) return;

        try {
            await firmsService.deleteLawFirm(firmToDelete.lawFirmId);
            setFirms(firms.filter(f => f.lawFirmId !== firmToDelete.lawFirmId));
            setNotification({
                open: true,
                message: 'Law firm deleted successfully',
                severity: 'success'
            });
        } catch (err) {
            setNotification({
                open: true,
                message: 'Failed to delete law firm',
                severity: 'error'
            });
            console.error('Error deleting firm:', err);
        } finally {
            setOpenDeleteDialog(false);
            setFirmToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setOpenDeleteDialog(false);
        setFirmToDelete(null);
    };

    // Navigate to firm details
    const handleViewFirm = (firmId) => {
        navigate(`/firm/users?id=${firmId}`);
    };

    // Navigate to edit firm
    const handleEditFirm = (firmId) => {
        navigate(`/firm/edit/${firmId}`);
    };

    // Navigate to add new firm
    const handleAddFirm = () => {
        navigate('/register-firm');
    };

    // Close notification
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Render loading state
    if (loading && firms.length === 0) {
        return (
            <Container maxWidth="lg">
                <PageHeader
                    title="Law Firm Management"
                    subtitle="Manage your law firms and their settings"
                    breadcrumbs={[
                        { text: 'Dashboard', link: '/' },
                        { text: 'Firm Management' }
                    ]}
                    action="Add Firm"
                    actionIcon={<AddIcon />}
                    onActionClick={handleAddFirm}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Law Firm Management"
                subtitle="Manage your law firms and their settings"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Firm Management' }
                ]}
                action="Add Firm"
                actionIcon={<AddIcon />}
                onActionClick={handleAddFirm}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {firms.length === 0 && !loading ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        No Law Firms Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        There are no law firms registered in the system yet.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddFirm}
                    >
                        Register a New Firm
                    </Button>
                </Paper>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 440 }}>
                        <Table stickyHeader aria-label="law firms table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Firm Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Subscription</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {firms
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((firm) => (
                                        <TableRow hover key={firm.lawFirmId}>
                                            <TableCell component="th" scope="row">
                                                {firm.name}
                                            </TableCell>
                                            <TableCell>{firm.email}</TableCell>
                                            <TableCell>{firm.phoneNumber || 'N/A'}</TableCell>
                                            <TableCell>{firm.subscriptionPlan}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={firm.isActive ? 'Active' : 'Inactive'}
                                                    color={firm.isActive ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleViewFirm(firm.lawFirmId)}
                                                    title="View details"
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() => handleEditFirm(firm.lawFirmId)}
                                                    title="Edit firm"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteClick(firm)}
                                                    title="Delete firm"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={firms.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete the law firm "{firmToDelete?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default FirmManagementPage;