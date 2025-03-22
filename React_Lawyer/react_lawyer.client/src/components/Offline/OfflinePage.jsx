import React from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Button
} from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';

const OfflinePage = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <WifiOffIcon sx={{ fontSize: 64, color: '#1a237e', mb: 2 }} />

                <Typography variant="h4" component="h1" gutterBottom>
                    You're Offline
                </Typography>

                <Typography variant="body1" paragraph>
                    It looks like you've lost your internet connection.
                    Some features might be unavailable until you're back online.
                </Typography>

                <Typography variant="body1" paragraph>
                    Don't worry though, you can still access cached content
                    and any data you've already loaded.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Try Again
                </Button>
            </Paper>
        </Container>
    );
};

export default OfflinePage;