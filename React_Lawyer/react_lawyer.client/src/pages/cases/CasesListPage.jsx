import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, Box, Typography, Button, TextField,
    IconButton, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Chip, InputAdornment,
    MenuItem, FormControl, InputLabel, Select, Grid, Tooltip,
    CircularProgress, Snackbar, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon
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

// Case types
const CASE_TYPES = [
    { value: 'All', label: 'All Types' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Criminal', label: 'Criminal' },
    { value: 'Family', label: 'Family' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'RealEstate', label: 'Real Estate' },
    { value: 'Other', label: 'Other' }
];

// Case statuses
const CASE_STATUSES = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Intake', label: 'Intake' },
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Archived', label: 'Archived' }
];

const CasesListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCases, setTotalCases] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [caseType, setCaseType] = useState('All');
    const [caseStatus, setCaseStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch cases
    useEffect(() => {
        const fetchCases = async () => {
            if (!user?.lawFirmId) return;

            setLoading(true);
            setError('');

            try {
                let url = `/api/Cases/ByFirm/${user.lawFirmId}`;

                // Add search parameter if provided
                if (searchTerm) {
                    url = `/api/Cases/Search?term=${encodeURIComponent(searchTerm)}`;
                }

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Failed to fetch cases');
                }

                let data = await response.json();

                // Apply client-side filters (ideally this would be done server-side)
                if (caseType !== 'All') {
                    data = data.filter(c => c.type === caseType);
                }

                if (caseStatus !== 'All') {
                    data = data.filter(c => c.status === caseStatus);
                }

                // Sort by case creation date (newest first)
                data.sort((a, b) => new Date(b.openDate) - new Date(a.openDate));

                setTotalCases(data.length);
                setCases(data);
            } catch (err) {
                console.error('Error fetching cases:', err);
                setError('Failed to load cases');
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, [user?.lawFirmId, searchTerm, caseType, caseStatus, refreshTrigger]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle case deletion
    const handleDeleteCase = async (caseId) => {
        if (!window.confirm('Are you sure you want to delete this case?')) {
            return;
        }

        try {
            const response = await fetch(`/api/Cases/${caseId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete case');
            }

            // Refresh cases list
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            setError('Error deleting case');
        }
    };

    // Calculate paged data
    const pagedCases = cases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Cases"
                subtitle={`Showing ${totalCases} cases`}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Cases' }
                ]}
                action="New Case"
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/cases/new')}
            />

            {/* Search and filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search cases..."
                            variant="outlined"
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
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="type-filter-label">Type</InputLabel>
                            <Select
                                labelId="type-filter-label"
                                id="type-filter"
                                value={caseType}
                                onChange={(e) => setCaseType(e.target.value)}
                                label="Type"
                            >
                                {CASE_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="status-filter-label">Status</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                id="status-filter"
                                value={caseStatus}
                                onChange={(e) => setCaseStatus(e.target.value)}
                                label="Status"
                            >
                                {CASE_STATUSES.map(status => (
                                    <MenuItem key={status.value} value={status.value}>
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                        <Grid item>
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cases table */}
            <Paper>
                <TableContainer>
                    <Table aria-label="cases table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Case Number</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Open Date</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={200}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedCases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={100}>
                                        <Typography variant="body1" color="textSecondary">
                                            No cases found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedCases.map((caseItem) => (
                                    <TableRow key={caseItem.caseId} hover>
                                        <TableCell>{caseItem.caseNumber}</TableCell>
                                        <TableCell>
                                            <Typography fontWeight={caseItem.isUrgent ? 'bold' : 'normal'}>
                                                {caseItem.isUrgent && '🔴 '}
                                                {caseItem.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{caseItem.type}</TableCell>
                                        <TableCell>
                                            <Chip
                                                color={STATUS_COLORS[caseItem.status] || 'default'}
                                                size="small"
                                                label={caseItem.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(caseItem.openDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {caseItem.assignedLawyer ?
                                                `${caseItem.assignedLawyer.user.firstName} ${caseItem.assignedLawyer.user.lastName}` :
                                                'Unassigned'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}/edit`)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteCase(caseItem.caseId)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCases}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

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

export default CasesListPage;