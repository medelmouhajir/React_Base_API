// src/pages/errors/NotFoundPage.jsx
import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { SentimentDissatisfied as SadFaceIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    py: 4
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        borderRadius: 2
                    }}
                >
                    <SadFaceIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />

                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                        404
                    </Typography>

                    <Typography variant="h5" component="h2" gutterBottom color="textSecondary">
                        Page Not Found
                    </Typography>

                    <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400 }}>
                        The page you're looking for doesn't exist or has been moved.
                        {!isOnline && " You are currently offline, which might be causing this issue."}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<HomeIcon />}
                            onClick={() => navigate('/')}
                            size="large"
                        >
                            Back to Dashboard
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            size="large"
                        >
                            Go Back
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default NotFoundPage;