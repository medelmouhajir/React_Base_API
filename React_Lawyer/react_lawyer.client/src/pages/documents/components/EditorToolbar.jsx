// src/pages/documents/components/EditorToolbar.jsx
import React, { useState } from 'react';
import {
    Paper,
    Box,
    Divider,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    Popover,
    ToggleButton,
    ToggleButtonGroup,
    InputBase
} from '@mui/material';
import {
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    FormatUnderlined as UnderlineIcon,
    FormatStrikethrough as StrikethroughIcon,
    FormatColorText as TextColorIcon,
    FormatColorFill as BackgroundColorIcon,
    FormatListBulleted as BulletListIcon,
    FormatListNumbered as NumberedListIcon,
    FormatIndentIncrease as IndentIcon,
    FormatIndentDecrease as OutdentIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignRight as AlignRightIcon,
    FormatAlignJustify as AlignJustifyIcon,
    Link as LinkIcon,
    InsertPhoto as ImageIcon,
    TableChart as TableIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Code as CodeIcon,
    FormatQuote as QuoteIcon,
    FormatClear as ClearFormatIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { useTranslation } from 'react-i18next';

// Font sizes in points
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96];

// Font families
const FONT_FAMILIES = [
    { name: 'Sans Serif', value: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" },
    { name: 'Serif', value: "'Georgia', 'Times New Roman', serif" },
    { name: 'Monospace', value: "'Monaco', 'Courier New', monospace" },
    { name: 'Calibri', value: "'Calibri', 'Roboto', sans-serif" },
    { name: 'Times New Roman', value: "'Times New Roman', serif" },
    { name: 'Arial', value: "'Arial', sans-serif" }
];

// Heading styles
const HEADING_STYLES = [
    { name: 'Normal Text', value: '' },
    { name: 'Heading 1', value: '1' },
    { name: 'Heading 2', value: '2' },
    { name: 'Heading 3', value: '3' },
    { name: 'Heading 4', value: '4' },
    { name: 'Heading 5', value: '5' },
    { name: 'Heading 6', value: '6' }
];

const EditorToolbar = ({ editorRef }) => {
    const { t } = useTranslation();

    // State for formatting
    const [formats, setFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        align: 'left',
        list: '',
        fontSize: 12,
        fontFamily: FONT_FAMILIES[0].value,
        headingStyle: ''
    });

    // Color picker state
    const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
    const [colorPickerType, setColorPickerType] = useState('text'); // 'text' or 'background'
    const [currentColor, setCurrentColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');

    // Table insert dialog state
    const [tableDialogAnchor, setTableDialogAnchor] = useState(null);
    const [tableSize, setTableSize] = useState({ rows: 2, cols: 2 });

    // Link dialog state
    const [linkDialogAnchor, setLinkDialogAnchor] = useState(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    // Calculate selected formats from the editor
    const updateFormats = () => {
        if (!editorRef || !editorRef.current) return;

        const editor = editorRef.current.getEditor();
        if (!editor) return;

        const selection = editor.getSelection();
        if (selection) {
            const format = editor.getFormat(selection);
            setFormats({
                bold: !!format.bold,
                italic: !!format.italic,
                underline: !!format.underline,
                strike: !!format.strike,
                align: format.align || 'left',
                list: format.list || '',
                fontSize: format.size || 12,
                fontFamily: format.font || FONT_FAMILIES[0].value,
                headingStyle: format.header || ''
            });
        }
    };

    // Apply text formatting
    const applyFormat = (format, value) => {
        if (!editorRef || !editorRef.current) return;
        editorRef.current.applyFormat(format, value);

        // Update local state for toggle buttons
        setFormats(prev => ({
            ...prev,
            [format]: value === undefined ? !prev[format] : value
        }));
    };

    // Handle text alignment change
    const handleAlignChange = (event, newAlignment) => {
        console.log('Alignment changed:', newAlignment);
        if (newAlignment !== null) {
            applyFormat('align', newAlignment);
            setFormats(prev => ({ ...prev, align: newAlignment }));
        }
    };

    // Handle heading style change
    const handleHeadingChange = (event) => {
        const headingValue = event.target.value;
        applyFormat('header', headingValue === '' ? false : parseInt(headingValue));
        setFormats(prev => ({ ...prev, headingStyle: headingValue }));
    };

    // Handle font family change
    const handleFontFamilyChange = (event) => {
        const fontFamily = event.target.value;
        applyFormat('font', fontFamily);
        setFormats(prev => ({ ...prev, fontFamily }));
    };

    // Handle font size change
    const handleFontSizeChange = (event) => {
        const fontSize = event.target.value;
        applyFormat('size', fontSize);
        setFormats(prev => ({ ...prev, fontSize }));
    };

    // Open color picker
    const openColorPicker = (type, event) => {
        setColorPickerType(type);
        setColorPickerAnchor(event.currentTarget);
        setCurrentColor(type === 'text' ? currentColor : backgroundColor);
    };

    // Close color picker
    const closeColorPicker = () => {
        setColorPickerAnchor(null);
    };

    // Apply color
    const applyColor = (color) => {
        const hexColor = color.hex;
        if (colorPickerType === 'text') {
            applyFormat('color', hexColor);
            setCurrentColor(hexColor);
        } else {
            applyFormat('background', hexColor);
            setBackgroundColor(hexColor);
        }
    };

    // Insert link
    const handleInsertLink = () => {
        if (!editorRef || !editorRef.current) return;

        const editor = editorRef.current.getEditor();
        if (!editor) return;

        // Get the currently selected text
        const selection = editor.getSelection();
        let selectedText = '';

        if (selection && selection.length > 0) {
            selectedText = editor.getText(selection.index, selection.length);
            setLinkText(selectedText);
        }

        setLinkDialogAnchor(document.getElementById('link-button'));
    };

    // Apply link
    const applyLink = () => {
        if (!editorRef || !editorRef.current || !linkUrl) return;

        const editor = editorRef.current.getEditor();
        if (!editor) return;

        const selection = editor.getSelection();

        if (selection && selection.length > 0) {
            // Apply link to selected text
            editor.formatText(selection.index, selection.length, 'link', linkUrl);
        } else if (linkText) {
            // Insert new text with link
            const index = selection ? selection.index : editor.getLength() - 1;
            editor.insertText(index, linkText, 'link', linkUrl);
        }

        // Reset and close dialog
        setLinkUrl('');
        setLinkText('');
        setLinkDialogAnchor(null);
    };

    // Open table insert dialog
    const openTableDialog = (event) => {
        setTableDialogAnchor(event.currentTarget);
    };

    // Close table insert dialog
    const closeTableDialog = () => {
        setTableDialogAnchor(null);
    };

    // Insert table
    const insertTable = () => {
        if (!editorRef || !editorRef.current) return;

        const editor = editorRef.current.getEditor();
        if (!editor) return;

        // Get current selection
        const range = editor.getSelection();
        const index = range ? range.index : 0;

        // Create table HTML
        let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
        for (let r = 0; r < tableSize.rows; r++) {
            tableHTML += '<tr>';
            for (let c = 0; c < tableSize.cols; c++) {
                tableHTML += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px; height: 20px;"></td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table><p><br></p>';

        // Insert table at selection
        editor.clipboard.dangerouslyPasteHTML(index, tableHTML);

        // Close dialog
        closeTableDialog();
    };

    // Undo/Redo
    const handleUndo = () => {
        if (!editorRef || !editorRef.current) return;
        const editor = editorRef.current.getEditor();
        if (editor) {
            editor.history.undo();
        }
    };

    const handleRedo = () => {
        if (!editorRef || !editorRef.current) return;
        const editor = editorRef.current.getEditor();
        if (editor) {
            editor.history.redo();
        }
    };

    // Clear formatting
    const clearFormatting = () => {
        if (!editorRef || !editorRef.current) return;
        editorRef.current.clearFormat();
    };

    return (
        <Paper
            elevation={0}
            sx={{
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                flexWrap: 'wrap',
                p: 0.5,
                gap: 0.5,
                alignItems: 'center',
                overflowX: 'auto'
            }}
        >
            {/* Undo/Redo */}
            <Box sx={{ display: 'flex' }}>
                <Tooltip title={t('editor.undo')}>
                    <IconButton size="small" onClick={handleUndo}>
                        <UndoIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.redo')}>
                    <IconButton size="small" onClick={handleRedo}>
                        <RedoIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Text Style */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                <Select
                    value={formats.headingStyle}
                    onChange={handleHeadingChange}
                    displayEmpty
                    size="small"
                    sx={{ fontSize: '0.875rem', minWidth: 120 }}
                >
                    {HEADING_STYLES.map((style) => (
                        <MenuItem key={style.value} value={style.value}>
                            {style.name}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* Font Family */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                <Select
                    value={formats.fontFamily}
                    onChange={handleFontFamilyChange}
                    size="small"
                    sx={{ fontSize: '0.875rem', minWidth: 120 }}
                >
                    {FONT_FAMILIES.map((font) => (
                        <MenuItem
                            key={font.name}
                            value={font.value}
                            sx={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* Font Size */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 70 }}>
                <Select
                    value={formats.fontSize}
                    onChange={handleFontSizeChange}
                    size="small"
                    sx={{ fontSize: '0.875rem', minWidth: 70 }}
                >
                    {FONT_SIZES.map((size) => (
                        <MenuItem key={size} value={size}>
                            {size}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Text Formatting */}
            <Box sx={{ display: 'flex' }}>
                <Tooltip title={t('editor.bold')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('bold', !formats.bold)}
                        color={formats.bold ? 'primary' : 'default'}
                    >
                        <BoldIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.italic')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('italic', !formats.italic)}
                        color={formats.italic ? 'primary' : 'default'}
                    >
                        <ItalicIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.underline')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('underline', !formats.underline)}
                        color={formats.underline ? 'primary' : 'default'}
                    >
                        <UnderlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.strikethrough')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('strike', !formats.strike)}
                        color={formats.strike ? 'primary' : 'default'}
                    >
                        <StrikethroughIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Text Color */}
            <Box sx={{ display: 'flex' }}>
                <Tooltip title={t('editor.textColor')}>
                    <IconButton
                        id="text-color-button"
                        size="small"
                        onClick={(e) => openColorPicker('text', e)}
                        sx={{ color: currentColor }}
                    >
                        <TextColorIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.backgroundColor')}>
                    <IconButton
                        id="background-color-button"
                        size="small"
                        onClick={(e) => openColorPicker('background', e)}
                        sx={{
                            backgroundColor: backgroundColor,
                            '&:hover': { backgroundColor: backgroundColor }
                        }}
                    >
                        <BackgroundColorIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.clearFormatting')}>
                    <IconButton size="small" onClick={clearFormatting}>
                        <ClearFormatIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Alignment */}
            <ToggleButtonGroup
                size="small"
                value={formats.align}
                exclusive
                onChange={handleAlignChange}
            >
                <ToggleButton value="left" aria-label="left aligned">
                    <AlignLeftIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="center" aria-label="centered">
                    <AlignCenterIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="right" aria-label="right aligned">
                    <AlignRightIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="justify" aria-label="justified">
                    <AlignJustifyIcon fontSize="small" />
                </ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Lists */}
            <Box sx={{ display: 'flex' }}>
                <Tooltip title={t('editor.bulletList')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('list', formats.list === 'bullet' ? false : 'bullet')}
                        color={formats.list === 'bullet' ? 'primary' : 'default'}
                    >
                        <BulletListIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.numberedList')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('list', formats.list === 'ordered' ? false : 'ordered')}
                        color={formats.list === 'ordered' ? 'primary' : 'default'}
                    >
                        <NumberedListIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.indent')}>
                    <IconButton size="small" onClick={() => applyFormat('indent', '+1')}>
                        <IndentIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.outdent')}>
                    <IconButton size="small" onClick={() => applyFormat('indent', '-1')}>
                        <OutdentIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Insert elements */}
            <Box sx={{ display: 'flex' }}>
                <Tooltip title={t('editor.link')}>
                    <IconButton
                        id="link-button"
                        size="small"
                        onClick={handleInsertLink}
                    >
                        <LinkIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.table')}>
                    <IconButton
                        id="table-button"
                        size="small"
                        onClick={openTableDialog}
                    >
                        <TableIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.quote')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('blockquote', !formats.blockquote)}
                    >
                        <QuoteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('editor.code')}>
                    <IconButton
                        size="small"
                        onClick={() => applyFormat('code-block', !formats.code)}
                    >
                        <CodeIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Color Picker Popover */}
            <Popover
                open={Boolean(colorPickerAnchor)}
                anchorEl={colorPickerAnchor}
                onClose={closeColorPicker}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box sx={{ p: 1 }}>
                    <SketchPicker
                        color={colorPickerType === 'text' ? currentColor : backgroundColor}
                        onChangeComplete={applyColor}
                        disableAlpha
                    />
                </Box>
            </Popover>

            {/* Link Dialog */}
            <Popover
                open={Boolean(linkDialogAnchor)}
                anchorEl={linkDialogAnchor}
                onClose={() => setLinkDialogAnchor(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box sx={{ p: 2, width: 300 }}>
                    <Box sx={{ mb: 2 }}>
                        <InputBase
                            placeholder={t('editor.linkUrl')}
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            fullWidth
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1
                            }}
                        />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <InputBase
                            placeholder={t('editor.linkText')}
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            fullWidth
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title={t('editor.insertLink')}>
                            <IconButton
                                color="primary"
                                onClick={applyLink}
                                disabled={!linkUrl}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Popover>

            {/* Table Dialog */}
            <Popover
                open={Boolean(tableDialogAnchor)}
                anchorEl={tableDialogAnchor}
                onClose={closeTableDialog}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box sx={{ p: 2, width: 200 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{t('editor.rows')}:</span>
                        <Select
                            value={tableSize.rows}
                            onChange={(e) => setTableSize({ ...tableSize, rows: e.target.value })}
                            size="small"
                        >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <MenuItem key={num} value={num}>{num}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{t('editor.columns')}:</span>
                        <Select
                            value={tableSize.cols}
                            onChange={(e) => setTableSize({ ...tableSize, cols: e.target.value })}
                            size="small"
                        >
                            {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                <MenuItem key={num} value={num}>{num}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title={t('editor.insertTable')}>
                            <IconButton
                                color="primary"
                                onClick={insertTable}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Popover>
        </Paper>
    );
};

// Add default export
export default EditorToolbar;