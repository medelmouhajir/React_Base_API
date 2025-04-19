// src/pages/documents/components/DocumentEditor.jsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box } from '@mui/material';
import { useThemeMode } from '../../../theme/ThemeProvider';

const DocumentEditor = forwardRef(({ content, onChange }, ref) => {
    const [editorContent, setEditorContent] = useState('');
    const { mode } = useThemeMode();
    const [editor, setEditor] = useState(null);

    // Initialize editor content when prop changes
    useEffect(() => {
        if (content !== editorContent) {
            setEditorContent(content);
        }
    }, [content]);

    // Handle content changes
    const handleChange = (value) => {
        setEditorContent(value);
        if (onChange) {
            onChange(value);
        }
    };

    // Create a Quill modules configuration
    const modules = {
        toolbar: false, // We're using our custom toolbar
        history: {
            delay: 500,
            maxStack: 100,
            userOnly: true
        },
        clipboard: {
            matchVisual: false
        },
        // Track changes and collaboration modules would be added here in a real implementation
    };

    // Create a Quill formats configuration
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video',
        'color', 'background',
        'align', 'code-block', 'formula', 'script'
    ];

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        // Get the editor instance
        getEditor: () => editor,

        // Get the raw editor contents (HTML)
        getEditorContents: () => editorContent,

        // Get the editor text content (plain text)
        getEditorText: () => {
            return editor ? editor.getText() : '';
        },

        // Get the editor HTML
        getHTML: () => {
            return editor ? editor.root.innerHTML : '';
        },

        // Insert text at the current cursor position
        insertText: (text) => {
            if (editor) {
                const range = editor.getSelection();
                if (range) {
                    editor.insertText(range.index, text);
                } else {
                    // If no selection, insert at the end
                    editor.insertText(editor.getLength() - 1, text);
                }
            }
        },

        // Apply a text replacement (find original text and replace with new text)
        applyTextReplacement: (originalText, newText) => {
            if (editor && originalText && newText) {
                const text = editor.getText();
                const index = text.indexOf(originalText);

                if (index !== -1) {
                    editor.deleteText(index, originalText.length);
                    editor.insertText(index, newText);
                    return true;
                }
                return false;
            }
            return false;
        },

        // Apply a format to the current selection
        applyFormat: (format, value) => {
            if (editor) {
                const range = editor.getSelection() || { index: 0, length: 0 };
                // For alignment, we need to use the 'align' format on block level
                if (format === 'align') {
                    editor.format('align', value);
                } else {
                    editor.formatText(range.index, range.length || 1, format, value);
                }
            }
        },

        // Clear formatting from the current selection
        clearFormat: () => {
            if (editor) {
                const range = editor.getSelection();
                if (range) {
                    editor.removeFormat(range.index, range.length);
                }
            }
        },

        // Insert an image
        insertImage: (url, alt = '') => {
            if (editor) {
                const range = editor.getSelection();
                if (range) {
                    editor.insertEmbed(range.index, 'image', url);
                }
            }
        },

        // Insert a table
        insertTable: (rows, cols) => {
            if (editor) {
                const range = editor.getSelection();
                if (range) {
                    // Create HTML table
                    let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
                    for (let r = 0; r < rows; r++) {
                        tableHTML += '<tr>';
                        for (let c = 0; c < cols; c++) {
                            tableHTML += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px; height: 20px;"></td>';
                        }
                        tableHTML += '</tr>';
                    }
                    tableHTML += '</table><p><br></p>';

                    // Insert at cursor position
                    editor.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
                }
            }
        },

        // Set focus to the editor
        focus: () => {
            if (editor) {
                editor.focus();
            }
        },

        // Get current selection
        getSelection: () => {
            if (editor) {
                return editor.getSelection();
            }
            return null;
        },

        // Find and select text
        findAndSelect: (text) => {
            if (editor && text) {
                const editorText = editor.getText();
                const index = editorText.indexOf(text);

                if (index !== -1) {
                    editor.focus();
                    editor.setSelection(index, text.length);
                    return true;
                }
                return false;
            }
            return false;
        }
    }));

    // Handle editor initialization
    const handleEditorInit = (editor) => {
        setEditor(editor);
    };

    return (
        <Box
            sx={{
                height: '100%',
                // Apply theme-specific styles
                '& .ql-editor': {
                    minHeight: '10.5in',
                    padding: '0.5in',
                    fontSize: '12pt',
                    lineHeight: 1.5,
                    fontFamily: 'Georgia, Times New Roman, serif',
                    color: mode === 'dark' ? '#e0e0e0' : '#333',
                },
                // Hide default toolbar as we're using our custom one
                '& .ql-toolbar': {
                    display: 'none'
                },
                // Custom container styling
                '& .ql-container': {
                    border: 'none',
                    fontSize: '12pt',
                }
            }}
        >
            <ReactQuill
                theme="snow"
                value={editorContent}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                onChangeSelection={(range) => {
                    // You can add selection change handling if needed
                }}
                onFocus={() => {
                    // You can add focus handling if needed
                }}
                onBlur={() => {
                    // You can add blur handling if needed
                }}
                ref={(el) => {
                    if (el && el.editor) {
                        handleEditorInit(el.editor);
                    }
                }}
            />
        </Box>
    );
});

export default DocumentEditor;