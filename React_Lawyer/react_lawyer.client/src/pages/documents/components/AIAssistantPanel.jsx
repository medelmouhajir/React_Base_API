// src/pages/documents/components/AIAssistantPanel.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Divider,
    Button,
    IconButton,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    CardActionArea,
    Chip,
    Alert,
    Tooltip,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid
} from '@mui/material';
import {
    Close as CloseIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Search as SearchIcon,
    Lightbulb as LightbulbIcon,
    FormatQuote as QuoteIcon,
    Translate as TranslateIcon,
    Spellcheck as SpellcheckIcon,
    FormatClear as ClearIcon,
    Psychology as AIIcon,
    Article as SummaryIcon,
    Person as ClientIcon,
    Gavel as CaseIcon,
    Save as SaveIcon,
    Home as HomeIcon
} from '@mui/icons-material';

// Import services
import aiService from '../../../services/aiService';
import clientService from '../../../services/clientService';
import caseService from '../../../services/caseService';

const AIAssistantPanel = ({ documentContent, onApplySuggestion, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [prompt, setPrompt] = useState('');
    const [completion, setCompletion] = useState('');
    const [completionLoading, setCompletionLoading] = useState(false);

    // Spelling and Grammar state
    const [spellingLoading, setSpellingLoading] = useState(false);
    const [spellingResults, setSpellingResults] = useState([]);

    // Translation state
    const [translateLoading, setTranslateLoading] = useState(false);
    const [translatedContent, setTranslatedContent] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('fr');
    const [translationDialog, setTranslationDialog] = useState(false);

    // Summarization state
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState('');

    // Client/Case information state
    const [clientInfoLoading, setClientInfoLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [clientInfoSuggestions, setClientInfoSuggestions] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [casesLoading, setCasesLoading] = useState(false);

    // This is a new helper function to render the welcome tab content
    const renderWelcomeTab = () => (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {t('ai.welcomeTitle')}
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
                {t('ai.welcomeDescription')}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                {tabs.filter(tab => tab.id !== 'welcome').map((tab) => (
                    <Grid item xs={6} sm={4} key={tab.id}>
                        <Card
                            elevation={2}
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => setActiveTab(tabs.findIndex(t => t.id === tab.id))}
                                sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <Box sx={{
                                    fontSize: '2rem',
                                    color: 'primary.main',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    mb: 1
                                }}>
                                    {tab.icon}
                                </Box>
                                <Typography variant="subtitle1" align="center">
                                    {tab.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                                    {t(`ai.tabDescriptions.${tab.id}`)}
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    // Tab definitions
    const tabs = [
        {
            id: 'welcome',
            label: t('ai.tabs.welcome'),
            icon: <HomeIcon fontSize="small" />
        },
        {
            id: 'suggestions',
            label: t('ai.tabs.suggestions'),
            icon: <LightbulbIcon fontSize="small" />
        },
        {
            id: 'spelling',
            label: t('ai.tabs.spelling'),
            icon: <SpellcheckIcon fontSize="small" />
        },
        {
            id: 'translate',
            label: t('ai.tabs.translate'),
            icon: <TranslateIcon fontSize="small" />
        },
        {
            id: 'summary',
            label: t('ai.tabs.summary'),
            icon: <SummaryIcon fontSize="small" />
        },
        {
            id: 'client-info',
            label: t('ai.tabs.clientInfo'),
            icon: <ClientIcon fontSize="small" />
        },
        {
            id: 'assistant',
            label: t('ai.tabs.assistant'),
            icon: <AIIcon fontSize="small" />
        }
    ];

    // Available languages for translation
    const languages = [
        { code: 'ar', name: t('languages.arabic') },
        { code: 'zh', name: t('languages.chinese') },
        { code: 'en', name: t('languages.english') },
        { code: 'fr', name: t('languages.french') },
        { code: 'de', name: t('languages.german') },
        { code: 'hi', name: t('languages.hindi') },
        { code: 'it', name: t('languages.italian') },
        { code: 'ja', name: t('languages.japanese') },
        { code: 'ko', name: t('languages.korean') },
        { code: 'pt', name: t('languages.portuguese') },
        { code: 'ru', name: t('languages.russian') },
        { code: 'es', name: t('languages.spanish') }
    ];

    // Load clients and cases on mount
    useEffect(() => {
        if (activeTab === 4) { // Client Info tab
            loadClientsAndCases();
        }
    }, [activeTab]);

    // Load suggestions when panel is first shown
    useEffect(() => {
        if (documentContent && activeTab === 0) {
            generateSuggestions();
        }
    }, [documentContent, activeTab]);

    // Filter suggestions when search term changes
    useEffect(() => {
        if (!searchTerm) {
            setFilteredSuggestions(suggestions);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = suggestions.filter(suggestion =>
            suggestion.original?.toLowerCase().includes(term) ||
            suggestion.suggested?.toLowerCase().includes(term) ||
            suggestion.explanation?.toLowerCase().includes(term) ||
            suggestion.type?.toLowerCase().includes(term)
        );

        setFilteredSuggestions(filtered);
    }, [searchTerm, suggestions]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Load clients and cases
    const loadClientsAndCases = async () => {
        setClientsLoading(true);
        setCasesLoading(true);

        try {
            const clientsData = await clientService.getClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Error loading clients:', error);
            setError(t('ai.errors.clientsLoadFailed'));
        } finally {
            setClientsLoading(false);
        }

        try {
            const casesData = await caseService.getCases();
            setCases(casesData);
        } catch (error) {
            console.error('Error loading cases:', error);
            setError(t('ai.errors.casesLoadFailed'));
        } finally {
            setCasesLoading(false);
        }
    };

    // Generate elegant phrasing suggestions
    const generateSuggestions = async () => {
        if (!documentContent) return;

        setLoading(true);
        setError(null);

        try {
            const result = await aiService.getElegantPhrasing(documentContent);
            setSuggestions(result);
            setFilteredSuggestions(result);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            setError(t('ai.errors.suggestionsFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Check spelling and grammar
    const handleCheckSpelling = async () => {
        if (!documentContent) return;

        setSpellingLoading(true);
        setError(null);

        try {
            const result = await aiService.checkSpellingAndSyntax(documentContent);
            setSpellingResults(result);
        } catch (error) {
            console.error('Error checking spelling and grammar:', error);
            setError(t('ai.errors.spellingCheckFailed'));
        } finally {
            setSpellingLoading(false);
        }
    };

    // Translate document
    const handleTranslate = async () => {
        if (!documentContent) return;

        setTranslateLoading(true);
        setError(null);

        try {
            const result = await aiService.translateDocument(documentContent, targetLanguage);
            setTranslatedContent(result.translatedContent);
            setTranslationDialog(true);
        } catch (error) {
            console.error('Error translating document:', error);
            setError(t('ai.errors.translationFailed'));
        } finally {
            setTranslateLoading(false);
        }
    };

    // Apply translation
    const handleApplyTranslation = () => {
        if (!translatedContent) return;

        // Create a suggestion-like object to use the same handler
        const suggestion = {
            original: documentContent,  // Replace entire document
            suggested: translatedContent
        };

        onApplySuggestion(suggestion);
        setTranslatedContent('');
        setTranslationDialog(false);
    };

    // Summarize document
    const handleSummarize = async () => {
        if (!documentContent) return;

        setSummaryLoading(true);
        setError(null);

        try {
            const result = await aiService.summarizeDocument(documentContent);
            setSummary(result.summary);
        } catch (error) {
            console.error('Error summarizing document:', error);
            setError(t('ai.errors.summarizationFailed'));
        } finally {
            setSummaryLoading(false);
        }
    };

    // Generate client/case information suggestions
    const handleGenerateClientInfo = async () => {
        if (!documentContent) return;

        setClientInfoLoading(true);
        setError(null);

        try {
            const result = await aiService.suggestInfoIntegration(
                documentContent,
                selectedClient?.clientId,
                selectedCase?.caseId
            );
            setClientInfoSuggestions(result);
        } catch (error) {
            console.error('Error generating client/case info suggestions:', error);
            setError(t('ai.errors.clientInfoFailed'));
        } finally {
            setClientInfoLoading(false);
        }
    };

    // Generate completion
    const handleGenerateCompletion = async () => {
        if (!prompt) return;

        setCompletionLoading(true);
        setError(null);

        try {
            const result = await aiService.generateCompletion(prompt);
            setCompletion(result.completion);
        } catch (error) {
            console.error('Error generating completion:', error);
            setError(t('ai.errors.completionFailed'));
        } finally {
            setCompletionLoading(false);
        }
    };

    // Insert completion
    const handleInsertCompletion = () => {
        if (!completion) return;

        // Create a suggestion-like object to use the same handler
        const suggestion = {
            original: '',  // Empty since we're not replacing anything
            suggested: completion
        };

        onApplySuggestion(suggestion);
        setCompletion('');
        setPrompt('');
    };

    // Clear completion
    const handleClearCompletion = () => {
        setCompletion('');
    };

    // Clear summary
    const handleClearSummary = () => {
        setSummary('');
    };

    // Get suggestion chip color based on type
    const getSuggestionColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'spelling': return 'error';
            case 'grammar': return 'warning';
            case 'syntax': return 'info';
            case 'elegance': return 'primary';
            case 'legal': return 'secondary';
            case 'info_integration': return 'success';
            case 'style': return 'default';
            default: return 'default';
        }
    };

    // Render suggestion card
    const renderSuggestionCard = (suggestion) => (
        <Card key={suggestion.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                    <Chip
                        label={t(`ai.suggestionTypes.${suggestion.type?.toLowerCase()}`) || suggestion.type}
                        color={getSuggestionColor(suggestion.type)}
                        size="small"
                    />
                </Box>

                {suggestion.original && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {t('ai.original')}:
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                backgroundColor: 'action.hover',
                                p: 1,
                                borderRadius: 1,
                                mb: 1,
                                fontFamily: 'Georgia, serif'
                            }}
                        >
                            {suggestion.original}
                        </Typography>
                    </>
                )}

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('ai.suggested')}:
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        fontFamily: 'Georgia, serif'
                    }}
                >
                    {suggestion.suggested}
                </Typography>

                {suggestion.explanation && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                    >
                        {suggestion.explanation}
                    </Typography>
                )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={() => onApplySuggestion(suggestion)}
                >
                    {t('ai.apply')}
                </Button>
            </CardActions>
        </Card>
    );

    // Render elegant phrasing tab
    const renderSuggestionsTab = () => (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t('ai.searchSuggestions')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />

                <Tooltip title={t('ai.refreshSuggestions')}>
                    <IconButton
                        onClick={generateSuggestions}
                        disabled={loading}
                        sx={{ ml: 1 }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {filteredSuggestions.length === 0 ? (
                        <Alert severity="info">
                            {searchTerm
                                ? t('ai.noSearchResults')
                                : t('ai.noSuggestions')
                            }
                        </Alert>
                    ) : (
                        <Box>
                            {filteredSuggestions.map(renderSuggestionCard)}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );

    // Render spelling and grammar tab
    const renderSpellingTab = () => (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCheckSpelling}
                    disabled={spellingLoading || !documentContent}
                    startIcon={spellingLoading ? <CircularProgress size={20} /> : <SpellcheckIcon />}
                    sx={{ mr: 1 }}
                >
                    {t('ai.checkSpelling')}
                </Button>

                <TextField
                    fullWidth
                    size="small"
                    placeholder={t('ai.searchSpellingResults')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                    sx={{ ml: 1 }}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {spellingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {spellingResults.length === 0 ? (
                        <Alert severity="info">
                            {t('ai.noSpellingResults')}
                        </Alert>
                    ) : (
                        <Box>
                            {spellingResults
                                .filter(result =>
                                    !searchTerm ||
                                    result.original?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    result.suggested?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(renderSuggestionCard)
                            }
                        </Box>
                    )}
                </>
            )}
        </Box>
    );

    // Render translation tab
    const renderTranslateTab = () => (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FormControl sx={{ minWidth: 120, mr: 2 }}>
                    <InputLabel id="target-language-label">{t('ai.targetLanguage')}</InputLabel>
                    <Select
                        labelId="target-language-label"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        label={t('ai.targetLanguage')}
                        size="small"
                    >
                        {languages.map((lang) => (
                            <MenuItem key={lang.code} value={lang.code}>
                                {lang.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleTranslate}
                    disabled={translateLoading || !documentContent}
                    startIcon={translateLoading ? <CircularProgress size={20} /> : <TranslateIcon />}
                >
                    {t('ai.translate')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Alert severity="info" sx={{ mb: 2 }}>
                {t('ai.translateInfo')}
            </Alert>

            {/* Translation Dialog */}
            <Dialog
                open={translationDialog}
                onClose={() => setTranslationDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {t('ai.translationResult', { language: languages.find(l => l.code === targetLanguage)?.name })}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {translatedContent}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTranslationDialog(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleApplyTranslation}
                    >
                        {t('ai.applyTranslation')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    // Render summary tab
    const renderSummaryTab = () => (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSummarize}
                    disabled={summaryLoading || !documentContent}
                    startIcon={summaryLoading ? <CircularProgress size={20} /> : <SummaryIcon />}
                >
                    {t('ai.summarize')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Divider sx={{ mb: 2 }}>
                <Chip label={t('ai.summary')} />
            </Divider>

            {summaryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                summary ? (
                    <Box sx={{ mb: 2 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'Georgia, serif'
                                    }}
                                >
                                    {summary}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClearSummary}
                                >
                                    {t('ai.clear')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => {
                                        // Create a new document with the summary
                                        const suggestion = {
                                            original: '',
                                            suggested: summary
                                        };
                                        onApplySuggestion(suggestion);
                                    }}
                                >
                                    {t('ai.saveAsSeparateDocument')}
                                </Button>
                            </CardActions>
                        </Card>
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {t('ai.summaryHint')}
                    </Alert>
                )
            )}
        </Box>
    );

    // Render client/case information tab
    const renderClientInfoTab = () => (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    {t('ai.selectClientCase')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                    <Autocomplete
                        options={clients}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={selectedClient}
                        onChange={(_, newValue) => setSelectedClient(newValue)}
                        loading={clientsLoading}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('ai.selectClient')}
                                size="small"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {clientsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ flexGrow: 1 }}
                    />

                    <Autocomplete
                        options={cases}
                        getOptionLabel={(option) => `${option.caseNumber}: ${option.title}`}
                        value={selectedCase}
                        onChange={(_, newValue) => setSelectedCase(newValue)}
                        loading={casesLoading}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('ai.selectCase')}
                                size="small"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {casesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ flexGrow: 1 }}
                    />
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateClientInfo}
                    disabled={clientInfoLoading || (!selectedClient && !selectedCase)}
                    startIcon={clientInfoLoading ? <CircularProgress size={20} /> : <ClientIcon />}
                >
                    {t('ai.generateClientInfoSuggestions')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Divider sx={{ mb: 2 }}>
                <Chip label={t('ai.clientInfoSuggestions')} />
            </Divider>

            {clientInfoLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {clientInfoSuggestions.length === 0 ? (
                        <Alert severity="info">
                            {(selectedClient || selectedCase)
                                ? t('ai.noClientInfoSuggestions')
                                : t('ai.selectClientCaseFirst')}
                        </Alert>
                    ) : (
                        <Box>
                            {clientInfoSuggestions.map(renderSuggestionCard)}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );

    // Render assistant tab
    const renderAssistantTab = () => (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t('ai.promptPlaceholder')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleGenerateCompletion}
                                disabled={!prompt || completionLoading}
                            >
                                <AIIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Divider sx={{ mb: 2 }}>
                <Chip label={t('ai.completion')} />
            </Divider>

            {completionLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                completion ? (
                    <Box sx={{ mb: 2 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'Georgia, serif'
                                    }}
                                >
                                    {completion}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClearCompletion}
                                >
                                    {t('ai.clear')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<CheckIcon />}
                                    onClick={handleInsertCompletion}
                                >
                                    {t('ai.insert')}
                                </Button>
                            </CardActions>
                        </Card>
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {t('ai.promptHint')}
                    </Alert>
                )
            )}

            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    {t('ai.promptExamples')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                        label={t('ai.examples.summarize')}
                        onClick={() => setPrompt(t('ai.examples.summarize'))}
                        icon={<QuoteIcon />}
                        clickable
                    />
                    <Chip
                        label={t('ai.examples.clause')}
                        onClick={() => setPrompt(t('ai.examples.clause'))}
                        icon={<LightbulbIcon />}
                        clickable
                    />
                    <Chip
                        label={t('ai.examples.simplify')}
                        onClick={() => setPrompt(t('ai.examples.simplify'))}
                        icon={<TranslateIcon />}
                        clickable
                    />
                    <Chip
                        label={t('ai.examples.proofread')}
                        onClick={() => setPrompt(t('ai.examples.proofread'))}
                        icon={<SpellcheckIcon />}
                        clickable
                    />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderLeft: 1,
                borderColor: 'divider'
            }}
        >
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AIIcon sx={{ mr: 1 }} color="secondary" />
                    {t('ai.title')}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                minHeight: 'unset',
                                py: 1.5
                            }}
                        />
                    ))}
                </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {activeTab === 0 && renderWelcomeTab()}
                {activeTab === 1 && renderSuggestionsTab()}
                {activeTab === 2 && renderSpellingTab()}
                {activeTab === 3 && renderTranslateTab()}
                {activeTab === 4 && renderSummaryTab()}
                {activeTab === 5 && renderClientInfoTab()}
                {activeTab === 6 && renderAssistantTab()}
            </Box>
        </Box>
    );
};

export default AIAssistantPanel;