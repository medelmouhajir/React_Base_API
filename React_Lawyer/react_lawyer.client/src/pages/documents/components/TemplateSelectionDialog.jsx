// src/pages/documents/components/TemplateSelectionDialog.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Chip,
    Box,
    CircularProgress,
    Alert,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import {
    Search as SearchIcon,
    Description as DocumentIcon
} from '@mui/icons-material';

// Import services
import documentGenerationService from '../../../services/documentGenerationService';

const TemplateSelectionDialog = ({ open, onClose, onSelect }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [error, setError] = useState(null);

    // Load templates when dialog opens
    useEffect(() => {
        if (open) {
            loadTemplates();
        }
    }, [open]);

    // Load templates from API
    const loadTemplates = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await documentGenerationService.getTemplates();
            setTemplates(result);
            setFilteredTemplates(result);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setError(t('templates.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Filter templates based on search term and category
    useEffect(() => {
        let filtered = templates;

        if (activeCategory !== 'all') {
            filtered = filtered.filter(template => template.category === activeCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(template =>
                template.name.toLowerCase().includes(term) ||
                template.description?.toLowerCase().includes(term) ||
                template.category?.toLowerCase().includes(term)
            );
        }

        setFilteredTemplates(filtered);
    }, [searchTerm, activeCategory, templates]);

    // Get all unique categories from templates
    const categories = ['all', ...new Set(templates.map(template => template.category).filter(Boolean))];

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Handle category change
    const handleCategoryChange = (event, newValue) => {
        setActiveCategory(newValue);
    };

    // Template preview component
    const TemplatePreview = ({ template }) => (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                }
            }}
        >
            <CardActionArea
                onClick={() => onSelect(template)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DocumentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="div" noWrap>
                            {template.name}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            flexGrow: 1
                        }}
                    >
                        {template.description || t('templates.noDescription')}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                        <Chip
                            label={template.category || t('templates.uncategorized')}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />

                        {template.jurisdiction && (
                            <Chip
                                label={template.jurisdiction}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="template-dialog-title"
        >
            <DialogTitle id="template-dialog-title">
                {t('templates.select')}
            </DialogTitle>

            <DialogContent dividers>
                {/* Search bar */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={t('templates.search')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                        }}
                    />
                </Box>

                {/* Categories tabs */}
                <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeCategory}
                        onChange={handleCategoryChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        {categories.map((category) => (
                            <Tab
                                key={category}
                                label={category === 'all'
                                    ? t('templates.allCategories')
                                    : category
                                }
                                value={category}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Error message */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Loading indicator */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* No results message */}
                        {filteredTemplates.length === 0 ? (
                            <Alert severity="info">
                                {searchTerm
                                    ? t('templates.noSearchResults')
                                    : activeCategory !== 'all'
                                        ? t('templates.noCategoryResults')
                                        : t('templates.noTemplates')
                                }
                            </Alert>
                        ) : (
                            /* Template grid */
                            <Grid container spacing={2}>
                                {filteredTemplates.map((template) => (
                                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                                        <TemplatePreview template={template} />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={loadTemplates}
                    disabled={loading}
                >
                    {t('templates.refresh')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TemplateSelectionDialog;