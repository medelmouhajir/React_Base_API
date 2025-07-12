// src/pages/Gadgets/Home/GadgetsHome.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import './GadgetsHome.css';

const GadgetsHome = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Gadgets data with existing tools + mockups to be added later
    const gadgets = [
        {
            id: 'blacklist',
            name: t('gadgets.blacklist.name'),
            description: t('gadgets.blacklist.description'),
            icon: '🚫',
            url: 'gadgets/blacklist',
            category: 'customer',
            available: true
        },
        {
            id: 'carcheck',
            name: t('gadgets.carcheck.name'),
            description: t('gadgets.carcheck.description'),
            icon: '🚗',
            url: 'gadgets/carcheck',
            category: 'reservation',
            available: true
        },
        // Mockup gadgets - to be implemented
        {
            id: 'analytics',
            name: t('gadgets.analytics.name'),
            description: t('gadgets.analytics.description'),
            icon: '📊',
            url: 'gadgets/analytics',
            category: 'analytics',
            available: false,
            comingSoon: true
        },
        {
            id: 'reports',
            name: t('gadgets.reports.name'),
            description: t('gadgets.reports.description'),
            icon: '📋',
            url: 'gadgets/reports',
            category: 'reports',
            available: false,
            comingSoon: true
        },
        {
            id: 'notifications',
            name: t('gadgets.notifications.name'),
            description: t('gadgets.notifications.description'),
            icon: '🔔',
            url: 'gadgets/notifications',
            category: 'system',
            available: false,
            comingSoon: true
        }
    ];

    // Filter gadgets based on search term
    const filteredGadgets = gadgets.filter(gadget =>
        gadget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gadget.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleGadgetClick = (gadget) => {
        if (!gadget.available) return;

        setIsLoading(true);
        // Simulate loading for UX
        setTimeout(() => {
            navigate(`/${gadget.url}`);
            setIsLoading(false);
        }, 500);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className={`gadgets-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="gadgets-header">
                <h1 className="gadgets-title">{t('gadgets.home.title')}</h1>
                <p className="gadgets-description">{t('gadgets.home.description')}</p>
            </div>

            {/* Search Bar */}
            <div className="search-bar-gadgets">
                <div className="search-input-wrapper">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder={t('gadgets.home.searchPlaceholder')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="search-clear"
                            aria-label={t('common.clear')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Gadgets Grid */}
            <div className="gadgets-grid">
                {filteredGadgets.length === 0 ? (
                    <div className="no-results">
                        <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <h3>{t('gadgets.home.noResults')}</h3>
                        <p>{t('gadgets.home.noResultsDescription')}</p>
                    </div>
                ) : (
                    filteredGadgets.map((gadget) => (
                        <div
                            key={gadget.id}
                            className={`gadget-card ${!gadget.available ? 'disabled' : ''} ${gadget.comingSoon ? 'coming-soon' : ''}`}
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
                            <div className="gadget-icon">
                                {gadget.icon}
                            </div>
                            <div className="gadget-content">
                                <h3 className="gadget-name">{gadget.name}</h3>
                                <p className="gadget-description">{gadget.description}</p>
                                {gadget.comingSoon && (
                                    <span className="coming-soon-badge">
                                        {t('gadgets.home.comingSoon')}
                                    </span>
                                )}
                            </div>
                            {gadget.available && (
                                <div className="gadget-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="9,18 15,12 9,6"></polyline>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GadgetsHome;