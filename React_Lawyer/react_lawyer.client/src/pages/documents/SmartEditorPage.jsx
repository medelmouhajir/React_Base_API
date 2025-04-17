// src/pages/documents/SmartEditorPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    CircularProgress,
    Alert,
    AppBar,
    Toolbar,
    Tooltip,
    Snackbar
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudDownload as ExportIcon,
    ArrowBack as BackIcon,
    Psychology as AIIcon,
    MoreVert as MoreIcon,
    FileCopy as FileIcon,
    InsertDriveFile as NewDocIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import { useAuth } from '../../features/auth/AuthContext';

// Import components
import TemplateSelectionDialog from './components/TemplateSelectionDialog';
import AIAssistantPanel from './components/AIAssistantPanel';
import DocumentEditor from './components/DocumentEditor';
import EditorToolbar from './components/EditorToolbar';

// Import services
import documentGenerationService from '../../services/documentGenerationService';
import smartEditorService from '../../services/smartEditorService';

const SmartEditorPage = () => {
    const { t } = useTranslation();
    const { templateId } = useParams();
    const navigate = useNavigate();
    const { isMobile } = useThemeMode();
    const { getCurrentUser } = useAuth();
    const user = getCurrentUser();
    const editorRef = useRef(null);

    // State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState(null);
    const [documentTitle, setDocumentTitle] = useState('');
    const [documentContent, setDocumentContent] = useState('');
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Load template on mount if templateId is provided
    useEffect(() => {
        if (templateId) {
            loadTemplate(templateId);
        } else {
            setShowTemplateDialog(true);
        }

        // Auto-save functionality
        const autoSaveInterval = setInterval(() => {
            if (hasChanges && documentId) {
                handleAutoSave();
            }
        }, 60000); // Auto-save every minute if there are changes

        return () => clearInterval(autoSaveInterval);
    }, [templateId, hasChanges, documentId]);

    const loadTemplate = async (id) => {
        setLoading(true);
        setError(null);
        try {
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

    const handleContentChange = (content) => {
        setDocumentContent(content);
        setHasChanges(true);
    };

    const handleSaveDocument = async () => {
        setSaving(true);
        try {
            // Save document to the API
            const result = await smartEditorService.saveDocument({
                templateId: template?.id,
                title: documentTitle,
                content: documentContent,
                userId: user.id
            });

            setDocumentId(result.id);
            setHasChanges(false);

            setNotification({
                type: 'success',
                message: t('smartEditor.notifications.saved')
            });
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

    const handleAutoSave = async () => {
        try {
            if (!documentId) return;

            // Update existing document
            await smartEditorService.updateDocument(documentId, {
                content: documentContent,
                title: documentTitle
            });

            setHasChanges(false);
            console.log('Document auto-saved successfully');
        } catch (error) {
            console.error('Error auto-saving document:', error);
        }
    };

    const handleExportDocument = async (format = 'pdf') => {
        try {
            // First save any unsaved changes
            if (hasChanges) {
                await handleSaveDocument();
            }

            // Export the document
            const result = await smartEditorService.exportDocument({
                documentId: documentId,
                format: format
            });

            // Create download link
            const url = window.URL.createObjectURL(result);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${documentTitle}.${format}`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setNotification({
                type: 'success',
                message: t('smartEditor.notifications.exported', { format: format.toUpperCase() })
            });
        } catch (error) {
            console.error('Error exporting document:', error);
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.export')
            });
        }
    };

    const handlePrintDocument = () => {
        if (editorRef.current) {
            const content = editorRef.current.getEditorContents();
            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
                <html>
                <head>
                    <title>${documentTitle || 'Document'}</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }
                        .document { max-width: 8.5in; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="document">
                        ${content}
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            // Print after styles are loaded
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleCreateNewDocument = () => {
        // Check for unsaved changes
        if (hasChanges) {
            if (window.confirm(t('smartEditor.unsavedChanges'))) {
                resetEditor();
            }
        } else {
            resetEditor();
        }
    };

    const resetEditor = () => {
        setTemplate(null);
        setDocumentTitle('');
        setDocumentContent('');
        setDocumentId(null);
        setHasChanges(false);
        setShowTemplateDialog(true);
    };

    const openMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const closeMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleNavBack = () => {
        // Check for unsaved changes before navigating away
        if (hasChanges) {
            if (window.confirm(t('smartEditor.unsavedChanges'))) {
                navigate('/documents');
            }
        } else {
            navigate('/documents');
        }
    };

    const handleApplyAISuggestion = (suggestion) => {
        if (editorRef.current) {
            editorRef.current.applyTextReplacement(suggestion.original, suggestion.suggested);
            setHasChanges(true);
        }
    };

    // Handle notifications
    const handleCloseNotification = () => {
        setNotification(null);
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
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={handleNavBack} sx={{ mr: 1 }}>
                        <BackIcon />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={t('smartEditor.newDocument')}>
                            <IconButton color="inherit" onClick={handleCreateNewDocument} sx={{ mr: 1 }}>
                                <NewDocIcon />
                            </IconButton>
                        </Tooltip>

                        <TextField
                            value={documentTitle}
                            onChange={(e) => {
                                setDocumentTitle(e.target.value);
                                setHasChanges(true);
                            }}
                            variant="standard"
                            placeholder={t('smartEditor.untitledDocument')}
                            InputProps={{
                                disableUnderline: true,
                                sx: { fontSize: '1.2rem', fontWeight: 500 }
                            }}
                        />
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                            onClick={handleSaveDocument}
                            disabled={saving || !hasChanges}
                        >
                            {saving ? t('common.saving') : t('common.save')}
                        </Button>

                        <Tooltip title={t('smartEditor.aiAssistant')}>
                            <IconButton
                                color="secondary"
                                onClick={() => setShowAIPanel(!showAIPanel)}
                                sx={{
                                    bgcolor: showAIPanel ? 'action.selected' : 'transparent'
                                }}
                            >
                                <AIIcon />
                            </IconButton>
                        </Tooltip>

                        <IconButton onClick={openMenu}>
                            <MoreIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Editor Toolbar */}
            <EditorToolbar editorRef={editorRef} />

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Document Editor */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: 'background.default' }}>
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
                        <DocumentEditor
                            ref={editorRef}
                            content={documentContent}
                            onChange={handleContentChange}
                        />
                    </Paper>
                </Box>

                {/* AI Assistant Panel (conditionally rendered) */}
                {showAIPanel && (
                    <Paper
                        sx={{
                            width: 350,
                            maxWidth: isMobile ? '100%' : 350,
                            overflowY: 'auto',
                            borderLeft: 1,
                            borderColor: 'divider'
                        }}
                    >
                        <AIAssistantPanel
                            documentContent={documentContent}
                            onApplySuggestion={handleApplyAISuggestion}
                            onClose={() => setShowAIPanel(false)}
                        />
                    </Paper>
                )}
            </Box>

            {/* Template Selection Dialog */}
            <TemplateSelectionDialog
                open={showTemplateDialog}
                onClose={() => setShowTemplateDialog(false)}
                onSelect={handleSelectTemplate}
            />

            {/* Document Options Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={closeMenu}
            >
                <MenuItem onClick={() => { setShowTemplateDialog(true); closeMenu(); }}>
                    <FileIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('smartEditor.menu.selectTemplate')}
                </MenuItem>
                <MenuItem onClick={() => { handlePrintDocument(); closeMenu(); }}>
                    <PrintIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('smartEditor.menu.print')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleExportDocument('docx'); closeMenu(); }}>
                    {t('smartEditor.menu.exportWord')}
                </MenuItem>
                <MenuItem onClick={() => { handleExportDocument('pdf'); closeMenu(); }}>
                    {t('smartEditor.menu.exportPdf')}
                </MenuItem>
                <MenuItem onClick={() => { handleExportDocument('html'); closeMenu(); }}>
                    {t('smartEditor.menu.exportHtml')}
                </MenuItem>
            </Menu>

            {/* Notification Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {notification && (
                    <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </Box>
    );
};

export default SmartEditorPage;