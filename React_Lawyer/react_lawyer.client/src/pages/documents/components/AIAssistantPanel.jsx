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
    Chip,
    Alert,
    Tooltip,
    Tabs,
    Tab,
    TextField,
    InputAdornment
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
    Psychology as AIIcon
} from '@mui/icons-material';

// Import services (mock service for demonstration)
// In a real implementation, you would create an actual service
const aiService = {
    generateSuggestions: async (content) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock suggestions
        return [
            {
                id: '1',
                type: 'clarity',
                original: 'The party of the first part shall hereafter be referred to as the seller.',
                suggested: 'The seller agrees to the following terms.',
                explanation: 'Simplified language for better readability.'
            },
            {
                id: '2',
                type: 'legal',
                original: 'The buyer will pay within 30 days.',
                suggested: 'The buyer shall make payment in full within thirty (30) days of receipt of invoice.',
                explanation: 'Added legal precision and clarity to payment terms.'
            },
            {
                id: '3',
                type: 'grammar',
                original: 'Both party\'s responsibilities are defined herein.',
                suggested: 'Both parties\' responsibilities are defined herein.',
                explanation: 'Corrected plural possessive form.'
            },
            {
                id: '4',
                type: 'style',
                original: 'We think that this contract will be beneficial.',
                suggested: 'This contract provides mutual benefits to all parties.',
                explanation: 'Removed first person and strengthened statement.'
            }
        ];
    },

    generateCompletion: async (prompt) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock completions based on prompt
        if (prompt.includes('clause')) {
            return 'Force Majeure Clause: Neither party shall be liable for any failure or delay in performance under this Agreement to the extent said failures or delays are proximately caused by causes beyond that party\'s reasonable control and occurring without its fault or negligence.';
        } else if (prompt.includes('summar')) {
            return 'This agreement establishes a partnership between Company A and Company B for the joint development and marketing of Product X. Key points include revenue sharing (60/40 split), intellectual property rights, and a 2-year initial term with options for renewal.';
        } else {
            return 'I can help you draft legal language, summarize documents, suggest improvements, or generate new content for your document. What specific legal text would you like me to help with?';
        }
    }
};

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

    // Tab definitions
    const tabs = [
        {
            id: 'suggestions',
            label: t('ai.tabs.suggestions'),
            icon: <LightbulbIcon fontSize="small" />
        },
        {
            id: 'assistant',
            label: t('ai.tabs.assistant'),
            icon: <AIIcon fontSize="small" />
        }
    ];

    // Load suggestions when panel is first shown
    useEffect(() => {
        if (documentContent && activeTab === 0) {
            generateSuggestions();
        }
    }, [documentContent]);

    // Filter suggestions when search term changes
    useEffect(() => {
        if (!searchTerm) {
            setFilteredSuggestions(suggestions);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = suggestions.filter(suggestion =>
            suggestion.original.toLowerCase().includes(term) ||
            suggestion.suggested.toLowerCase().includes(term) ||
            suggestion.explanation.toLowerCase().includes(term) ||
            suggestion.type.toLowerCase().includes(term)
        );

        setFilteredSuggestions(filtered);
    }, [searchTerm, suggestions]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Generate suggestions
    const generateSuggestions = async () => {
        if (!documentContent) return;

        setLoading(true);
        setError(null);

        try {
            const result = await aiService.generateSuggestions(documentContent);
            setSuggestions(result);
            setFilteredSuggestions(result);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            setError(t('ai.errors.suggestionsFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Generate completion
    const handleGenerateCompletion = async () => {
        if (!prompt) return;

        setCompletionLoading(true);
        setError(null);

        try {
            const result = await aiService.generateCompletion(prompt);
            setCompletion(result);
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

    // Get suggestion chip color based on type
    const getSuggestionColor = (type) => {
        switch (type) {
            case 'clarity': return 'info';
            case 'legal': return 'primary';
            case 'grammar': return 'success';
            case 'style': return 'secondary';
            default: return 'default';
        }
    };

    // Render suggestion card
    const renderSuggestionCard = (suggestion) => (
        <Card key={suggestion.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                    <Chip
                        label={t(`ai.suggestionTypes.${suggestion.type}`)}
                        color={getSuggestionColor(suggestion.type)}
                        size="small"
                    />
                </Box>

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

    // Render suggestions tab
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
                    variant="fullWidth"
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
                {activeTab === 0 ? renderSuggestionsTab() : renderAssistantTab()}
            </Box>
        </Box>
    );
};

export default AIAssistantPanel;