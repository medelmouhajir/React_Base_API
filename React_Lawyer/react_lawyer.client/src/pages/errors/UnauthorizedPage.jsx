// src/pages/UnauthorizedPage.jsx
import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9'
                }}
            >
                <LockIcon color="error" sx={{ fontSize: 60, mb: 2 }} />

                <Typography variant="h4" component="h1" gutterBottom color="error">
                    Access Denied
                </Typography>

                <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                    You don't have permission to access this page. Please contact your administrator
                    if you believe you should have access.
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/')}
                    >
                        Go to Dashboard
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default UnauthorizedPage;