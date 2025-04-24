// src/components/cases/PortalCaseLookup.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Button, TextField, CircularProgress, Alert, Dialog,
    DialogTitle, DialogContent, DialogActions, Typography
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import portalService from '../../services/portalService';

const PortalCaseLookup = ({ onCaseSelected, open, onClose }) => {
    const { t } = useTranslation();
    const [caseNumber, setCaseNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleSearch = async () => {
        if (!caseNumber.trim()) {
            setError(t('cases.portal.enterCaseNumber'));
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await portalService.getCaseDetails(caseNumber);
            setResult(data?.Data || null);

            if (!data?.Data) {
                setError(t('cases.portal.noCaseFound'));
            }
        } catch (err) {
            console.error('Error searching portal:', err);
            setError(t('cases.portal.searchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCase = () => {
        if (result) {
            onCaseSelected(result);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('cases.portal.searchPortal')}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label={t('cases.portal.caseNumber')}
                        value={caseNumber}
                        onChange={(e) => setCaseNumber(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                        onClick={handleSearch}
                        disabled={loading || !caseNumber.trim()}
                    >
                        {loading ? t('common.searching') : t('common.search')}
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {result && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {t('cases.portal.caseFound')}
                        </Typography>
                        <Typography><strong>{t('cases.portal.courtName')}:</strong> {result.LibEntite}</Typography>
                        <Typography><strong>{t('cases.portal.caseNumber')}:</strong> {result.NumeroCompletDossier1Instance}</Typography>
                        <Typography><strong>{t('cases.portal.judge')}:</strong> {result.JugeRapporteur}</Typography>
                        <Typography><strong>{t('cases.portal.caseSubject')}:</strong> {result.ObjetDossier}</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSelectCase}
                    disabled={!result}
                >
                    {t('cases.portal.selectCase')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PortalCaseLookup;