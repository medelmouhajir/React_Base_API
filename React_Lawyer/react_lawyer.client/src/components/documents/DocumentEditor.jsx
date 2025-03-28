// src/components/documents/DocumentEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    Toolbar,
    IconButton,
    Tooltip,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Save as SaveIcon,
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    FormatUnderlined as UnderlinedIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignRight as AlignRightIcon,
    FormatListBulleted as BulletListIcon,
    FormatListNumbered as NumberedListIcon,
    FormatIndentIncrease as IndentIncreaseIcon,
    FormatIndentDecrease as IndentDecreaseIcon,
    LocalPrintshop as PrintIcon,
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import documentService from '../../services/documentService';
import PageHeader from '../common/PageHeader';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Document types available in the app
const DOCUMENT_TYPES = [
    { value: 'LETTER', label: 'Letter' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'PLEADING', label: 'Pleading' },
    { value: 'MOTION', label: 'Motion' },
    { value: 'AGREEMENT', label: 'Agreement' },
    { value: 'MEMO', label: 'Memo' },
    { value: 'OTHER', label: 'Other' }
];

// Templates that could be loaded (simplified for example)
const TEMPLATES = {
    LETTER: `<h1>Law Firm Letterhead</h1>
<p>Date: [Current Date]</p>
<p>
[Recipient Name]<br>
[Recipient Address]<br>
[City, State ZIP]
</p>
<p>Dear [Recipient],</p>
<p>Body of the letter goes here...</p>
<p>Sincerely,</p>
<p>
[Attorney Name]<br>
[Law Firm Name]
</p>`,

    CONTRACT: `<h1>CONTRACT AGREEMENT</h1>
<p>This Agreement made and entered into on [Date], by and between:</p>
<p><strong>PARTY A:</strong> [Name], hereafter referred to as "Client"</p>
<p><strong>PARTY B:</strong> [Law Firm Name], hereafter referred to as "Attorney"</p>
<h2>RECITALS</h2>
<p>WHEREAS, the parties wish to...</p>
<h2>TERMS AND CONDITIONS</h2>
<ol>
  <li>Term of Agreement</li>
  <li>Services Provided</li>
  <li>Compensation</li>
  <li>Confidentiality</li>
  <li>Termination</li>
</ol>
<p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.</p>
<p>
[CLIENT SIGNATURE]<br>
[ATTORNEY SIGNATURE]
</p>`
};

