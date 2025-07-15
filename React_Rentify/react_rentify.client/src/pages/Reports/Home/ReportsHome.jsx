// src/pages/Reports/Home/ReportsHome.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import './ReportsHome.css';

const ReportsHome = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Mock data for report categories
    const reportCategories = [
        {
            id: 'cars',
            name: t('reports.categories.cars'),
            description: t('reports.categories.carsDescription'),
            icon: '🚗',
            color: '#0ea5e9',
            reports: [
                {
                    id: 'car-inventory',
                    name: t('reports.cars.inventory'),
                    description: t('reports.cars.inventoryDescription'),
                    url: '/reports/cars/inventory',
                    tags: ['inventory', 'cars']
                },
                {
                    id: 'car-utilization',
                    name: t('reports.cars.utilization'),
                    description: t('reports.cars.utilizationDescription'),
                    url: '/reports/cars/utilization',
                    tags: ['utilization', 'performance']
                },
                {
                    id: 'car-maintenance',
                    name: t('reports.cars.maintenance'),
                    description: t('reports.cars.maintenanceDescription'),
                    url: '/reports/cars/maintenance',
                    tags: ['maintenance', 'costs']
                },
                {
                    id: 'car-revenue',
                    name: t('reports.cars.revenue'),
                    description: t('reports.cars.revenueDescription'),
                    url: '/reports/cars/revenue',
                    tags: ['revenue', 'financial']
                }
            ]
        },
        {
            id: 'agency',
            name: t('reports.categories.agency'),
            description: t('reports.categories.agencyDescription'),
            icon: '🏢',
            color: '#10b981',
            reports: [
                {
                    id: 'agency-performance',
                    name: t('reports.agency.performance'),
                    description: t('reports.agency.performanceDescription'),
                    url: '/reports/agency/performance',
                    tags: ['performance', 'kpi']
                },
                {
                    id: 'agency-financial',
                    name: t('reports.agency.financial'),
                    description: t('reports.agency.financialDescription'),
                    url: '/reports/agency/financial',
                    tags: ['financial', 'revenue']
                },
                {
                    id: 'agency-customers',
                    name: t('reports.agency.customers'),
                    description: t('reports.agency.customersDescription'),
                    url: '/reports/agency/customers',
                    tags: ['customers', 'analytics']
                },
                {
                    id: 'agency-staff',
                    name: t('reports.agency.staff'),
                    description: t('reports.agency.staffDescription'),
                    url: '/reports/agency/staff',
                    tags: ['staff', 'hr']
                }
            ]
        },
        {
            id: 'reservations',
            name: t('reports.categories.reservations'),
            description: t('reports.categories.reservationsDescription'),
            icon: '📅',
            color: '#f59e0b',
            reports: [
                {
                    id: 'reservation-trends',
                    name: t('reports.reservations.trends'),
                    description: t('reports.reservations.trendsDescription'),
                    url: '/reports/reservations/trends',
                    tags: ['trends', 'analytics']
                },
                {
                    id: 'reservation-cancellations',
                    name: t('reports.reservations.cancellations'),
                    description: t('reports.reservations.cancellationsDescription'),
                    url: '/reports/reservations/cancellations',
                    tags: ['cancellations', 'analysis']
                },
                {
                    id: 'reservation-occupancy',
                    name: t('reports.reservations.occupancy'),
                    description: t('reports.reservations.occupancyDescription'),
                    url: '/reports/reservations/occupancy',
                    tags: ['occupancy', 'utilization']
                }
            ]
        },
        {
            id: 'financial',
            name: t('reports.categories.financial'),
            description: t('reports.categories.financialDescription'),
            icon: '💰',
            color: '#ef4444',
            reports: [
                {
                    id: 'profit-loss',
                    name: t('reports.financial.profitLoss'),
                    description: t('reports.financial.profitLossDescription'),
                    url: '/reports/financial/profit-loss',
                    tags: ['profit', 'loss', 'financial']
                },
                {
                    id: 'cash-flow',
                    name: t('reports.financial.cashFlow'),
                    description: t('reports.financial.cashFlowDescription'),
                    url: '/reports/financial/cash-flow',
                    tags: ['cash', 'flow', 'financial']
                },
                {
                    id: 'expense-analysis',
                    name: t('reports.financial.expenseAnalysis'),
                    description: t('reports.financial.expenseAnalysisDescription'),
                    url: '/reports/financial/expense-analysis',
                    tags: ['expenses', 'analysis']
                }
            ]
        }
    ];

    // Filter categories and reports based on search and selected category
    const filteredCategories = reportCategories
        .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
        .map(category => {
            const filteredReports = category.reports.filter(report =>
                report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return {
                ...category,
                reports: filteredReports
            };
        })
        .filter(category => category.reports.length > 0);

    const handleReportClick = (url) => {
        navigate(url);
    };

    const categories = ['all', ...reportCategories.map(cat => cat.id)];

    return (
        <div className={`reports-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-title-section">
                    <h1 className="reports-title">{t('reports.title')}</h1>
                    <p className="reports-description">
                        {t('reports.description')}
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="reports-filters">
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder={t('reports.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="category-filters">
                        {categories.map(categoryId => (
                            <button
                                key={categoryId}
                                onClick={() => setSelectedCategory(categoryId)}
                                className={`category-filter ${selectedCategory === categoryId ? 'active' : ''}`}
                            >
                                {categoryId === 'all' ? t('reports.categories.all') :
                                    reportCategories.find(cat => cat.id === categoryId)?.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reports Categories */}
            <div className="reports-content">
                {filteredCategories.map(category => (
                    <div key={category.id} className="category-section">
                        <div className="category-header">
                            <div className="category-info">
                                <div
                                    className="category-icon"
                                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                                >
                                    {category.icon}
                                </div>
                                <div className="category-details">
                                    <h2 className="category-name">{category.name}</h2>
                                    <p className="category-description">{category.description}</p>
                                </div>
                            </div>
                            <div className="category-count">
                                {category.reports.length} {t('reports.reportsCount')}
                            </div>
                        </div>

                        <div className="reports-grid">
                            {category.reports.map(report => (
                                <div
                                    key={report.id}
                                    className="report-card"
                                    onClick={() => handleReportClick(report.url)}
                                >
                                    <div className="report-content">
                                        <h3 className="report-name">{report.name}</h3>
                                        <p className="report-description">{report.description}</p>

                                        <div className="report-tags">
                                            {report.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="report-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="report-action">
                                        <svg className="report-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="no-results">
                        <div className="no-results-icon">📊</div>
                        <h3 className="no-results-title">{t('reports.noResults')}</h3>
                        <p className="no-results-description">{t('reports.noResultsDescription')}</p>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="reports-stats">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <div className="stat-value">
                                {reportCategories.reduce((total, cat) => total + cat.reports.length, 0)}
                            </div>
                            <div className="stat-label">{t('reports.totalReports')}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-info">
                            <div className="stat-value">{user?.agencyName || t('reports.yourAgency')}</div>
                            <div className="stat-label">{t('reports.agency')}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-info">
                            <div className="stat-value">{new Date().toLocaleDateString()}</div>
                            <div className="stat-label">{t('reports.lastUpdated')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsHome;