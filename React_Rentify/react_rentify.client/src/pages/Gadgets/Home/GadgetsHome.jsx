// src/pages/Gadgets/Home/GadgetsHome.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import './GadgetsHome.css';

const GadgetsHome = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('name'); // 'name', 'category', 'recent'

    // Enhanced gadgets data with more properties for better UX
    const gadgets = [
        {
            id: 'blacklist',
            name: t('gadgets.blacklist.name'),
            description: t('gadgets.blacklist.description'),
            icon: '🚫',
            url: 'gadgets/blacklist',
            category: 'customer',
            available: true,
            isNew: false,
            priority: 'high',
            lastUsed: null,
            estimatedTime: '2-3 min'
        },
        {
            id: 'carcheck',
            name: t('gadgets.carcheck.name'),
            description: t('gadgets.carcheck.description'),
            icon: '🚗',
            url: 'gadgets/carcheck',
            category: 'reservation',
            available: true,
            isNew: false,
            priority: 'high',
            lastUsed: '2024-03-15',
            estimatedTime: '1-2 min'
        },
        {
            id: 'identity',
            name: t('gadgets.identity.name'),
            description: t('gadgets.identity.description'),
            icon: '📸',
            url: 'gadgets/identity',
            category: 'customer',
            available: true,
            isNew: true,
            priority: 'medium',
            lastUsed: '2024-03-10',
            estimatedTime: '3-5 min'
        },
        {
            id: 'notifications',
            name: t('gadgets.notifications.name'),
            description: t('gadgets.notifications.description'),
            icon: '🔔',
            url: 'settings/notifications',
            category: 'system',
            available: true,
            isNew: false,
            priority: 'low',
            lastUsed: '2024-03-12',
            estimatedTime: '1 min'
        },
        {
            id: 'legals',
            name: t('car.legalDocuments.title'),
            description: t('car.legalDocuments.subtitle'),
            icon: '📋',
            url: 'gadgets/carLegal',
            category: 'reports',
            available: true,
            isNew: false,
            priority: 'medium',
            lastUsed: '2024-03-08',
            estimatedTime: '5-10 min'
        },
        {
            id: 'analytics',
            name: 'Analytics Dashboard',
            description: 'View detailed analytics and reports for your rental business',
            icon: '📊',
            url: 'gadgets/analytics',
            category: 'reports',
            available: false,
            comingSoon: true,
            isNew: false,
            priority: 'high',
            lastUsed: null,
            estimatedTime: '10-15 min'
        },
        {
            id: 'maintenance',
            name: 'Maintenance Scheduler',
            description: 'Schedule and track vehicle maintenance tasks',
            icon: '🔧',
            url: 'gadgets/maintenance',
            category: 'fleet',
            available: false,
            comingSoon: true,
            isNew: false,
            priority: 'medium',
            lastUsed: null,
            estimatedTime: '5-8 min'
        }
    ];

    // Categories for filtering
    const categories = [
        { id: 'all', name: 'search.all', icon: '⚡' },
        { id: 'customer', name: 'sidebar.customers', icon: '👤' },
        { id: 'reservation', name: 'sidebar.reservations', icon: '📅' },
        { id: 'fleet', name: 'sidebar.cars', icon: '🚗' },
        { id: 'reports', name: 'sidebar.reports', icon: '📊' },
        { id: 'system', name: 'System', icon: '⚙️' }
    ];

    // Filter and sort gadgets
    const filteredAndSortedGadgets = useMemo(() => {
        let filtered = gadgets.filter(gadget => {
            const matchesSearch = gadget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                gadget.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || gadget.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort gadgets
        switch (sortBy) {
            case 'category':
                filtered.sort((a, b) => a.category.localeCompare(b.category));
                break;
            case 'recent':
                filtered.sort((a, b) => {
                    if (!a.lastUsed && !b.lastUsed) return 0;
                    if (!a.lastUsed) return 1;
                    if (!b.lastUsed) return -1;
                    return new Date(b.lastUsed) - new Date(a.lastUsed);
                });
                break;
            default: // name
                filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Prioritize available gadgets
        return filtered.sort((a, b) => {
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return 0;
        });
    }, [gadgets, searchTerm, selectedCategory, sortBy]);

    // Handle gadget click with enhanced loading state
    const handleGadgetClick = (gadget) => {
        if (!gadget.available) return;

        setIsLoading(true);

        // Simulate API call and navigation
        setTimeout(() => {
            navigate(`/${gadget.url}`);
            setIsLoading(false);
        }, 300);
    };

    // Search handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // Category selection
    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    // View mode toggle
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    };

    // Recent gadgets (max 3)
    const recentGadgets = useMemo(() => {
        return gadgets
            .filter(g => g.available && g.lastUsed)
            .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
            .slice(0, 3);
    }, [gadgets]);

    // Quick actions (most used/important gadgets)
    const quickActions = useMemo(() => {
        return gadgets
            .filter(g => g.available && g.priority === 'high')
            .slice(0, 4);
    }, [gadgets]);

    return (
        <div className={`gadgets-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Hero Section */}
            <div className="gadgets-hero">
                <div className="hero-content">
                    <h1 className="gadgets-title">
                        <span className="title-icon">⚡</span>
                        {t('gadgets.home.title', 'Business Tools')}
                    </h1>
                    <p className="gadgets-description">
                        {t('gadgets.home.description', 'Streamline your rental operations with our comprehensive toolkit')}
                    </p>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">{gadgets.filter(g => g.available).length}</span>
                            <span className="stat-label">Available Tools</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{categories.length - 1}</span>
                            <span className="stat-label">Categories</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Section */}
            {quickActions.length > 0 && (
                <div className="quick-actions-section">
                    <h2 className="section-title">
                        <span className="section-icon">⚡</span>
                        Quick Actions
                    </h2>
                    <div className="quick-actions-grid">
                        {quickActions.map((gadget) => (
                            <button
                                key={`quick-${gadget.id}`}
                                className="quick-action-card"
                                onClick={() => handleGadgetClick(gadget)}
                                disabled={!gadget.available}
                            >
                                <div className="quick-action-icon">{gadget.icon}</div>
                                <span className="quick-action-name">{gadget.name}</span>
                                <span className="quick-action-time">{gadget.estimatedTime}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="search-filter-section">
                <div className="search-bar-wrapper">
                    <div className="search-gadgets-input-container">
                        <svg className="search-gadgets-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder={t('gadgets.home.searchPlaceholder', 'Search tools...')}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-gadgets-input"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="search-gadgets-clear"
                                aria-label="Clear search"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div className="category-filter">
                    <div className="category-pills">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category.id)}
                            >
                                <span className="category-icon">{category.icon}</span>
                                <span className="category-name">{t(category.name)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Controls */}
                <div className="view-controls">
                    <div className="sort-dropdown">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="category">Sort by Category</option>
                            <option value="recent">Recently Used</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={toggleViewMode}
                        className="view-toggle"
                        aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                    >
                        {viewMode === 'grid' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            {searchTerm && (
                <div className="results-summary">
                    <span className="results-count">
                        {filteredAndSortedGadgets.length} result{filteredAndSortedGadgets.length !== 1 ? 's' : ''}
                        {searchTerm && ` for "${searchTerm}"`}
                        {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                    </span>
                </div>
            )}

            {/* Gadgets Grid/List */}
            <div className={`gadgets-container ${viewMode}-view`}>
                {filteredAndSortedGadgets.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </div>
                        <h3>No tools found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                        {(searchTerm || selectedCategory !== 'all') && (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="gadgets-grid">
                        {filteredAndSortedGadgets.map((gadget) => (
                            <div
                                key={gadget.id}
                                className={`gadget-card ${!gadget.available ? 'disabled' : ''} ${gadget.comingSoon ? 'coming-soon' : ''} ${gadget.isNew ? 'new' : ''}`}
                                onClick={() => handleGadgetClick(gadget)}
                                role="button"
                                tabIndex={gadget.available ? 0 : -1}
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && gadget.available) {
                                        e.preventDefault();
                                        handleGadgetClick(gadget);
                                    }
                                }}
                            >
                                {/* Card Header */}
                                <div className="gadget-card-header">
                                    <div className="gadget-icon-wrapper">
                                        <span className="gadget-icon">{gadget.icon}</span>
                                        {gadget.isNew && <span className="new-badge">New</span>}
                                    </div>
                                    <div className="gadget-meta">
                                        <span className="gadget-category">
                                            {t(categories.find(c => c.id === gadget.category)?.name || gadget.category)}
                                        </span>
                                        <span className="gadget-time">{gadget.estimatedTime}</span>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="gadget-content">
                                    <h3 className="gadget-name">{gadget.name}</h3>
                                    <p className="gadget-description">{gadget.description}</p>

                                    {/* Card Footer */}
                                    <div className="gadget-footer">
                                        {gadget.comingSoon && (
                                            <span className="coming-soon-badge">
                                                {t('common.comingSoon')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Action */}
                                {gadget.available && (
                                    <div className="gadget-action">
                                        <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <polyline points="9,18 15,12 9,6"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading tool...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GadgetsHome;