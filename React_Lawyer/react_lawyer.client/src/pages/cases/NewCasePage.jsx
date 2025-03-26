import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, TextField, Button, MenuItem, FormControl,
    InputLabel, Select, Typography, Paper, Grid, Checkbox,
    FormControlLabel, CircularProgress, Snackbar, Alert,
    Divider, Chip
} from '@mui/material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';

// Case types
const CASE_TYPES = [
    { value: 'Civil', label: 'Civil' },
    { value: 'Criminal', label: 'Criminal' },
    { value: 'Family', label: 'Family' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'RealEstate', label: 'Real Estate' },
    { value: 'Other', label: 'Other' }
];

const NewCasePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        caseNumber: '',
        lawFirmId: user?.lawFirmId || 0,
        lawyerId: user?.role === 'Lawyer' ? user.id : null,
        title: '',
        description: '',
        type: '',
        courtName: '',
        courtCaseNumber: '',
        opposingParty: '',
        opposingCounsel: '',
        nextHearingDate: null,
        notes: '',
        isUrgent: false,
        clientIds: [],
        createdById: user?.id || 0
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [clients, setClients] = useState([]);
    const [lawyers, setLawyers] = useState([]);

    // Load clients and lawyers
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.lawFirmId) return;

            try {
                // Fetch clients
                const clientsResponse = await fetch(`/api/Clients/ByFirm/${user.lawFirmId}`);
                if (clientsResponse.ok) {
                    setClients(await clientsResponse.json());
                }

                // Fetch lawyers
                const lawyersResponse = await fetch(`/api/LawFirms/${user.lawFirmId}/Lawyers`);
                if (lawyersResponse.ok) {
                    setLawyers(await lawyersResponse.json());
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load required data');
            }
        };

        fetchData();
    }, [user?.lawFirmId]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle client selection
    const handleClientSelection = (e) => {
        setFormData(prev => ({ ...prev, clientIds: e.target.value }));
    };

    // Handle date change
    const handleDateChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setFormData(prev => ({ ...prev, nextHearingDate: date }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.type || formData.clientIds.length === 0) {
            setError('Please fill all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/Cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create case');
            }

            const data = await response.json();
            setSuccess(true);

            // Navigate to the new case after success
            setTimeout(() => {
                navigate(`/cases/${data.caseId}`);
            }, 1500);
        } catch (err) {
            setError(err.message || 'An error occurred while creating the case');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Create New Case"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Cases', link: '/cases' },
                    { text: 'New Case' }
                ]}
            />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Basic Information
                            </Typography>
                            <Divider />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                id="title"
                                name="title"
                                label="Case Title"
                                value={formData.title}
                                onChange={handleChange}
                                autoFocus
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="type-label">Case Type</InputLabel>
                                <Select
                                    labelId="type-label"
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    label="Case Type"
                                    onChange={handleChange}
                                >
                                    {CASE_TYPES.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="caseNumber"
                                name="caseNumber"
                                label="Case Number"
                                value={formData.caseNumber}
                                onChange={handleChange}
                                helperText="Optional - will be auto-generated if left blank"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="lawyer-label">Assigned Lawyer</InputLabel>
                                <Select
                                    labelId="lawyer-label"
                                    id="lawyerId"
                                    name="lawyerId"
                                    value={formData.lawyerId || ''}
                                    label="Assigned Lawyer"
                                    onChange={handleChange}
                                >
                                    {lawyers.map(lawyer => (
                                        <MenuItem key={lawyer.lawyerId} value={lawyer.lawyerId}>
                                            {lawyer.user ? `${lawyer.user.firstName} ${lawyer.user.lastName}` : lawyer.lawyerId}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                id="description"
                                name="description"
                                label="Case Description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isUrgent}
                                        onChange={handleChange}
                                        name="isUrgent"
                                        color="secondary"
                                    />
                                }
                                label="Mark as Urgent"
                            />
                        </Grid>

                        {/* Client Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                                Client Information
                            </Typography>
                            <Divider />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel id="clients-label">Associated Clients</InputLabel>
                                <Select
                                    labelId="clients-label"
                                    id="clientIds"
                                    name="clientIds"
                                    multiple
                                    value={formData.clientIds}
                                    onChange={handleClientSelection}
                                    label="Associated Clients"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((clientId) => {
                                                const client = clients.find(c => c.clientId === clientId);
                                                return (
                                                    <Chip
                                                        key={clientId}
                                                        label={client ? `${client.firstName} ${client.lastName}` : clientId}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {clients.map(client => (
                                        <MenuItem key={client.clientId} value={client.clientId}>
                                            {`${client.firstName} ${client.lastName} ${client.companyName ? `(${client.companyName})` : ''}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Court Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                                Court Information
                            </Typography>
                            <Divider />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="courtName"
                                name="courtName"
                                label="Court Name"
                                value={formData.courtName}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="courtCaseNumber"
                                name="courtCaseNumber"
                                label="Court Case Number"
                                value={formData.courtCaseNumber}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="nextHearingDate"
                                name="nextHearingDate"
                                label="Next Hearing Date"
                                type="date"
                                value={formData.nextHearingDate ? formData.nextHearingDate.toISOString().split('T')[0] : ''}
                                onChange={handleDateChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Opposing Party */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="opposingParty"
                                name="opposingParty"
                                label="Opposing Party"
                                value={formData.opposingParty}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="opposingCounsel"
                                name="opposingCounsel"
                                label="Opposing Counsel"
                                value={formData.opposingCounsel}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                id="notes"
                                name="notes"
                                label="Additional Notes"
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Form Actions */}
                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/cases')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : null}
                            >
                                {loading ? 'Creating...' : 'Create Case'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Success & Error messages */}
            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success">Case created successfully!</Alert>
            </Snackbar>

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

export default NewCasePage;