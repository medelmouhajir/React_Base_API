// src/pages/documents/SmartEditorPage.jsx
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box, Paper, TextField, Button, IconButton, Menu, MenuItem,
    Divider, CircularProgress, Alert, AppBar, Toolbar, Tooltip, Snackbar,
    Tabs, Tab, Breadcrumbs, Link, Drawer, List, ListItem, ListItemText,
    ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions,
    Avatar, Badge, Typography, Collapse, Grid, Chip, FormControl, InputLabel, Select
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudDownload as ExportIcon,
    ArrowBack as BackIcon,
    Psychology as AIIcon,
    MoreVert as MoreIcon,
    FileCopy as FileIcon,
    InsertDriveFile,
    Print as PrintIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    CompareArrows as CompareIcon,
    Bookmark as BookmarkIcon,
    BookmarkBorder as BookmarkOutlineIcon,
    FolderOpen as FolderIcon,
    Add as AddIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    Refresh as RefreshIcon,
    AccessTime as RecentIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import { useAuth } from '../../features/auth/AuthContext';

// Import components
import TemplateSelectionDialog from './components/TemplateSelectionDialog';
import AIAssistantPanel from './components/AIAssistantPanel';
import EditorToolbar from './components/EditorToolbar';
import DocumentEditor from './components/DocumentEditor';

// Import services
import documentGenerationService from '../../services/documentGenerationService';
import smartEditorService from '../../services/smartEditorService';
import caseService from '../../services/caseService';
import clientService from '../../services/clientService';

// Create document context
const DocumentsContext = createContext();

// Tabs for document editor
const DocumentTab = ({ document, isActive, onActivate, onClose }) => {
    const unsavedChanges = document.hasChanges;
    return (
        <Tab
            label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                        color="warning"
                        variant="dot"
                        invisible={!unsavedChanges}
                        sx={{ mr: 1 }}
                    >
                        <InsertDriveFile fontSize="small" />
                    </Badge>
                    <Typography
                        variant="body2"
                        sx={{
                            maxWidth: 120,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {document.title || 'Untitled'}
                    </Typography>
                </Box>
            }
            value={document.id}
            onClick={onActivate}
            sx={{ 
                minHeight: 'unset',
                py: 1,
                opacity: isActive ? 1 : 0.7
            }}
            iconPosition="end"
            icon={
                <CloseIcon
                    fontSize="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(document.id);
                    }}
                    sx={{
                        fontSize: '0.875rem',
                        '&:hover': {
                            color: 'error.main'
                        }
                    }}
                />
            }
        />
    );
};

const SmartEditorPage = () => {
    const { t } = useTranslation();
    const { templateId, documentId: urlDocumentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile, mode } = useThemeMode();
    const { user } = useAuth();
    const editorRef = useRef(null);

    // State for multiple documents handling
    const [openDocuments, setOpenDocuments] = useState([]);
    const [activeDocumentId, setActiveDocumentId] = useState(null);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    
    // Document context panel
    const [showDocumentContext, setShowDocumentContext] = useState(false);
    const [contextLoading, setContextLoading] = useState(false);
    const [caseData, setCaseData] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    
    // Document history/recent
    const [showHistory, setShowHistory] = useState(false);
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // Document comparison
    const [showCompareDialog, setShowCompareDialog] = useState(false);
    const [compareDocumentId, setCompareDocumentId] = useState(null);
    
    // Document outline 
    const [showOutline, setShowOutline] = useState(false);
    const [documentOutline, setDocumentOutline] = useState([]);
    
    // Get active document
    const activeDocument = openDocuments.find(doc => doc.id === activeDocumentId) || null;

    // Load document or template on mount
    useEffect(() => {
        if (urlDocumentId) {
            loadExistingDocument(urlDocumentId);
        } else if (templateId) {
            loadTemplate(templateId);
        } else if (!location.state?.skipTemplateDialog && openDocuments.length === 0) {
            setShowTemplateDialog(true);
        }

        // Load recent documents
        loadRecentDocuments();

        // Auto-save every minute if there are changes
        const autoSaveInterval = setInterval(() => {
            saveAllModifiedDocuments();
        }, 60000);

        return () => clearInterval(autoSaveInterval);
    }, [templateId, urlDocumentId]);

    // Update document outline when content changes
    useEffect(() => {
        if (activeDocument && showOutline) {
            generateDocumentOutline(activeDocument.content);
        }
    }, [activeDocument?.content, showOutline]);

    // Load document context when active document changes
    useEffect(() => {
        if (activeDocument?.caseId) {
            loadDocumentContext(activeDocument.caseId);
        }
    }, [activeDocumentId]);

    // Auto-save all modified documents
    const saveAllModifiedDocuments = async () => {
        const modifiedDocs = openDocuments.filter(doc => doc.hasChanges && doc.id);
        if (modifiedDocs.length === 0) return;

        for (const doc of modifiedDocs) {
            try {
                await smartEditorService.updateDocument(doc.id, {
                    content: doc.content,
                    title: doc.title
                });
                
                // Update document state to show it's saved
                setOpenDocuments(prevDocs => 
                    prevDocs.map(d => 
                        d.id === doc.id ? { ...d, hasChanges: false } : d
                    )
                );
                
                console.log(`Document auto-saved: ${doc.title} (${doc.id})`);
            } catch (error) {
                console.error(`Error auto-saving document ${doc.id}:`, error);
            }
        }
    };

    // Load existing document
    const loadExistingDocument = async (id) => {
        // Check if document is already open
        if (openDocuments.some(doc => doc.id === id)) {
            setActiveDocumentId(id);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const doc = await smartEditorService.getDocumentById(id);
            
            // Add document to open documents
            const newDocument = {
                id: id,
                title: doc.title,
                content: doc.content,
                caseId: doc.case?.caseId,
                caseName: doc.case?.title,
                hasChanges: false,
                createdBy: doc.uploadedBy,
                lastModified: doc.lastModified
            };
            
            setOpenDocuments(prev => [...prev, newDocument]);
            setActiveDocumentId(id);
            
            // Add to recent documents
            addToRecentDocuments(newDocument);
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
            
            // Create a new document based on the template
            const newDocument = {
                id: `new-${Date.now()}`, // Temporary ID for new document
                title: templateData.name,
                content: templateData.content || '',
                templateId: templateData.id,
                templateName: templateData.name,
                hasChanges: true,
                isNew: true
            };
            
            setOpenDocuments(prev => [...prev, newDocument]);
            setActiveDocumentId(newDocument.id);
        } catch (error) {
            console.error('Error loading template:', error);
            setError(t('smartEditor.errors.templateLoad'));
        } finally {
            setLoading(false);
        }
    };

    // Template selection handler

    const handleSelectTemplate = (template) => {
        const newId = `new-${Date.now()}`; // Temporary ID for new document

        // Check if a document with this templateId already exists
        if (openDocuments.some(doc => doc.templateId === template.id)) {
            // Just set the existing one as active
            const existingDoc = openDocuments.find(doc => doc.templateId === template.id);
            setActiveDocumentId(existingDoc.id);
            setShowTemplateDialog(false);
            return;
        }

        // Create a new document based on the template
        const newDocument = {
            id: newId,
            title: template.name,
            content: template.content || '',
            templateId: template.id,
            templateName: template.name,
            hasChanges: true,
            isNew: true
        };

        setOpenDocuments(prev => [...prev, newDocument]);
        setActiveDocumentId(newId);
        setShowTemplateDialog(false);
    };

    // Update document content
    const handleContentChange = (content) => {
        if (!activeDocumentId) return;
        
        setOpenDocuments(prevDocs => 
            prevDocs.map(doc => 
                doc.id === activeDocumentId 
                    ? { ...doc, content, hasChanges: true } 
                    : doc
            )
        );
    };

    // Update document title
    const handleTitleChange = (title) => {
        if (!activeDocumentId) return;

        // If title is empty, keep the previous title
        if (!title.trim() && activeDocument?.title) {
            return;
        }

        setOpenDocuments(prevDocs =>
            prevDocs.map(doc =>
                doc.id === activeDocumentId
                    ? { ...doc, title: title || t('smartEditor.untitledDocument'), hasChanges: true }
                    : doc
            )
        );
    };

    // Save active document
    // Update the handleSaveDocument function to properly handle ID changes without duplicating tabs
    const handleSaveDocument = async () => {
        if (!activeDocument) return;

        if (!activeDocument.title.trim()) {
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.titleRequired')
            });
            return;
        }

        setSaving(true);
        try {
            let result;
            let newId = activeDocument.id;
            const oldId = activeDocument.id; // Store old ID for reference

            // If it's a new document (not saved to server yet)
            if (activeDocument.isNew) {
                // Create new document
                result = await smartEditorService.saveDocument({
                    templateId: activeDocument.templateId,
                    title: activeDocument.title,
                    content: activeDocument.content,
                    lawFirmId: user?.lawFirmId,
                    caseId: activeDocument.caseId || location.state?.caseId
                });
                newId = result.documentId;

                // Update URL without reloading page
                navigate(`/documents/smarteditor/${newId}`, { replace: true });
            } else {
                // Update existing document
                result = await smartEditorService.updateDocument(activeDocument.id, {
                    title: activeDocument.title,
                    content: activeDocument.content
                });
            }

            // Update document in state - IMPORTANT: carefully handle the ID change
            setOpenDocuments(prevDocs => {
                // First, remove any document with the old ID
                const filteredDocs = prevDocs.filter(doc => doc.id !== oldId);

                // Then add the updated document with the new ID
                return [...filteredDocs, {
                    ...activeDocument,
                    id: newId,
                    hasChanges: false,
                    isNew: false,
                    lastModified: new Date()
                }];
            });

            // After updating the documents, update the active document ID
            setActiveDocumentId(newId);

            setNotification({
                type: 'success',
                message: t('smartEditor.notifications.saved')
            });

            // Add to recent documents
            addToRecentDocuments({
                id: newId,
                title: activeDocument.title,
                lastModified: new Date()
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

    // Export document
    const handleExportDocument = async (format = 'pdf') => {
        if (!activeDocument) return;

        try {
            // Save any unsaved changes first
            if (activeDocument.hasChanges) await handleSaveDocument();

            // Export document
            const result = await smartEditorService.exportDocument({
                documentId: activeDocument.isNew ? null : activeDocument.id,
                content: activeDocument.content,
                title: activeDocument.title,
                format
            });

            // Create download link
            const url = window.URL.createObjectURL(result);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${activeDocument.title}.${format}`;
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
        if (!activeDocument || !editorRef.current) return;

        const content = editorRef.current.getEditor().root.innerHTML;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <html>
            <head>
                <title>${activeDocument.title || 'Document'}</title>
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

    // Create new document from template
    const handleCreateNewDocument = () => {
        setShowTemplateDialog(true);
    };

    // Apply AI suggestion
    // Apply AI suggestion
    const handleApplyAISuggestion = (suggestion) => {
        if (!activeDocument || !editorRef.current) return;

        const editor = editorRef.current.getEditor();

        // Save the current selection to restore it later
        const currentSelection = editor.getSelection();

        // For full document replacements
        if (suggestion.original && suggestion.original.length > 100 &&
            suggestion.original.trim() === activeDocument.content.trim()) {
            // Use updateContents to properly register the change in history
            const delta = editor.clipboard.convert(suggestion.suggested);
            editor.setContents(delta, 'user');
            handleContentChange(suggestion.suggested);
            return;
        }

        // For partial replacements
        try {
            const text = editor.getText();
            const index = text.indexOf(suggestion.original);

            if (index !== -1) {
                // Use deleteText and insertText with 'user' source to register in history
                editor.deleteText(index, suggestion.original.length, 'user');
                editor.insertText(index, suggestion.suggested, 'user');

                // Update selection to end of inserted text
                editor.setSelection(index + suggestion.suggested.length, 0, 'user');

                // Update state with new content
                handleContentChange(editor.root.innerHTML);
            } else if (suggestion.original === '') {
                // For insertions (when original is empty)
                const position = currentSelection ? currentSelection.index : editor.getLength() - 1;
                editor.insertText(position, suggestion.suggested, 'user');
                editor.setSelection(position + suggestion.suggested.length, 0, 'user');
                handleContentChange(editor.root.innerHTML);
            } else {
                // Fallback - replace everything
                const delta = editor.clipboard.convert(suggestion.suggested);
                editor.setContents(delta, 'user');
                handleContentChange(suggestion.suggested);
            }
        } catch (error) {
            console.error("Error applying suggestion:", error);
        }
    };

    // Navigate back with confirmation if needed
    const handleNavBack = () => {
        // Check for unsaved changes
        const hasUnsavedChanges = openDocuments.some(doc => doc.hasChanges);
        
        if (hasUnsavedChanges && !window.confirm(t('smartEditor.unsavedChanges'))) {
            return;
        }
        
        navigate('/documents');
    };

    // Close document tab
    const handleCloseDocument = (documentId) => {
        // Get document to check if it has unsaved changes
        const docToClose = openDocuments.find(doc => doc.id === documentId);
        
        if (docToClose?.hasChanges && !window.confirm(t('smartEditor.closeUnsaved'))) {
            return;
        }
        
        // Remove document from open documents
        setOpenDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        // Update active document if needed
        if (activeDocumentId === documentId) {
            const remainingDocs = openDocuments.filter(doc => doc.id !== documentId);
            if (remainingDocs.length > 0) {
                setActiveDocumentId(remainingDocs[0].id);
            } else {
                setActiveDocumentId(null);
            }
        }
    };

    // Activate document tab
    const handleActivateDocument = (documentId) => {
        setActiveDocumentId(documentId);
    };

    // Load recent documents
    const loadRecentDocuments = async () => {
        setHistoryLoading(true);
        try {
            // Try to load from local storage first
            const storedRecent = localStorage.getItem('recentDocuments');
            if (storedRecent) {
                setRecentDocuments(JSON.parse(storedRecent));
            }
            
            // Then load from server
            const recentDocs = await smartEditorService.getRecentDocuments();
            if (recentDocs && recentDocs.length > 0) {
                setRecentDocuments(recentDocs);
                // Update local storage
                localStorage.setItem('recentDocuments', JSON.stringify(recentDocs));
            }
        } catch (error) {
            console.error('Error loading recent documents:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Add document to recent documents
    const addToRecentDocuments = (document) => {
        const newRecent = [
            {
                id: document.id,
                title: document.title,
                lastModified: document.lastModified || new Date(),
                caseId: document.caseId,
                caseName: document.caseName
            },
            // Keep existing documents but remove this one if it already exists
            ...recentDocuments.filter(doc => doc.id !== document.id)
        ].slice(0, 10); // Keep only 10 most recent
        
        setRecentDocuments(newRecent);
        // Update local storage
        localStorage.setItem('recentDocuments', JSON.stringify(newRecent));
    };

    // Load document context (case, client, related documents)
    const loadDocumentContext = async (caseId) => {
        if (!caseId) return;
        
        setContextLoading(true);
        try {
            // Load case data
            const caseData = await caseService.getCaseById(caseId);
            setCaseData(caseData);
            
            // Load client data if available
            if (caseData.clients && caseData.clients.length > 0) {
                const clientId = caseData.clients[0].clientId;
                const clientData = await clientService.getClientById(clientId);
                setClientData(clientData);
            }
            
            // Load related documents
            const documents = await caseService.getCaseDocuments(caseId);
            setRelatedDocuments(documents);
        } catch (error) {
            console.error('Error loading document context:', error);
        } finally {
            setContextLoading(false);
        }
    };

    // Generate document outline
    const generateDocumentOutline = (content) => {
        if (!content) return [];
        
        // Extract headings from the content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const headings = [];
        const headingTags = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingTags.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            headings.push({
                id: `heading-${index}`,
                text: heading.textContent,
                level: level
            });
        });
        
        setDocumentOutline(headings);
    };

    // Jump to heading in document
    const jumpToHeading = (index) => {
        if (!editorRef.current) return;
        
        const editor = editorRef.current.getEditor();
        const content = editor.getText();
        
        const heading = documentOutline[index];
        if (!heading) return;
        
        // Find position of this heading in text
        const text = editor.getText();
        const position = text.indexOf(heading.text);
        
        if (position >= 0) {
            // Set focus and selection
            editor.focus();
            editor.setSelection(position, heading.text.length);
            
            // Scroll to position
            const editorBounds = editor.container.getBoundingClientRect();
            const scrollContainer = editor.container.closest('.ql-container');
            if (scrollContainer) {
                scrollContainer.scrollTop = position * (editorBounds.height / editor.getLength());
            }
        }
    };

    // Compare documents
    const handleCompareDocuments = async () => {
        if (!compareDocumentId || !activeDocumentId) return;
        
        try {
            // Get the document to compare
            const docToCompare = await smartEditorService.getDocumentById(compareDocumentId);
            
            // Create a diff and display it
            // This would require a diff library implementation
            // For now, we'll just show a notification
            setNotification({
                type: 'info',
                message: t('smartEditor.notImplemented')
            });
            
            setShowCompareDialog(false);
        } catch (error) {
            console.error('Error comparing documents:', error);
            setNotification({
                type: 'error',
                message: t('smartEditor.errors.compareDocuments')
            });
        }
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

    // Render document tabs
    const renderDocumentTabs = () => (
        <Box sx={{ 
            display: 'flex', 
            overflow: 'auto', 
            borderBottom: 1, 
            borderColor: 'divider',
            '&::-webkit-scrollbar': {
                height: '8px'
            },
            '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.05)'
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px'
            }
        }}>
            <Tabs
                value={activeDocumentId || false}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                    minHeight: 48,
                    flex: 1,
                    '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main'
                    }
                }}
            >
                {openDocuments.map(doc => (
                    <DocumentTab
                        key={doc.id}
                        document={doc}
                        isActive={doc.id === activeDocumentId}
                        onActivate={() => handleActivateDocument(doc.id)}
                        onClose={handleCloseDocument}
                    />
                ))}
            </Tabs>
            
            <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateNewDocument}
                sx={{ 
                    minWidth: 'auto',
                    m: 0.5
                }}
            >
                {isMobile ? '' : t('smartEditor.newTab')}
            </Button>
        </Box>
    );

    // Render main content
    const renderMainContent = () => (
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
            {/* Document Context Panel - Left Sidebar */}
            {showDocumentContext && (
                <Paper
                    elevation={0}
                    sx={{
                        width: 300,
                        borderRight: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ 
                        p: 2, 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6">{t('smartEditor.documentContext')}</Typography>
                        {isMobile && (
                            <IconButton size="small" onClick={() => setShowDocumentContext(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                        {contextLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <>
                                {/* Case Information */}
                                <List disablePadding>
                                    <ListItem>
                                        <ListItemIcon><GavelIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary={t('smartEditor.caseInformation')}
                                            secondary={caseData?.title || t('smartEditor.noCaseAssociated')}
                                        />
                                    </ListItem>
                                    
                                    {caseData && (
                                        <Collapse in={true}>
                                            <List disablePadding dense>
                                                <ListItem sx={{ pl: 4 }}>
                                                    <ListItemText 
                                                        primary={t('smartEditor.caseNumber')}
                                                        secondary={caseData.caseNumber}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                                <ListItem sx={{ pl: 4 }}>
                                                    <ListItemText 
                                                        primary={t('smartEditor.caseStatus')}
                                                        secondary={caseData.status}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Collapse>
                                    )}
                                </List>
                                
                                <Divider />
                                
                                {/* Client Information */}
                                <List disablePadding>
                                    <ListItem>
                                        <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary={t('smartEditor.clientInformation')}
                                            secondary={
                                                clientData 
                                                    ? `${clientData.firstName} ${clientData.lastName}`
                                                    : t('smartEditor.noClientAssociated')
                                            }
                                        />
                                    </ListItem>
                                    
                                    {clientData && (
                                        <Collapse in={true}>
                                            <List disablePadding dense>
                                                <ListItem sx={{ pl: 4 }}>
                                                    <ListItemText 
                                                        primary={t('smartEditor.email')}
                                                        secondary={clientData.email}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                                <ListItem sx={{ pl: 4 }}>
                                                    <ListItemText 
                                                        primary={t('smartEditor.phone')}
                                                        secondary={clientData.phone}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Collapse>
                                    )}
                                </List>
                                
                                <Divider />
                                
                                {/* Document Outline */}
                                <List disablePadding>
                                    <ListItem button onClick={() => setShowOutline(!showOutline)}>
                                        <ListItemIcon><BookmarkIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary={t('smartEditor.documentOutline')} />
                                        {showOutline ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </ListItem>
                                    
                                    {showOutline && (
                                        <Collapse in={true}>
                                            <List disablePadding dense>
                                                {documentOutline.length > 0 ? (
                                                    documentOutline.map((heading, index) => (
                                                        <ListItem 
                                                            key={heading.id}
                                                            button
                                                            onClick={() => jumpToHeading(index)}
                                                            sx={{ 
                                                                pl: 1 + heading.level,
                                                                py: 0.5
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 24 }}>
                                                                <BookmarkOutlineIcon 
                                                                    fontSize="small" 
                                                                    sx={{ fontSize: `${Math.max(16 - heading.level, 12)}px` }}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={heading.text}
                                                                primaryTypographyProps={{ 
                                                                    variant: 'caption',
                                                                    sx: { 
                                                                        fontWeight: heading.level === 1 ? 'bold' : 'normal',
                                                                        fontSize: `${Math.max(14 - heading.level, 11)}px`
                                                                    }
                                                                }}
                                                            />
                                                        </ListItem>
                                                    ))
                                                ) : (
                                                    <ListItem sx={{ pl: 4 }}>
                                                        <ListItemText 
                                                            primary={t('smartEditor.noHeadings')}
                                                            primaryTypographyProps={{ 
                                                                variant: 'caption',
                                                                color: 'text.secondary' 
                                                            }}
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </Collapse>
                                    )}
                                </List>
                                
                                <Divider />
                                
                                {/* Related Documents */}
                                <List disablePadding>
                                    <ListItem>
                                        <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary={t('smartEditor.relatedDocuments')} />
                                    </ListItem>
                                    
                                    {relatedDocuments.length > 0 ? (
                                        relatedDocuments.slice(0, 5).map(doc => (
                                            <ListItem 
                                                key={doc.documentId}
                                                button
                                                onClick={() => loadExistingDocument(doc.documentId)}
                                                sx={{ pl: 4 }}
                                                dense
                                            >
                                                <ListItemIcon sx={{ minWidth: 24 }}>
                                                    <InsertDriveFile fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={doc.title}
                                                    primaryTypographyProps={{ 
                                                        variant: 'caption',
                                                        noWrap: true
                                                    }}
                                                />
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem sx={{ pl: 4 }}>
                                            <ListItemText 
                                                primary={t('smartEditor.noRelatedDocuments')}
                                                primaryTypographyProps={{ 
                                                    variant: 'caption',
                                                    color: 'text.secondary' 
                                                }}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Document Editor - Center */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: 'background.default' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                {activeDocument ? (
                    <>
                        {/* Breadcrumb Navigation */}
                        <Breadcrumbs sx={{ mb: 2 }}>
                            <Link color="inherit" onClick={handleNavBack} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <FolderIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {t('smartEditor.documents')}
                            </Link>
                            {activeDocument.caseName && (
                                <Link color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <GavelIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    {activeDocument.caseName}
                                </Link>
                            )}
                            <Typography color="text.primary">{activeDocument.title || t('smartEditor.untitledDocument')}</Typography>
                        </Breadcrumbs>

                        {/* Editor Toolbar */}
                        <EditorToolbar editorRef={editorRef} />

                        {/* Document Editor */}
                        <Paper
                            elevation={2}
                            sx={{
                                maxWidth: '8.5in',
                                minHeight: '11in',
                                mx: 'auto',
                                backgroundColor: 'background.paper',
                                boxShadow: 3
                            }}
                        >
                            <DocumentEditor
                                ref={editorRef}
                                content={activeDocument.content}
                                onChange={handleContentChange}
                            />
                        </Paper>
                    </>
                ) : (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '80%'
                    }}>
                        <InsertDriveFile sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {t('smartEditor.noDocumentOpen')}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateNewDocument}
                            sx={{ mt: 2 }}
                        >
                            {t('smartEditor.createNew')}
                        </Button>
                        
                        {recentDocuments.length > 0 && (
                            <Box sx={{ mt: 4, width: '100%', maxWidth: 500 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {t('smartEditor.recentDocuments')}:
                                </Typography>
                                <Grid container spacing={1}>
                                    {recentDocuments.slice(0, 6).map(doc => (
                                        <Grid item xs={12} sm={6} key={doc.id}>
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 1,
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    }
                                                }}
                                                onClick={() => loadExistingDocument(doc.id)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <InsertDriveFile fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="body2" noWrap>{doc.title}</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(doc.lastModified).toLocaleDateString()}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* AI Assistant Panel - Right */}
            {showAIPanel && (
                <Paper
                    sx={{
                        width: 550,
                        maxWidth: isMobile ? '100%' : 550,
                        overflowY: 'auto',
                        borderLeft: 1,
                        borderColor: 'divider'
                    }}
                >
                    <AIAssistantPanel
                        documentContent={activeDocument?.content || ''}
                        onApplySuggestion={handleApplyAISuggestion}
                        onClose={() => setShowAIPanel(false)}
                    />
                </Paper>
            )}
        </Box>
    );

    return (
        <DocumentsContext.Provider value={{ 
            openDocuments, 
            activeDocument, 
            setActiveDocumentId,
            handleContentChange,
            handleTitleChange
        }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Top App Bar */}
                <AppBar position="static" color="default" elevation={1}>
                    <Toolbar variant="dense">
                        <IconButton edge="start" color="inherit" onClick={handleNavBack} sx={{ mr: 1 }}>
                            <BackIcon />
                        </IconButton>

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {activeDocument && (
                                <TextField
                                    value={activeDocument.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    onBlur={() => {
                                        // Validate title on blur - don't allow empty titles
                                        if (!activeDocument.title.trim()) {
                                            handleTitleChange('Untitled Document');
                                            setNotification({
                                                type: 'warning',
                                                message: t('smartEditor.errors.titleRequired')
                                            });
                                        }
                                    }}
                                    variant="standard"
                                    placeholder={t('smartEditor.untitledDocument')}
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: {
                                            fontSize: '1.2rem',
                                            fontWeight: 500,
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderRadius: 1,
                                                px: 1
                                            },
                                            '&:focus-within': {
                                                backgroundColor: 'action.selected',
                                                borderRadius: 1,
                                                px: 1
                                            }
                                        }
                                    }}
                                    sx={{
                                        minWidth: 200,
                                        maxWidth: 400
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{ flexGrow: 1 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {activeDocument && (
                                <>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                        onClick={handleSaveDocument}
                                        disabled={saving || !activeDocument.hasChanges}
                                    >
                                        {saving ? t('common.saving') : 
                                            activeDocument.isNew ? t('common.save') : t('common.update')}
                                    </Button>

                                    <Tooltip title={t('smartEditor.documentContext')}>
                                        <IconButton
                                            color="inherit"
                                            onClick={() => setShowDocumentContext(!showDocumentContext)}
                                            sx={{
                                                bgcolor: showDocumentContext ? 'action.selected' : 'transparent'
                                            }}
                                        >
                                            <FolderIcon />
                                        </IconButton>
                                    </Tooltip>

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

                                    <Tooltip title={t('smartEditor.documentHistory')}>
                                        <IconButton
                                            color="inherit"
                                            onClick={() => setShowHistory(!showHistory)}
                                        >
                                            <HistoryIcon />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}

                            <IconButton onClick={openMenu}>
                                <MoreIcon />
                            </IconButton>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Document Tabs */}
                {renderDocumentTabs()}

                {/* Main Content */}
                {renderMainContent()}

                {/* Template Selection Dialog */}
                <TemplateSelectionDialog
                    open={showTemplateDialog}
                    onClose={() => setShowTemplateDialog(false)}
                    onSelect={handleSelectTemplate}
                />

                {/* Document History Drawer */}
                <Drawer
                    anchor="right"
                    open={showHistory}
                    onClose={() => setShowHistory(false)}
                >
                    <Box sx={{ maxWidth: 650, p: 2 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography variant="h6">{t('smartEditor.recentDocuments')}</Typography>
                            <IconButton size="small" onClick={() => setShowHistory(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        
                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List>
                                {recentDocuments.length > 0 ? (
                                    recentDocuments.map(doc => (
                                        <ListItem 
                                            key={doc.id}
                                            button
                                            onClick={() => {
                                                loadExistingDocument(doc.id);
                                                setShowHistory(false);
                                            }}
                                        >
                                            <ListItemIcon>
                                                <InsertDriveFile />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={doc.title}
                                                secondary={
                                                    <>
                                                        {doc.caseName && (
                                                            <Chip 
                                                                label={doc.caseName} 
                                                                size="small" 
                                                                variant="outlined"
                                                                sx={{ mr: 1 }}
                                                            />
                                                        )}
                                                        {new Date(doc.lastModified).toLocaleDateString()}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography color="text.secondary">
                                        {t('smartEditor.noRecentDocuments')}
                                    </Typography>
                                )}
                            </List>
                        )}
                        
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={loadRecentDocuments}
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            {t('smartEditor.refreshHistory')}
                        </Button>
                    </Box>
                </Drawer>

                {/* Document Compare Dialog */}
                <Dialog
                    open={showCompareDialog}
                    onClose={() => setShowCompareDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>{t('smartEditor.compareDocuments')}</DialogTitle>
                    <DialogContent dividers>
                        <Typography paragraph>
                            {t('smartEditor.selectDocumentToCompare')}
                        </Typography>
                        
                        <Box sx={{ my: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('smartEditor.selectDocument')}</InputLabel>
                                <Select
                                    value={compareDocumentId || ''}
                                    onChange={(e) => setCompareDocumentId(e.target.value)}
                                    label={t('smartEditor.selectDocument')}
                                >
                                    {recentDocuments
                                        .filter(doc => doc.id !== activeDocumentId)
                                        .map(doc => (
                                            <MenuItem key={doc.id} value={doc.id}>
                                                {doc.title}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCompareDialog(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCompareDocuments}
                            disabled={!compareDocumentId}
                        >
                            {t('smartEditor.compare')}
                        </Button>
                    </DialogActions>
                </Dialog>

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
                    <MenuItem onClick={() => { setShowCompareDialog(true); closeMenu(); }}>
                        <CompareIcon fontSize="small" sx={{ mr: 1 }} />
                        {t('smartEditor.menu.compareDocuments')}
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
        </DocumentsContext.Provider>
    );
};

export default SmartEditorPage;