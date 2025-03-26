// src/pages/firms/FirmsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Business as BusinessIcon,
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import firmsService from '../../services/firmsService';

const FirmsListPage = () => {
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const isOnline = useOnlineStatus();

    // State variables
    const [firms, setFirms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [selectedFirmId, setSelectedFirmId] = useState(null);

    // Check if user is admin
    const isAdmin = hasRole('Admin');

    // Fetch firms
    useEffect(() => {
        const fetchFirms = async () => {
            setLoading(true);
            setError(null);
            try {
                const firmsData = await firmsService.getLawFirms();
                setFirms(firmsData);
            } catch (error) {
                console.error('Error fetching firms:', error);
                setError(error.message || 'Failed to fetch firms');
            } finally {
                setLoading(false);
            }
        };

        if (isOnline) {
            fetchFirms();
        } else {
            setError('You are offline. Connect to the internet to view law firms.');
            setLoading(false);
        }
    }, [isOnline]);

    // Handle search term change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0); // Reset to first page on search
    };

    // Handle pagination changes
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Navigate to firm details
    const handleFirmClick = (firmId) => {
        navigate(`/firms/${firmId}`);
    };

    // Navigate to create new firm
    const handleAddFirm = () => {
        navigate('/firms/new');
    };

    // Handle opening the action menu
    const handleActionMenuOpen = (event, firmId) => {
        event.stopPropagation();
        setActionMenuAnchor(event.currentTarget);
        setSelectedFirmId(firmId);
    };

    // Handle closing the action menu
    const handleActionMenuClose = () => {
        setActionMenuAnchor(null);
        setSelectedFirmId(null);
    };

    // Handle delete firm
    const handleDeleteFirm = async (firmId) => {
        if (window.confirm('Are you sure you want to delete this firm? This action cannot be undone.')) {
            try {
                await firmsService.deleteLawFirm(firmId);
                // Remove from state
                setFirms(firms.filter(firm => firm.lawFirmId !== firmId));
            } catch (error) {
                console.error('Error deleting firm:', error);
                setError(error.message || 'Failed to delete firm');
            }
        }
        handleActionMenuClose();
    };

    // Handle edit firm
    const handleEditFirm = (firmId) => {
        navigate(`/firms/${firmId}/edit`);
        handleActionMenuClose();
    };

    // Filter firms based on search term
    const filteredFirms = firms.filter(firm =>
        firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firm.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firm.phoneNumber?.includes(searchTerm)
    );

    // Displayed firms with pagination
    const displayedFirms = filteredFirms
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <>
            <PageHeader
                title="Law Firms"
                subtitle={`${firms.length} total law firms`}
                action={isAdmin}
                actionText="Add New Firm"
                actionIcon={<AddIcon />}
                onActionClick={handleAddFirm}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Law Firms' }
                ]}
            />

            <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search firms..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ maxWidth: 500 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {isAdmin && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddFirm}
                        >
                            Add New Firm
                        </Button>
                    )}
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : firms.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No law firms found. {searchTerm && 'Try adjusting your search.'}
                        </Typography>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                sx={{ mt: 2 }}
                                onClick={handleAddFirm}
                            >
                                Add Your First Law Firm
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Firm Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell>Subscription Plan</TableCell>
                                        <TableCell>Expiry Date</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayedFirms.map((firm) => (
                                        <TableRow
                                            key={firm.lawFirmId}
                                            hover
                                            onClick={() => handleFirmClick(firm.lawFirmId)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {firm.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{firm.email}</TableCell>
                                            <TableCell>{firm.phoneNumber}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={firm.subscriptionPlan || "Standard"}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {firm.subscriptionExpiryDate
                                                    ? new Date(firm.subscriptionExpiryDate).toLocaleDateString()
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFirmClick(firm.lawFirmId);
                                                            }}
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {isAdmin && (
                                                        <>
                                                            <Tooltip title="Edit Firm">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditFirm(firm.lawFirmId);
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="Delete Firm">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteFirm(firm.lawFirmId);
                                                                    }}
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredFirms.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Card>
        </>
    );
};

export default FirmsListPage;