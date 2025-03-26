// src/pages/clients/ClientsListPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Chip,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    PersonAdd as PersonAddIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Business as BusinessIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import clientService from '../../services/clientService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ClientsListPage = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const { user } = useAuth();

    // State
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const data = await clientService.getClients();
                setClients(data);
                setFilteredClients(data);
            } catch (err) {
                console.error('Error fetching clients:', err);
                setError('Failed to load clients. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // Handle search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredClients(clients);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = clients.filter(client =>
            client.firstName?.toLowerCase().includes(term) ||
            client.lastName?.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term) ||
            client.phoneNumber?.includes(term) ||
            client.companyName?.toLowerCase().includes(term)
        );

        setFilteredClients(filtered);
    }, [searchTerm, clients]);

    // Navigate to client details
    const handleClientClick = (clientId) => {
        navigate(`/clients/${clientId}`);
    };

    // Navigate to new client page
    const handleAddClient = () => {
        navigate('/clients/new');
    };

    // Get client type chip color
    const getClientTypeColor = (type) => {
        switch (type) {
            case 'Individual':
                return 'primary';
            case 'Corporate':
                return 'secondary';
            default:
                return 'default';
        }
    };

    // Render client type icon
    const getClientTypeIcon = (type) => {
        return type === 'Corporate' ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />;
    };

    return (
        <>
            <PageHeader
                title="Clients"
                subtitle="Manage your clients and their information"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients' }
                ]}
                action={true}
                actionText="Add Client"
                actionIcon={<PersonAddIcon />}
                onActionClick={handleAddClient}
            />

            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <TextField
                        placeholder="Search clients..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ maxWidth: 500 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                ) : filteredClients.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                            {searchTerm ? 'No clients match your search criteria.' : 'No clients found.'}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            sx={{ mt: 2 }}
                            onClick={handleAddClient}
                        >
                            Add Your First Client
                        </Button>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Contact Info</TableCell>
                                    <TableCell>Company</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow
                                        key={client.clientId}
                                        hover
                                        onClick={() => handleClientClick(client.clientId)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {client.firstName} {client.lastName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getClientTypeIcon(client.type)}
                                                label={client.type}
                                                color={getClientTypeColor(client.type)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {client.email && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EmailIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">{client.email}</Typography>
                                                    </Box>
                                                )}
                                                {client.phoneNumber && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PhoneIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">{client.phoneNumber}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {client.companyName ? (
                                                <Typography variant="body2">{client.companyName}</Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    –
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {!isOnline && (
                <Snackbar
                    open={!isOnline}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity="warning">
                        You're offline. Some features may be limited.
                    </Alert>
                </Snackbar>
            )}
        </>
    );
};

export default ClientsListPage;