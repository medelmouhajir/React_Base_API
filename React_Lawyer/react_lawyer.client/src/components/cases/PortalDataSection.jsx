// src/components/cases/PortalDataSection.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import portalService from '../../services/portalService';

const PortalDataSection = ({ caseNumber, juridiction }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [portalData, setPortalData] = useState(null);
    const [decisions, setDecisions] = useState([]);
    const [parties, setParties] = useState([]);
    const [tabValue, setTabValue] = useState(0);

    const fetchPortalData = async () => {
        if (!caseNumber || !juridiction) {
            setError(t('cases.portal.noCaseNumber'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await portalService.getCaseDetails(caseNumber, juridiction);
            setPortalData(data?.data || null);

            if (data?.data?.idDossierCivil && data?.data?.affaire) {
                // Fetch decisions and parties
                const [decisionsData, partiesData] = await Promise.all([
                    portalService.getCaseDecisions(data.data.idDossierCivil, data.data.affaire),
                    portalService.getCaseParties(data.data.idDossierCivil, data.data.affaire)
                ]);

                setDecisions(decisionsData?.data || []);
                setParties(partiesData?.data || []);
            }
        } catch (err) {
            console.error('Error fetching portal data:', err);
            setError(t('cases.portal.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (caseNumber) {
            fetchPortalData();
        }
    }, [caseNumber]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (!caseNumber) {
        return (
            <Alert severity="info">
                {t('cases.portal.noCaseNumberProvided')}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('cases.portal.moroccanTribunalPortal')}</Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchPortalData}
                    disabled={loading}
                >
                    {loading ? t('common.refreshing') : t('common.refresh')}
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : portalData ? (
                <Box>
                    <Paper sx={{ mb: 3, p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {t('cases.portal.caseInformation')}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            <Typography><strong>{t('cases.portal.courtName')}:</strong> {portalData.libEntite}</Typography>
                            <Typography><strong>{t('cases.portal.judge')}:</strong> {portalData.jugeRapporteur}</Typography>
                            <Typography><strong>{t('cases.portal.registrationDate')}:</strong> {portalData.dateEnregistrementDossierDansRegistre}</Typography>
                            <Typography><strong>{t('cases.portal.requestType')}:</strong> {portalData.typeRequette}</Typography>
                            <Typography><strong>{t('cases.portal.caseNumber')}:</strong> {portalData.numeroCompletDossier1Instance}</Typography>
                            <Typography><strong>{t('cases.portal.jurisdiction')}:</strong> {portalData.juridiction1Instance}</Typography>
                            <Typography><strong>{t('cases.portal.appealNumber')}:</strong> {portalData.numeroCompletDossier2Instance || t('common.notAvailable')}</Typography>
                            <Typography><strong>{t('cases.portal.appealJurisdiction')}:</strong> {portalData.juridiction2Instance || t('common.notAvailable')}</Typography>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Typography><strong>{t('cases.portal.caseSubject')}:</strong> {portalData.objetDossier}</Typography>
                        </Box>

                        {portalData.LibelleDernierJugement && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography><strong>{t('cases.portal.lastJudgment')}:</strong> {portalData.libelleDernierJugement}</Typography>
                                <Typography><strong>{t('cases.portal.judgmentStatus')}:</strong> {portalData.etatDernierJugement}</Typography>
                                <Typography><strong>{t('cases.portal.judgmentDate')}:</strong> {portalData.dateDernierJugement}</Typography>
                            </Box>
                        )}
                    </Paper>

                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label={t('cases.portal.decisions')} />
                        <Tab label={t('cases.portal.parties')} />
                    </Tabs>

                    {/* Decisions Tab */}
                    {tabValue === 0 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('cases.portal.date')}</TableCell>
                                        <TableCell>{t('cases.portal.decisionType')}</TableCell>
                                        <TableCell>{t('cases.portal.content')}</TableCell>
                                        <TableCell>{t('cases.portal.judgmentNumber')}</TableCell>
                                        <TableCell>{t('cases.portal.nextHearing')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {decisions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                {t('cases.portal.noDecisions')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        decisions.map((decision) => (
                                            <TableRow key={decision.idDecision}>
                                                <TableCell>{decision.dateTimeDecision}</TableCell>
                                                <TableCell>{decision.typeDecision}</TableCell>
                                                <TableCell>{decision.contenuDecision}</TableCell>
                                                <TableCell>{decision.numeroJugement || t('common.notAvailable')}</TableCell>
                                                <TableCell>{decision.dateTimeNextAudience || t('common.notAvailable')}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Parties Tab */}
                    {tabValue === 1 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('cases.portal.name')}</TableCell>
                                        <TableCell>{t('cases.portal.role')}</TableCell>
                                        <TableCell>{t('cases.portal.type')}</TableCell>
                                        <TableCell>{t('cases.portal.lawyers')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {parties.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                {t('cases.portal.noParties')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        parties.map((party) => (
                                            <TableRow key={party.IdPartie}>
                                                <TableCell>{party.nomPrenomPartie}</TableCell>
                                                <TableCell>{party.rolePartie}</TableCell>
                                                <TableCell>{party.codeTypePersonne}</TableCell>
                                                <TableCell>{party.countAvocatsPartie}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            ) : (
                <Alert severity="info">
                    {t('cases.portal.noCaseFound')}
                </Alert>
            )}
        </Box>
    );
};

export default PortalDataSection;