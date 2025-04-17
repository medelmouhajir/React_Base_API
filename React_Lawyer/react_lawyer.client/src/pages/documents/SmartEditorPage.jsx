// src/pages/documents/SmartEditorPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Chip,
    Divider,
    Card,
    CardContent,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tabs,
    Tab,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudDownload as ExportIcon,
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    FormatUnderlined as UnderlineIcon,
    FormatListBulleted as BulletListIcon,
    FormatListNumbered as NumberedListIcon,
    FormatIndentIncrease as IndentIcon,
    FormatIndentDecrease as OutdentIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    ArrowBack as BackIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Check as CheckIcon,
    Code as CodeIcon,
    Settings as SettingsIcon,
    FindReplace as FindReplaceIcon,
    Psychology as AIIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignRight as AlignRightIcon,
    FormatAlignJustify as AlignJustifyIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import { useAuth } from '../../features/auth/AuthContext';

// This would be imported from your services
import documentGenerationService from '../../services/documentGenerationService';

// Template selection dialog component
const TemplateSelectionDialog = ({ open, onClose, onSelect }) => {
    const { t } = useTranslation();
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);

    // Categories from templates
    const categories = ['all', ...new Set(templates.map(template => template.category))];

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const result = await documentGenerationService.getTemplates();
                setTemplates(result);
                setFilteredTemplates(result);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    // Filter templates based on search term and category
    useEffect(() => {
        let filtered = templates;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(template => template.category === selectedCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(template =>
                template.name.toLowerCase().includes(term) ||
                template.description.toLowerCase().includes(term)
            );
        }

        setFilteredTemplates(filtered);
    }, [searchTerm, selectedCategory, templates]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('templates.select')}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" />
                            }}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {categories.map(category => (
                                <Chip
                                    key={category}
                                    label={t(`templates.categories.${category}`)}
                                    onClick={() => setSelectedCategory(category)}
                                    color={selectedCategory === category ? 'primary' : 'default'}
                                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                                />
                            ))}
                        </Box>
                    </Grid>

                    {loading ? (
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                {filteredTemplates.length === 0 ? (
                                    <Grid item xs={12}>
                                        <Alert severity="info">{t('templates.noTemplatesFound')}</Alert>
                                    </Grid>
                                ) : (
                                    filteredTemplates.map(template => (
                                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                                            <Card
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { boxShadow: 6 }
                                                }}
                                                onClick={() => onSelect(template)}
                                            >
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>{template.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {template.description}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={t(`templates.categories.${template.category}`)}
                                                        sx={{ mt: 1 }}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
            </DialogActions>
        </Dialog>
    );
};

// AI Assistant dialog component
const AIAssistantDialog = ({ open, onClose, onApplySuggestion, documentText }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (open && documentText) {
            generateSuggestions();
        }
    }, [open, documentText]);

    const generateSuggestions = async () => {
        setLoading(true);
        try {
            // In a real implementation, you would call an API to generate AI suggestions
            // For this example, we'll use mock data
            setTimeout(() => {
                setSuggestions([
                    {
                        type: 'clarity',
                        original: 'The party of the first part shall hereafter be referred to as the seller.',
                        suggested: 'The seller agrees to the following terms.',
                        explanation: 'Simplified language for better readability.'
                    },
                    {
                        type: 'legal',
                        original: 'The buyer will pay within 30 days.',
                        suggested: 'The buyer shall make payment in full within thirty (30) days of receipt of invoice.',
                        explanation: 'Added legal precision and clarity to payment terms.'
                    },
                    {
                        type: 'grammar',
                        original: 'Both party\'s responsibilities are defined herein.',
                        suggested: 'Both parties\' responsibilities are defined herein.',
                        explanation: 'Corrected plural possessive form.'
                    }
                ]);
                setLoading(false);
            }, 1500);
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            setLoading(false);
        }
    };

    const tabOptions = [
        { label: t('smartEditor.ai.allSuggestions'), filter: () => true },
        { label: t('smartEditor.ai.clarityImprovements'), filter: (s) => s.type === 'clarity' },
        { label: t('smartEditor.ai.legalPrecision'), filter: (s) => s.type === 'legal' },
        { label: t('smartEditor.ai.grammarStyle'), filter: (s) => s.type === 'grammar' }
    ];

    const filteredSuggestions = suggestions.filter(tabOptions[activeTab].filter);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('smartEditor.ai.assistantTitle')}</DialogTitle>
            <DialogContent>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabOptions.map((option, index) => (
                        <Tab key={index} label={option.label} />
                    ))}
                </Tabs>

                <Box sx={{ mt: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredSuggestions.length === 0 ? (
                        <Alert severity="info">{t('smartEditor.ai.noSuggestions')}</Alert>
                    ) : (
                        filteredSuggestions.map((suggestion, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Chip
                                                size="small"
                                                label={t(`smartEditor.ai.types.${suggestion.type}`)}
                                                color={
                                                    suggestion.type === 'clarity' ? 'info' :
                                                        suggestion.type === 'legal' ? 'primary' :
                                                            'secondary'
                                                }
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {t('smartEditor.ai.original')}:
                                            </Typography>
                                            <Typography variant="body1" paragraph sx={{
                                                bgcolor: 'background.paper',
                                                p: 1,
                                                borderRadius: 1,
                                                borderLeft: '3px solid',
                                                borderColor: 'divider'
                                            }}>
                                                {suggestion.original}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {t('smartEditor.ai.suggested')}:
                                            </Typography>
                                            <Typography variant="body1" paragraph sx={{
                                                bgcolor: 'background.paper',
                                                p: 1,
                                                borderRadius: 1,
                                                borderLeft: '3px solid',
                                                borderColor: 'primary.main'
                                            }}>
                                                {suggestion.suggested}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {suggestion.explanation}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => onApplySuggestion(suggestion)}
                                            startIcon={<CheckIcon />}
                                        >
                                            {t('smartEditor.ai.apply')}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        disabled={loading}
                        onClick={generateSuggestions}
                    >
                        {t('smartEditor.ai.regenerate')}
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main SmartEditor component
const SmartEditorPage = () => {
    const { t } = useTranslation();
    const { templateId } = useParams();
    const navigate = useNavigate();
    const { isMobile, isTablet } = useThemeMode();
    const { getCurrentUser } = useAuth();
    const user = getCurrentUser();

    // State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState(null);
    const [documentTitle, setDocumentTitle] = useState('');
    const [documentContent, setDocumentContent] = useState('');
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [formatMenuAnchorEl, setFormatMenuAnchorEl] = useState(null);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    // Load template on mount if templateId is provided
    useEffect(() => {
        if (templateId) {
            loadTemplate(templateId);
        } else {
            setShowTemplateDialog(true);
        }
    }, [templateId]);

    const loadTemplate = async (id) => {
        setLoading(true);
        setError(null);
        try {
            // In a real implementation, fetch the template from your API
            const templateData = await documentGenerationService.getTemplateById(id);
            setTemplate(templateData);
            setDocumentTitle(templateData.name);
            setDocumentContent(templateData.content || '');
        } catch (error) {
            console.error('Error loading template:', error);
            setError(t('smartEditor.errors.templateLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template) => {
        setTemplate(template);
        setDocumentTitle(template.name);
        setDocumentContent(template.content || '');
        setShowTemplateDialog(false);
    };

    const handleSaveDocument = async () => {
        setSaving(true);
        try {
            // In a real implementation, save the document to your API
            // await documentGenerationService.saveDocument({
            //     templateId: template?.id,
            //     title: documentTitle,
            //     content: documentContent,
            //     userId: user.id
            // });
            setNotification({
                type: 'success',
                message: t('smartEditor.notifications.saved')
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error saving document:', error);
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.save')
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExportDocument = async (format = 'pdf') => {
        try {
            // In a real implementation, export the document via API
            // const result = await documentGenerationService.exportDocument({
            //     content: documentContent,
            //     title: documentTitle,
            //     format: format
            // });

            // Create a mock download
            setNotification({
                type: 'success',
                message: t('smartEditor.notifications.exported', { format: format.toUpperCase() })
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error exporting document:', error);
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.export')
            });
        }
    };

    const handleApplySuggestion = (suggestion) => {
        // In a real implementation, you would find and replace text in the editor
        // For this example, we'll just log the suggestion
        console.log('Applying suggestion:', suggestion);
        setShowAIDialog(false);
        setNotification({
            type: 'success',
            message: t('smartEditor.notifications.suggestionApplied')
        });
        setTimeout(() => setNotification(null), 3000);
    };

    const openMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const closeMenu = () => {
        setMenuAnchorEl(null);
    };

    const openFormatMenu = (event) => {
        setFormatMenuAnchorEl(event.currentTarget);
    };

    const closeFormatMenu = () => {
        setFormatMenuAnchorEl(null);
    };

    const handleNavBack = () => {
        navigate('/documents');
    };

    // Demo formatting functions (would be implemented with the actual editor)
    const formatText = (format) => {
        console.log('Format text:', format);
        closeFormatMenu();
    };

    // Render loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Top App Bar */}
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleNavBack}>
                        <BackIcon />
                    </IconButton>
                    <TextField
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        variant="standard"
                        placeholder={t('smartEditor.untitledDocument')}
                        sx={{ ml: 2, flexGrow: 1 }}
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '1.2rem', fontWeight: 500 }
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveDocument}
                            disabled={saving}
                        >
                            {saving ? t('common.saving') : t('common.save')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ExportIcon />}
                            onClick={() => handleExportDocument('pdf')}
                        >
                            {t('smartEditor.export')}
                        </Button>
                        <IconButton onClick={openMenu}>
                            <MoreIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Formatting Toolbar */}
            <Paper
                elevation={0}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexWrap: 'wrap',
                    p: 1,
                    gap: 0.5
                }}
            >
                <IconButton size="small" onClick={() => formatText('bold')}>
                    <BoldIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('italic')}>
                    <ItalicIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('underline')}>
                    <UnderlineIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem />
                <IconButton size="small" onClick={() => formatText('align-left')}>
                    <AlignLeftIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('align-center')}>
                    <AlignCenterIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('align-right')}>
                    <AlignRightIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('align-justify')}>
                    <AlignJustifyIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem />
                <IconButton size="small" onClick={() => formatText('bullet-list')}>
                    <BulletListIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('numbered-list')}>
                    <NumberedListIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('indent')}>
                    <IndentIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => formatText('outdent')}>
                    <OutdentIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem />
                <Button
                    size="small"
                    startIcon={<AIIcon />}
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShowAIDialog(true)}
                >
                    {t('smartEditor.ai.suggest')}
                </Button>
                <Button
                    size="small"
                    startIcon={<FindReplaceIcon />}
                    variant="outlined"
                    onClick={openFormatMenu}
                >
                    {t('smartEditor.moreFormatting')}
                </Button>
            </Paper>

            {/* Editor Area */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'background.default'
                }}
            >
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                <Paper
                    elevation={2}
                    sx={{
                        maxWidth: '8.5in',
                        minHeight: '11in',
                        mx: 'auto',
                        p: 4,
                        backgroundColor: 'background.paper',
                        boxShadow: 3
                    }}
                >
                    {/* This would be replaced with an actual rich text editor component */}
                    <TextField
                        multiline
                        fullWidth
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        variant="outlined"
                        placeholder={t('smartEditor.startTyping')}
                        minRows={20}
                        InputProps={{
                            sx: { fontFamily: 'Georgia, serif' }
                        }}
                    />
                </Paper>
            </Box>

            {/* Template Selection Dialog */}
            <TemplateSelectionDialog
                open={showTemplateDialog}
                onClose={() => setShowTemplateDialog(false)}
                onSelect={handleSelectTemplate}
            />

            {/* AI Assistant Dialog */}
            <AIAssistantDialog
                open={showAIDialog}
                onClose={() => setShowAIDialog(false)}
                onApplySuggestion={handleApplySuggestion}
                documentText={documentContent}
            />

            {/* Document Options Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={closeMenu}
            >
                <MenuItem onClick={() => { setShowTemplateDialog(true); closeMenu(); }}>
                    {t('smartEditor.menu.selectTemplate')}
                </MenuItem>
                <MenuItem onClick={() => { handleExportDocument('docx'); closeMenu(); }}>
                    {t('smartEditor.menu.exportWord')}
                </MenuItem>
                <MenuItem onClick={() => { handleExportDocument('pdf'); closeMenu(); }}>
                    {t('smartEditor.menu.exportPdf')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { closeMenu(); }}>
                    {t('smartEditor.menu.documentSettings')}
                </MenuItem>
            </Menu>

            {/* Format Menu */}
            <Menu
                anchorEl={formatMenuAnchorEl}
                open={Boolean(formatMenuAnchorEl)}
                onClose={closeFormatMenu}
            >
                <MenuItem onClick={() => { formatText('heading1'); closeFormatMenu(); }}>
                    {t('smartEditor.format.heading1')}
                </MenuItem>
                <MenuItem onClick={() => { formatText('heading2'); closeFormatMenu(); }}>
                    {t('smartEditor.format.heading2')}
                </MenuItem>
                <MenuItem onClick={() => { formatText('heading3'); closeFormatMenu(); }}>
                    {t('smartEditor.format.heading3')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { formatText('insert-table'); closeFormatMenu(); }}>
                    {t('smartEditor.format.insertTable')}
                </MenuItem>
                <MenuItem onClick={() => { formatText('insert-image'); closeFormatMenu(); }}>
                    {t('smartEditor.format.insertImage')}
                </MenuItem>
                <MenuItem onClick={() => { formatText('insert-link'); closeFormatMenu(); }}>
                    {t('smartEditor.format.insertLink')}
                </MenuItem>
            </Menu>

            {/* Notification */}
            {notification && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 2000
                    }}
                >
                    <Alert severity={notification.type}>
                        {notification.message}
                    </Alert>
                </Box>
            )}
        </Box>
    );
};

export default SmartEditorPage;