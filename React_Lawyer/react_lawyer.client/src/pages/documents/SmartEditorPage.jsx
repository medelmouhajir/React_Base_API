// src/pages/documents/SmartEditorPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box, Paper, TextField, Button, IconButton, Menu, MenuItem,
    Divider, CircularProgress, Alert, AppBar, Toolbar, Tooltip, Snackbar
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

// Import services
import documentGenerationService from '../../services/documentGenerationService';
import smartEditorService from '../../services/smartEditorService';

// Import ReactQuill
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SmartEditorPage = () => {
    const { t } = useTranslation();
    const { templateId, documentId: docId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile, mode } = useThemeMode();
    const { user } = useAuth();
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
    const [documentId, setDocumentId] = useState(docId || null);
    const [hasChanges, setHasChanges] = useState(false);

    // Quill editor modules configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['clean']
        ],
        history: { delay: 500, maxStack: 100, userOnly: true }
    };

    // Quill formats
    const formats = [
        'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
        'blockquote', 'list', 'bullet', 'indent', 'link', 'image',
        'color', 'background', 'align', 'script'
    ];

    // Load document or template on mount
    useEffect(() => {
        console.log("documentId : " + documentId);
        if (documentId) {
            loadExistingDocument(documentId);
        } else if (templateId) {
            loadTemplate(templateId);
        } else if (!location.state?.skipTemplateDialog) {
            setShowTemplateDialog(true);
        }

        // Auto-save every minute if there are changes
        const autoSaveInterval = setInterval(() => {
            if (hasChanges && documentId) handleAutoSave();
        }, 60000);

        return () => clearInterval(autoSaveInterval);
    }, [templateId, documentId]);

    // Load existing document
    const loadExistingDocument = async (id) => {
        console.log("loadExistingDocument : " + id)
        setLoading(true);
        setError(null);
        try {
            const doc = await smartEditorService.getDocumentById(id);
            setDocumentId(id);
            setDocumentTitle(doc.title);
            setDocumentContent(doc.content);
            setHasChanges(false);
        } catch (error) {
            console.error('Error loading document:', error);
            setError(t('smartEditor.errors.documentLoad'));
        } finally {
            setLoading(false);
        }
    };

    // Load template
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

    // Template selection handler
    const handleSelectTemplate = (template) => {
        setTemplate(template);
        setDocumentTitle(template.name);
        setDocumentContent(template.content || '');
        setShowTemplateDialog(false);
    };

    // Content change handler
    const handleContentChange = (content) => {
        setDocumentContent(content);
        setHasChanges(true);
    };

    // Save document
    const handleSaveDocument = async () => {
        if (!documentTitle.trim()) {
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.titleRequired')
            });
            return;
        }

        setSaving(true);
        try {
            let result;

            if (documentId) {
                // Update existing document
                result = await smartEditorService.updateDocument(documentId, {
                    title: documentTitle,
                    content: documentContent
                });
            } else {
                // Create new document
                result = await smartEditorService.saveDocument({
                    templateId: template?.id,
                    title: documentTitle,
                    content: documentContent,
                    lawFirmId: user?.lawFirmId,
                    caseId: location.state?.caseId
                });
                setDocumentId(result.documentId);
            }

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

    // Auto-save document
    const handleAutoSave = async () => {
        if (!documentId || !hasChanges) return;

        try {
            await smartEditorService.updateDocument(documentId, {
                content: documentContent,
                title: documentTitle
            });
            setHasChanges(false);
            console.log('Document auto-saved');
        } catch (error) {
            console.error('Error auto-saving:', error);
        }
    };

    // Export document
    const handleExportDocument = async (format = 'pdf') => {
        try {
            // Save any unsaved changes first
            if (hasChanges) await handleSaveDocument();

            // Export document
            const result = await smartEditorService.exportDocument({
                documentId,
                content: documentContent, // Include content for direct export
                title: documentTitle,
                format
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

    // Print document
    const handlePrintDocument = () => {
        if (!editorRef.current) return;

        const content = editorRef.current.getEditor().root.innerHTML;
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
                <div class="document">${content}</div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Create new document
    const handleCreateNewDocument = () => {
        if (hasChanges && !window.confirm(t('smartEditor.unsavedChanges'))) {
            return;
        }

        setTemplate(null);
        setDocumentTitle('');
        setDocumentContent('');
        setDocumentId(null);
        setHasChanges(false);
        setShowTemplateDialog(true);
    };

    // Handle application of AI suggestions
    const handleApplyAISuggestion = (suggestion) => {
        if (!editorRef.current) return;

        const editor = editorRef.current.getEditor();
        const text = editor.getText();
        const index = text.indexOf(suggestion.original);

        if (index !== -1) {
            editor.deleteText(index, suggestion.original.length);
            editor.insertText(index, suggestion.suggested);
            setHasChanges(true);
        }
    };

    // Navigate back with confirmation if needed
    const handleNavBack = () => {
        if (hasChanges && !window.confirm(t('smartEditor.unsavedChanges'))) {
            return;
        }
        navigate('/documents');
    };

    // Menu handlers
    const openMenu = (event) => setMenuAnchorEl(event.currentTarget);
    const closeMenu = () => setMenuAnchorEl(null);

    // Handle notification dismissal
    const handleCloseNotification = () => setNotification(null);

    // Show loading indicator
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
                            {saving ? t('common.saving') : documentId ? t('common.update') : t('common.save')}
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
                            backgroundColor: 'background.paper',
                            boxShadow: 3,
                            '& .ql-container': {
                                borderBottom: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                fontFamily: 'Georgia, Times New Roman, serif',
                                fontSize: '12pt'
                            },
                            '& .ql-toolbar': {
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            },
                            '& .ql-editor': {
                                minHeight: '10in',
                                padding: '0.5in',
                                color: mode === 'dark' ? '#e0e0e0' : '#333',
                            },
                            '& .ql-toolbar button, & .ql-toolbar .ql-picker': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                            },
                            '& .ql-toolbar .ql-stroke': {
                                stroke: mode === 'dark' ? '#ffffff' : 'currentColor',
                            },
                            '& .ql-toolbar .ql-fill': {
                                fill: mode === 'dark' ? '#ffffff' : 'currentColor',
                            },
                            '& .ql-toolbar .ql-picker-options': {
                                backgroundColor: mode === 'dark' ? '#333' : '#fff',
                            }
                        }}
                    >
                        <ReactQuill
                            ref={editorRef}
                            theme="snow"
                            value={documentContent}
                            onChange={handleContentChange}
                            modules={modules}
                            formats={formats}
                        />
                    </Paper>
                </Box>

                {/* AI Assistant Panel */}
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