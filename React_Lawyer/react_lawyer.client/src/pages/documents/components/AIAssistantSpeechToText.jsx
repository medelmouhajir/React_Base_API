// src/pages/documents/components/AIAssistantSpeechToText.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Paper,
    Chip,
    Tooltip,
    TextField,
    Divider
} from '@mui/material';
import {
    Mic as MicIcon,
    MicOff as MicOffIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Save as SaveIcon,
    Stop as StopIcon,
    Add as AddIcon,
    RecordVoiceOver as RecordVoiceOverIcon
} from '@mui/icons-material';

const AIAssistantSpeechToText = ({ onInsertText }) => {
    const { t } = useTranslation();
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [recognizedLanguage, setRecognizedLanguage] = useState('');
    const recognitionRef = useRef(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState([]);

    // Initialize speech recognition on component mount
    useEffect(() => {
        // Check browser support for Speech Recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            setError(t('ai.speechToText.notSupported'));
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        // Configure recognition
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US'; // Default language

        // Setup recognition event handlers
        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
            setError(`${t('ai.speechToText.error')}: ${event.error}`);
            setIsListening(false);
        };

        recognitionRef.current.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;

                    // Try to detect language if not already set
                    if (!recognizedLanguage && result[0].lang) {
                        setRecognizedLanguage(result[0].lang);
                    }
                } else {
                    interim += result[0].transcript;
                }
            }

            setInterimTranscript(interim);
            if (final) {
                setTranscription((prev) => prev + ' ' + final.trim());
                setInterimTranscript('');
            }
        };

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [t]);

    // Toggle speech recognition
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                setTranscription('');
                setInterimTranscript('');
                recognitionRef.current?.start();
            } catch (err) {
                console.error('Error starting speech recognition:', err);
                setError(t('ai.speechToText.startError'));
            }
        }
    };

    // Change language
    const changeLanguage = (langCode) => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = langCode;

            // Restart if currently listening
            if (isListening) {
                recognitionRef.current.stop();
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                    } catch (err) {
                        console.error('Error restarting speech recognition:', err);
                    }
                }, 200);
            }
        }
    };

    // Clear transcription
    const clearTranscription = () => {
        setTranscription('');
        setInterimTranscript('');
    };

    // Insert transcription into document
    const handleInsertText = () => {
        if (transcription.trim()) {
            onInsertText(transcription.trim());

            // Add to history
            setTranscriptionHistory(prev => [
                {
                    id: Date.now(),
                    text: transcription.trim(),
                    timestamp: new Date()
                },
                ...prev
            ].slice(0, 10)); // Keep only 10 most recent

            // Clear current transcription
            clearTranscription();
        }
    };

    // Insert text from history
    const insertFromHistory = (text) => {
        onInsertText(text);
    };

    // Common languages
    const languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'es-ES', name: 'Spanish' },
        { code: 'fr-FR', name: 'French' },
        { code: 'de-DE', name: 'German' },
        { code: 'it-IT', name: 'Italian' },
        { code: 'pt-BR', name: 'Portuguese' },
        { code: 'ar-SA', name: 'Arabic' },
        { code: 'zh-CN', name: 'Chinese' },
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'ru-RU', name: 'Russian' }
    ];

    if (!isSupported) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {t('ai.speechToText.notSupported')}
                </Alert>
                <Typography>
                    {t('ai.speechToText.tryBrowser')}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    {t('ai.speechToText.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.speechToText.description')}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Language Selection */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {languages.map((lang) => (
                    <Chip
                        key={lang.code}
                        label={lang.name}
                        onClick={() => changeLanguage(lang.code)}
                        variant={recognitionRef.current?.lang === lang.code ? 'filled' : 'outlined'}
                        color={recognitionRef.current?.lang === lang.code ? 'primary' : 'default'}
                        size="small"
                    />
                ))}
            </Box>

            {/* Voice Recording Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Tooltip title={isListening ? t('ai.speechToText.stopListening') : t('ai.speechToText.startListening')}>
                    <IconButton
                        color={isListening ? 'error' : 'primary'}
                        onClick={toggleListening}
                        sx={{
                            width: 60,
                            height: 60,
                            border: 2,
                            borderColor: isListening ? 'error.main' : 'primary.main',
                            animation: isListening ? 'pulse 1.5s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)',
                                },
                                '70%': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                                },
                                '100%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                                },
                            },
                        }}
                    >
                        {isListening ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Status Indicator */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                {isListening ? (
                    <Chip
                        label={t('ai.speechToText.listening')}
                        color="error"
                        icon={
                            <Box component="span" sx={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'error.main',
                                animation: 'blink 1s infinite',
                                '@keyframes blink': {
                                    '0%': {
                                        opacity: 1,
                                    },
                                    '50%': {
                                        opacity: 0.4,
                                    },
                                    '100%': {
                                        opacity: 1,
                                    },
                                },
                            }} />
                        }
                    />
                ) : (
                    <Chip
                        label={t('ai.speechToText.notListening')}
                        variant="outlined"
                        icon={<MicOffIcon />}
                    />
                )}
            </Box>

            {/* Transcription Display */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    minHeight: 150,
                    maxHeight: 300,
                    overflowY: 'auto',
                }}
            >
                <Typography>
                    {transcription}
                    <Typography component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {interimTranscript && ' ' + interimTranscript}
                    </Typography>
                </Typography>
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={clearTranscription}
                    disabled={!transcription && !interimTranscript}
                >
                    {t('ai.speechToText.clear')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleInsertText}
                    disabled={!transcription.trim()}
                >
                    {t('ai.speechToText.insert')}
                </Button>
            </Box>

            {/* Transcription History */}
            {transcriptionHistory.length > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                        {t('ai.speechToText.history')}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        {transcriptionHistory.map((item) => (
                            <Paper
                                key={item.id}
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        maxWidth: '80%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {item.text}
                                </Typography>
                                <Tooltip title={t('ai.speechToText.reuse')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => insertFromHistory(item.text)}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Paper>
                        ))}
                    </Box>
                </>
            )}

            <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                    {t('ai.speechToText.tip')}
                </Alert>
            </Box>
        </Box>
    );
};

export default AIAssistantSpeechToText;