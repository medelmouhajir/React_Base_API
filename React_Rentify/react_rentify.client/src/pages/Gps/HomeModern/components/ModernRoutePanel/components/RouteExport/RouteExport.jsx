// src/pages/Gps/HomeModern/RouteExport.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './RouteExport.css';

const RouteExport = ({
    routeData,
    selectedVehicle,
    dateRange,
    onExport,
    isLoading = false,
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('pdf');
    const [exportOptions, setExportOptions] = useState({
        includeMap: true,
        includeStats: true,
        includeChart: true,
        includeTimeline: true,
        includeStops: true,
        dateFormat: 'international'
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const fileInputRef = useRef(null);

    // Export formats configuration
    const exportFormats = [
        {
            id: 'pdf',
            label: t('gps.export.pdf', 'PDF Report'),
            description: t('gps.export.pdfDesc', 'Complete report with maps and charts'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" />
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            color: '#EF4444'
        },
        {
            id: 'excel',
            label: t('gps.export.excel', 'Excel Spreadsheet'),
            description: t('gps.export.excelDesc', 'Raw data for analysis'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 12l4 4M14 12l-4 4" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            color: '#10B981'
        },
        {
            id: 'csv',
            label: t('gps.export.csv', 'CSV Data'),
            description: t('gps.export.csvDesc', 'Comma-separated values'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            color: '#F59E0B'
        },
        {
            id: 'kml',
            label: t('gps.export.kml', 'KML/KMZ'),
            description: t('gps.export.kmlDesc', 'For Google Earth'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <polygon points="10,8 16,12 10,16 10,8" fill="currentColor" />
                </svg>
            ),
            color: '#8B5CF6'
        }
    ];

    // Handle export option changes
    const handleOptionChange = (option, value) => {
        setExportOptions(prev => ({
            ...prev,
            [option]: value
        }));
    };

    // Handle export process
    const handleExport = async () => {
        if (!routeData || !selectedVehicle) {
            return;
        }

        setIsExporting(true);

        try {
            const exportData = {
                format: exportFormat,
                vehicle: selectedVehicle,
                dateRange,
                routeData,
                options: exportOptions
            };

            // Call the parent export handler
            if (onExport) {
                await onExport(exportData);
            } else {
                // Default export behavior
                await performExport(exportData);
            }

        } catch (error) {
            console.error('Export failed:', error);
            // Handle error (show toast, etc.)
        } finally {
            setIsExporting(false);
        }
    };

    // Default export implementation
    const performExport = async (exportData) => {
        const { format, vehicle, dateRange, routeData, options } = exportData;

        switch (format) {
            case 'pdf':
                await exportToPDF(exportData);
                break;
            case 'excel':
                await exportToExcel(exportData);
                break;
            case 'csv':
                await exportToCSV(exportData);
                break;
            case 'kml':
                await exportToKML(exportData);
                break;
            default:
                throw new Error('Unsupported export format');
        }
    };

    // PDF Export
    const exportToPDF = async (data) => {
        // Implement PDF generation
        const content = generatePDFContent(data);
        downloadFile(content, `route-${data.vehicle.name}-${formatDate(data.dateRange.startDate)}.pdf`, 'application/pdf');
    };

    // Excel Export
    const exportToExcel = async (data) => {
        const workbook = generateExcelWorkbook(data);
        downloadFile(workbook, `route-${data.vehicle.name}-${formatDate(data.dateRange.startDate)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    };

    // CSV Export
    const exportToCSV = async (data) => {
        const csv = generateCSV(data);
        downloadFile(csv, `route-${data.vehicle.name}-${formatDate(data.dateRange.startDate)}.csv`, 'text/csv');
    };

    // KML Export
    const exportToKML = async (data) => {
        const kml = generateKML(data);
        downloadFile(kml, `route-${data.vehicle.name}-${formatDate(data.dateRange.startDate)}.kml`, 'application/vnd.google-earth.kml+xml');
    };

    // Helper functions
    const generateCSV = (data) => {
        const headers = ['Timestamp', 'Latitude', 'Longitude', 'Speed', 'Address'];
        const rows = data.routeData.coordinates.map(coord => [
            new Date(coord.timestamp).toISOString(),
            coord.latitude,
            coord.longitude,
            coord.speed || 0,
            coord.address || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const generateKML = (data) => {
        const coordinates = data.routeData.coordinates.map(coord =>
            `${coord.longitude},${coord.latitude},0`
        ).join(' ');

        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${data.vehicle.name} Route</name>
    <Placemark>
      <name>Route ${formatDate(data.dateRange.startDate)}</name>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDate = (date) => {
        return new Date(date).toISOString().split('T')[0];
    };

    const generatePDFContent = (data) => {
        // This would integrate with a PDF library like jsPDF
        // For now, return a simple text representation
        return `Route Report for ${data.vehicle.name}\nDate: ${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}\n\nRoute data would be formatted here...`;
    };

    const generateExcelWorkbook = (data) => {
        // This would integrate with a library like SheetJS
        // For now, return CSV-like content
        return generateCSV(data);
    };

    if (!routeData || !selectedVehicle) {
        return (
            <div className="route-export-disabled">
                <div className="disabled-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" />
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <p>{t('gps.export.noData', 'No route data available for export')}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={`route-export ${isMobile ? 'mobile' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Export Header */}
            <div className="export-header">
                <div className="header-info">
                    <h4>{t('gps.export.title', 'Export Route Data')}</h4>
                    <p className="export-subtitle">
                        {selectedVehicle?.name} - {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
                    </p>
                </div>

                <div className="quick-actions">
                    <button
                        className="quick-export-btn"
                        onClick={() => {
                            setExportFormat('pdf');
                            handleExport();
                        }}
                        disabled={isExporting}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                            <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" />
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {t('gps.export.quickPdf', 'Quick PDF')}
                    </button>
                </div>
            </div>

            {/* Format Selection */}
            <div className="format-selection">
                <h5>{t('gps.export.selectFormat', 'Select Export Format')}</h5>
                <div className="format-grid">
                    {exportFormats.map(format => (
                        <button
                            key={format.id}
                            className={`format-card ${exportFormat === format.id ? 'selected' : ''}`}
                            onClick={() => setExportFormat(format.id)}
                            style={{ '--format-color': format.color }}
                        >
                            <div className="format-icon" style={{ color: format.color }}>
                                {format.icon}
                            </div>
                            <div className="format-info">
                                <h6>{format.label}</h6>
                                <p>{format.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Export Options */}
            <div className="export-options">
                <div className="options-header">
                    <h5>{t('gps.export.options', 'Export Options')}</h5>
                    <button
                        className="advanced-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {t('gps.export.advanced', 'Advanced')}
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className="basic-options">
                    <label className="option-item">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeMap}
                            onChange={(e) => handleOptionChange('includeMap', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <div className="option-info">
                            <span className="option-label">{t('gps.export.includeMap', 'Include Map')}</span>
                            <span className="option-desc">{t('gps.export.includeMapDesc', 'Visual route representation')}</span>
                        </div>
                    </label>

                    <label className="option-item">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeStats}
                            onChange={(e) => handleOptionChange('includeStats', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <div className="option-info">
                            <span className="option-label">{t('gps.export.includeStats', 'Include Statistics')}</span>
                            <span className="option-desc">{t('gps.export.includeStatsDesc', 'Speed, distance, duration metrics')}</span>
                        </div>
                    </label>

                    <label className="option-item">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeChart}
                            onChange={(e) => handleOptionChange('includeChart', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <div className="option-info">
                            <span className="option-label">{t('gps.export.includeChart', 'Include Charts')}</span>
                            <span className="option-desc">{t('gps.export.includeChartDesc', 'Speed and performance charts')}</span>
                        </div>
                    </label>
                </div>

                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            className="advanced-options"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <label className="option-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeTimeline}
                                    onChange={(e) => handleOptionChange('includeTimeline', e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <div className="option-info">
                                    <span className="option-label">{t('gps.export.includeTimeline', 'Include Timeline')}</span>
                                    <span className="option-desc">{t('gps.export.includeTimelineDesc', 'Detailed time-based events')}</span>
                                </div>
                            </label>

                            <label className="option-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeStops}
                                    onChange={(e) => handleOptionChange('includeStops', e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <div className="option-info">
                                    <span className="option-label">{t('gps.export.includeStops', 'Include Stops')}</span>
                                    <span className="option-desc">{t('gps.export.includeStopsDesc', 'Stop locations and durations')}</span>
                                </div>
                            </label>

                            <div className="option-item">
                                <label className="option-label">{t('gps.export.dateFormat', 'Date Format')}</label>
                                <select
                                    value={exportOptions.dateFormat}
                                    onChange={(e) => handleOptionChange('dateFormat', e.target.value)}
                                    className="date-format-select"
                                >
                                    <option value="international">{t('gps.export.dateInternational', 'International (DD/MM/YYYY)')}</option>
                                    <option value="us">{t('gps.export.dateUS', 'US (MM/DD/YYYY)')}</option>
                                    <option value="iso">{t('gps.export.dateISO', 'ISO (YYYY-MM-DD)')}</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Export Actions */}
            <div className="export-actions">
                <button
                    className="export-btn primary"
                    onClick={handleExport}
                    disabled={isExporting || isLoading}
                >
                    {isExporting ? (
                        <>
                            <div className="loading-spinner"></div>
                            {t('gps.export.exporting', 'Exporting...')}
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" />
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {t('gps.export.export', 'Export')} {exportFormats.find(f => f.id === exportFormat)?.label}
                        </>
                    )}
                </button>

                <button
                    className="export-btn secondary"
                    onClick={() => {
                        // Reset to defaults
                        setExportFormat('pdf');
                        setExportOptions({
                            includeMap: true,
                            includeStats: true,
                            includeChart: true,
                            includeTimeline: true,
                            includeStops: true,
                            dateFormat: 'international'
                        });
                        setShowAdvanced(false);
                    }}
                >
                    {t('gps.export.reset', 'Reset')}
                </button>
            </div>

            {/* Export Info */}
            <div className="export-info">
                <div className="info-item">
                    <span className="info-label">{t('gps.export.dataPoints', 'Data Points')}:</span>
                    <span className="info-value">{routeData?.coordinates?.length || 0}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">{t('gps.export.estimatedSize', 'Est. Size')}:</span>
                    <span className="info-value">
                        {exportFormat === 'pdf' ? '~2-5MB' :
                            exportFormat === 'excel' ? '~500KB-2MB' :
                                exportFormat === 'csv' ? '~100-500KB' :
                                    '~200KB-1MB'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default RouteExport;