const DocumentEditor = () => {
    const { id } = useParams(); // Get document ID if editing an existing document
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const editorRef = useRef(null);

    // Document metadata
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('OTHER');
    const [caseId, setCaseId] = useState('');
    const [clientId, setClientId] = useState('');
    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);

    // Editor state
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    // Fetch data when component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch clients and cases for dropdown selectors
                const clientsData = await documentService.getClients();
                const casesData = await documentService.getCases();

                setClients(clientsData);
                setCases(casesData);

                // If editing an existing document, fetch its data
                if (id) {
                    const document = await documentService.getDocumentById(id);
                    if (document) {
                        setTitle(document.title);
                        setDocumentType(document.documentType);
                        setCaseId(document.caseId || '');
                        setClientId(document.clientId || '');

                        // Convert saved content to editor state
                        let contentState;
                        if (document.content) {
                            if (typeof document.content === 'string') {
                                // If content is HTML string
                                contentState = stateFromHTML(document.content);
                            } else {
                                // If content is stored as Draft.js raw content
                                contentState = convertFromRaw(document.content);
                            }
                            setEditorState(EditorState.createWithContent(contentState));
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading document data:', err);
                setError('Failed to load document data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Handle loading a template
    const handleLoadTemplate = () => {
        if (documentType && TEMPLATES[documentType]) {
            const contentState = stateFromHTML(TEMPLATES[documentType]);
            setEditorState(EditorState.createWithContent(contentState));
        }
    };

    // Handle editor state changes
    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
    };

    // Handle keyboard shortcuts
    const handleKeyCommand = (command) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            handleEditorChange(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    // Toggle block type (e.g., heading, lists)
    const toggleBlockType = (blockType) => {
        handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
    };

    // Toggle inline style (e.g., bold, italic)
    const toggleInlineStyle = (inlineStyle) => {
        handleEditorChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    };

    // Focus the editor
    const focusEditor = () => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    // Handle saving the document
    const handleSaveDocument = async (e) => {
        e.preventDefault();

        if (!title) {
            setError('Please enter a document title');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Document will be saved locally until connection is restored.');
            // In a real app, you'd implement local storage saving here
            return;
        }

        try {
            setSaving(true);

            // Convert editor content for saving
            const contentState = editorState.getCurrentContent();
            const rawContent = convertToRaw(contentState);
            const htmlContent = stateToHTML(contentState);

            const documentData = {
                title,
                documentType,
                caseId: caseId || null,
                clientId: clientId || null,
                content: rawContent, // Store as raw content for future editing
                htmlContent: htmlContent, // Store HTML for display/export
                lastModified: new Date().toISOString()
            };

            let result;
            if (id) {
                // Update existing document
                result = await documentService.updateDocument(id, documentData);
                setSuccess('Document updated successfully');
            } else {
                // Create new document
                result = await documentService.createDocument(documentData);
                setSuccess('Document created successfully');
                // Navigate to the new document
                navigate(`/documents/${result.documentId}`);
            }
        } catch (err) {
            console.error('Error saving document:', err);
            setError('Failed to save document. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Export document as PDF
    const handleExportPdf = async () => {
        if (!title) {
            setError('Please save the document before exporting');
            return;
        }

        try {
            const contentState = editorState.getCurrentContent();
            const htmlContent = stateToHTML(contentState);

            // In a real implementation, you would call a server endpoint to generate PDF
            await documentService.exportToPdf(id || 'temp', htmlContent, title);
            setSuccess('Document exported to PDF successfully');
        } catch (err) {
            console.error('Error exporting to PDF:', err);
            setError('Failed to export document. Please try again.');
        }
    };

    // Export document as DOCX
    const handleExportDocx = async () => {
        if (!title) {
            setError('Please save the document before exporting');
            return;
        }

        try {
            const contentState = editorState.getCurrentContent();
            const htmlContent = stateToHTML(contentState);

            // In a real implementation, you would call a server endpoint to generate DOCX
            await documentService.exportToDocx(id || 'temp', htmlContent, title);
            setSuccess('Document exported to DOCX successfully');
        } catch (err) {
            console.error('Error exporting to DOCX:', err);
            setError('Failed to export document. Please try again.');
        }
    };

    // Handle printing the document
    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            <PageHeader
                title={id ? 'Edit Document' : 'Create New Document'}
                subtitle="Create or modify legal documents"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Documents', link: '/documents' },
                    { text: id ? 'Edit Document' : 'Create Document' }
                ]}
                action={!loading}
                actionText="Save Document"
                actionIcon={<SaveIcon />}
                onActionClick={handleSaveDocument}
            />

            <Grid container spacing={3}>
                {/* Document Metadata */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Document Information</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Document Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={loading || saving}
                                    placeholder="Enter document title"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Document Type</InputLabel>
                                    <Select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        disabled={loading || saving}
                                        label="Document Type"
                                    >
                                        {DOCUMENT_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Related Case</InputLabel>
                                    <Select
                                        value={caseId}
                                        onChange={(e) => setCaseId(e.target.value)}
                                        disabled={loading || saving}
                                        label="Related Case"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {cases.map((caseItem) => (
                                            <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                                {caseItem.title} ({caseItem.caseNumber})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Related Client</InputLabel>
                                    <Select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        disabled={loading || saving}
                                        label="Related Client"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {clients.map((client) => (
                                            <MenuItem key={client.clientId} value={client.clientId}>
                                                {client.firstName} {client.lastName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    onClick={handleLoadTemplate}
                                    disabled={!documentType || !TEMPLATES[documentType] || loading || saving}
                                >
                                    Load Template
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Document Editor */}
                <Grid item xs={12}>
                    <Paper
                        sx={{
                            p: 2,
                            minHeight: '500px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Editor Toolbar */}
                        <Toolbar
                            variant="dense"
                            sx={{
                                backgroundColor: 'background.paper',
                                borderBottom: 1,
                                borderColor: 'divider',
                                mb: 2
                            }}
                        >
                            <Tooltip title="Bold">
                                <IconButton
                                    onClick={() => toggleInlineStyle('BOLD')}
                                    color={editorState.getCurrentInlineStyle().has('BOLD') ? 'primary' : 'default'}
                                >
                                    <BoldIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Italic">
                                <IconButton
                                    onClick={() => toggleInlineStyle('ITALIC')}
                                    color={editorState.getCurrentInlineStyle().has('ITALIC') ? 'primary' : 'default'}
                                >
                                    <ItalicIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Underline">
                                <IconButton
                                    onClick={() => toggleInlineStyle('UNDERLINE')}
                                    color={editorState.getCurrentInlineStyle().has('UNDERLINE') ? 'primary' : 'default'}
                                >
                                    <UnderlinedIcon />
                                </IconButton>
                            </Tooltip>

                            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                            <Tooltip title="Align Left">
                                <IconButton onClick={() => toggleBlockType('left-align')}>
                                    <AlignLeftIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Align Center">
                                <IconButton onClick={() => toggleBlockType('center-align')}>
                                    <AlignCenterIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Align Right">
                                <IconButton onClick={() => toggleBlockType('right-align')}>
                                    <AlignRightIcon />
                                </IconButton>
                            </Tooltip>

                            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                            <Tooltip title="Bullet List">
                                <IconButton
                                    onClick={() => toggleBlockType('unordered-list-item')}
                                >
                                    <BulletListIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Numbered List">
                                <IconButton
                                    onClick={() => toggleBlockType('ordered-list-item')}
                                >
                                    <NumberedListIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Increase Indent">
                                <IconButton onClick={() => toggleBlockType('indent')}>
                                    <IndentIncreaseIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Decrease Indent">
                                <IconButton onClick={() => toggleBlockType('outdent')}>
                                    <IndentDecreaseIcon />
                                </IconButton>
                            </Tooltip>

                            <Box sx={{ flexGrow: 1 }} />

                            <Tooltip title="Print Document">
                                <IconButton onClick={handlePrint}>
                                    <PrintIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Export as PDF">
                                <IconButton onClick={handleExportPdf}>
                                    <PdfIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Export as DOCX">
                                <IconButton onClick={handleExportDocx}>
                                    <DocIcon />
                                </IconButton>
                            </Tooltip>
                        </Toolbar>

                        {/* Editor Content Area */}
                        <Box
                            sx={{
                                border: '1px solid #ccc',
                                borderRadius: 1,
                                minHeight: '400px',
                                p: 2,
                                flexGrow: 1,
                                '& .DraftEditor-root': {
                                    height: '100%'
                                }
                            }}
                            onClick={focusEditor}
                        >
                            {loading ? (
                                <Typography>Loading document...</Typography>
                            ) : (
                                <Editor
                                    ref={editorRef}
                                    editorState={editorState}
                                    onChange={handleEditorChange}
                                    handleKeyCommand={handleKeyCommand}
                                    placeholder="Start typing your document here..."
                                />
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => navigate('/documents')}
                        >
                            Cancel
                        </Button>

                        <Box>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveDocument}
                                disabled={loading || saving || !isOnline}
                                sx={{ mr: 2 }}
                            >
                                {saving ? 'Saving...' : 'Save Document'}
                            </Button>

                            {id && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => {
                                        // In a real app, add confirmation dialog
                                        if (window.confirm('Are you sure you want to delete this document?')) {
                                            documentService.deleteDocument(id)
                                                .then(() => {
                                                    navigate('/documents');
                                                })
                                                .catch(err => {
                                                    console.error('Error deleting document:', err);
                                                    setError('Failed to delete document. Please try again.');
                                                });
                                        }
                                    }}
                                    disabled={loading || saving}
                                >
                                    Delete
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentEditor;