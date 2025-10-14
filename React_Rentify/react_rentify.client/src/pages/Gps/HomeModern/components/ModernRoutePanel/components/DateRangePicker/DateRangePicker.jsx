// src/pages/Gps/HomeModern/components/ModernRoutePanel/DateRangePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './DateRangePicker.css';

const DateRangePicker = ({
    value = { startDate: new Date(), endDate: new Date() },
    onChange,
    isMobile = false,
    maxDate = new Date(),
    minDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [tempStartDate, setTempStartDate] = useState(value.startDate);
    const [tempEndDate, setTempEndDate] = useState(value.endDate);
    const [currentView, setCurrentView] = useState('presets'); // presets, custom
    const pickerRef = useRef(null);

    // Preset options
    const presets = [
        {
            key: 'today',
            label: t('gps.dateRange.today', 'Today'),
            getValue: () => {
                const today = new Date();
                return {
                    startDate: new Date(today.setHours(0, 0, 0, 0)),
                    endDate: new Date(today.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'yesterday',
            label: t('gps.dateRange.yesterday', 'Yesterday'),
            getValue: () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
                    endDate: new Date(yesterday.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'last7days',
            label: t('gps.dateRange.last7Days', 'Last 7 Days'),
            getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(end.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'last30days',
            label: t('gps.dateRange.last30Days', 'Last 30 Days'),
            getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 29);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(end.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'thisWeek',
            label: t('gps.dateRange.thisWeek', 'This Week'),
            getValue: () => {
                const today = new Date();
                const start = new Date(today);
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
                start.setDate(diff);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(today.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'lastWeek',
            label: t('gps.dateRange.lastWeek', 'Last Week'),
            getValue: () => {
                const today = new Date();
                const start = new Date(today);
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1) - 7; // Previous Monday
                start.setDate(diff);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(end.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'thisMonth',
            label: t('gps.dateRange.thisMonth', 'This Month'),
            getValue: () => {
                const today = new Date();
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(today.setHours(23, 59, 59, 999))
                };
            }
        },
        {
            key: 'lastMonth',
            label: t('gps.dateRange.lastMonth', 'Last Month'),
            getValue: () => {
                const today = new Date();
                const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const end = new Date(today.getFullYear(), today.getMonth(), 0);
                return {
                    startDate: new Date(start.setHours(0, 0, 0, 0)),
                    endDate: new Date(end.setHours(23, 59, 59, 999))
                };
            }
        }
    ];

    // Close picker on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Update temp dates when value changes
    useEffect(() => {
        setTempStartDate(value.startDate);
        setTempEndDate(value.endDate);
    }, [value]);

    // Format date for display
    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format datetime for input
    const formatDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    // Get display text for current selection
    const getDisplayText = () => {
        if (!value.startDate || !value.endDate) return t('gps.dateRange.selectRange', 'Select Range');

        const start = formatDate(value.startDate);
        const end = formatDate(value.endDate);

        if (start === end) {
            return start;
        }

        return `${start} - ${end}`;
    };

    // Check if a preset is currently selected
    const isPresetSelected = (preset) => {
        const presetValue = preset.getValue();
        return (
            value.startDate?.toDateString() === presetValue.startDate.toDateString() &&
            value.endDate?.toDateString() === presetValue.endDate.toDateString()
        );
    };

    // Handle preset selection
    const handlePresetSelect = (preset) => {
        const presetValue = preset.getValue();
        setSelectedPreset(preset.key);
        if (onChange) {
            onChange(presetValue);
        }
        setIsOpen(false);
    };

    // Handle custom date application
    const handleApplyCustom = () => {
        if (tempStartDate && tempEndDate && onChange) {
            onChange({
                startDate: tempStartDate,
                endDate: tempEndDate
            });
        }
        setIsOpen(false);
    };

    // Handle custom date reset
    const handleResetCustom = () => {
        setTempStartDate(value.startDate);
        setTempEndDate(value.endDate);
        setCurrentView('presets');
    };

    return (
        <div className={`date-range-picker ${isMobile ? 'mobile' : ''}`} ref={pickerRef}>
            {/* Trigger Button */}
            <motion.button
                className="date-trigger"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.98 }}
                title={t('gps.dateRange.selectDateRange', 'Select date range')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="date-text">{getDisplayText()}</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`chevron ${isOpen ? 'open' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
                </svg>
            </motion.button>

            {/* Picker Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="date-picker-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* View Toggle */}
                        <div className="picker-header">
                            <div className="view-tabs">
                                <button
                                    className={`view-tab ${currentView === 'presets' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('presets')}
                                >
                                    {t('gps.dateRange.presets', 'Presets')}
                                </button>
                                <button
                                    className={`view-tab ${currentView === 'custom' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('custom')}
                                >
                                    {t('gps.dateRange.custom', 'Custom')}
                                </button>
                            </div>
                        </div>

                        {/* Presets View */}
                        <AnimatePresence mode="wait">
                            {currentView === 'presets' && (
                                <motion.div
                                    key="presets"
                                    className="presets-view"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {presets.map((preset) => (
                                        <motion.button
                                            key={preset.key}
                                            className={`preset-btn ${isPresetSelected(preset) ? 'active' : ''}`}
                                            onClick={() => handlePresetSelect(preset)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="preset-label">{preset.label}</span>
                                            {isPresetSelected(preset) && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                            )}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Custom View */}
                            {currentView === 'custom' && (
                                <motion.div
                                    key="custom"
                                    className="custom-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="custom-inputs">
                                        <div className="input-group">
                                            <label className="input-label">
                                                {t('gps.dateRange.startDate', 'Start Date')}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="date-input"
                                                value={formatDateTimeLocal(tempStartDate)}
                                                onChange={(e) => setTempStartDate(new Date(e.target.value))}
                                                max={formatDateTimeLocal(maxDate)}
                                                min={formatDateTimeLocal(minDate)}
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label className="input-label">
                                                {t('gps.dateRange.endDate', 'End Date')}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="date-input"
                                                value={formatDateTimeLocal(tempEndDate)}
                                                onChange={(e) => setTempEndDate(new Date(e.target.value))}
                                                max={formatDateTimeLocal(maxDate)}
                                                min={formatDateTimeLocal(tempStartDate || minDate)}
                                            />
                                        </div>
                                    </div>

                                    <div className="custom-actions">
                                        <button
                                            className="action-btn secondary"
                                            onClick={handleResetCustom}
                                        >
                                            {t('gps.dateRange.cancel', 'Cancel')}
                                        </button>
                                        <button
                                            className="action-btn primary"
                                            onClick={handleApplyCustom}
                                            disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                                        >
                                            {t('gps.dateRange.apply', 'Apply')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DateRangePicker;