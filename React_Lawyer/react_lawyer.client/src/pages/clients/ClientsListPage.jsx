// src/pages/clients/ClientsListPage.jsx
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
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    PersonOutlined as PersonIcon,
    MoreVert as MoreVertIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ClientsListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // State variables
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            if (!isOnline) {
                setLoading(false);
                return;
            }

            try {
                const apiUrl = searchTerm
                    ? `/api/clients/search?term=${encodeURIComponent(searchTerm)}`
                    : user?.lawFirmId
                        ? `/api/clients/byfirm/${user.lawFirmId}`
                        : `/api/clients`;

                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch clients');
                }

                const data = await response.json();
                setClients(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching clients:', err);
                setError('Failed to load clients. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [searchTerm, user, isOnline]);

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

    // Navigate to client details
    const handleClientClick = (clientId) => {
        navigate(`/clients/${clientId}`);
    };

    // Navigate to create new client
    const handleAddClient = () => {
        navigate('/clients/new');
    };

    // Displayed clients with pagination
    const displayedClients = clients
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <>
            <PageHeader
                title="Clients"
                subtitle={`${clients.length} total clients`}
                action
                actionText="Add New Client"
                actionIcon={<AddIcon />}
                onActionClick={handleAddClient}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients' }
                ]}
            />

            <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search clients..."
                        fullWidth
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
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : clients.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No clients found. {searchTerm && 'Try adjusting your search.'}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                            onClick={handleAddClient}
                        >
                            Add Your First Client
                        </Button>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell>Company</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayedClients.map((client) => (
                                        <TableRow
                                            key={client.clientId}
                                            hover
                                            onClick={() => handleClientClick(client.clientId)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="body1">
                                                        {client.firstName} {client.lastName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{client.email}</TableCell>
                                            <TableCell>{client.phoneNumber}</TableCell>
                                            <TableCell>
                                                {client.companyName && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <BusinessIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                        {client.companyName}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={client.isIndividual ? "Individual" : "Business"}
                                                    color={client.isIndividual ? "primary" : "secondary"}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Handle menu options
                                                    }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
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
                            count={clients.length}
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

export default ClientsListPage;