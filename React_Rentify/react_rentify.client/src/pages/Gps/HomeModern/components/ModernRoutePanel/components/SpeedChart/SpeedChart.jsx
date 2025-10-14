// src/pages/Gps/HomeModern/SpeedChart.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './SpeedChart.css';

const SpeedChart = ({
    data = [],
    selectedMetric = 'speed',
    onMetricChange,
    isMobile = false,
    height = 300
}) => {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

    // Metric options
    const metrics = [
        {
            id: 'speed',
            label: t('gps.chart.speed', 'Speed'),
            unit: 'km/h',
            color: '#3B82F6',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        },
        {
            id: 'distance',
            label: t('gps.chart.distance', 'Distance'),
            unit: 'km',
            color: '#10B981',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        },
        {
            id: 'stops',
            label: t('gps.chart.stops', 'Stops'),
            unit: 'count',
            color: '#F59E0B',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                    <rect x="9" y="9" width="6" height="6" fill="currentColor" />
                </svg>
            )
        }
    ];

    const currentMetric = metrics.find(m => m.id === selectedMetric) || metrics[0];

    // Process data based on selected metric
    const processedData = useMemo(() => {
        if (!data?.length) return [];

        return data.map((point, index) => {
            let value;
            switch (selectedMetric) {
                case 'distance':
                    value = point.distance || 0;
                    break;
                case 'stops':
                    value = point.isStop ? 1 : 0;
                    break;
                default:
                    value = point.value || point.speed || 0;
            }

            return {
                ...point,
                value,
                index,
                timestamp: point.time || point.timestamp,
                formattedTime: new Date(point.time || point.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        });
    }, [data, selectedMetric]);

    // Chart dimensions and scales
    const chartData = useMemo(() => {
        if (!processedData.length) return null;

        const values = processedData.map(d => d.value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = (isMobile ? 280 : 400) - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const points = processedData.map((d, i) => ({
            ...d,
            x: padding.left + (i / (processedData.length - 1)) * chartWidth,
            y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight
        }));

        return {
            points,
            maxValue,
            minValue,
            range,
            padding,
            chartWidth,
            chartHeight
        };
    }, [processedData, isMobile, height]);

    // Draw chart on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !chartData) return;

        const ctx = canvas.getContext('2d');
        const { points, padding, chartWidth, chartHeight, maxValue, minValue } = chartData;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (isMobile ? 280 : 400) * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${isMobile ? 280 : 400}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = padding.left + (i / 6) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();
        }

        // Draw area under curve
        if (points.length > 1) {
            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
            gradient.addColorStop(0, `${currentMetric.color}20`);
            gradient.addColorStop(1, `${currentMetric.color}05`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(points[0].x, padding.top + chartHeight);
            points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
            ctx.closePath();
            ctx.fill();
        }

        // Draw line
        if (points.length > 1) {
            ctx.strokeStyle = currentMetric.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.slice(1).forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }

        // Draw points
        points.forEach((point, index) => {
            ctx.fillStyle = currentMetric.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, hoveredPoint === index ? 6 : 3, 0, Math.PI * 2);
            ctx.fill();

            // Highlight hovered point
            if (hoveredPoint === index) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (maxValue - minValue) * (1 - i / 5);
            const y = padding.top + (i / 5) * chartHeight;
            ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
        }

        // X-axis labels (time)
        ctx.textAlign = 'center';
        for (let i = 0; i <= 6; i++) {
            const pointIndex = Math.floor((i / 6) * (points.length - 1));
            const point = points[pointIndex];
            if (point) {
                ctx.fillText(point.formattedTime, point.x, padding.top + chartHeight + 25);
            }
        }

    }, [chartData, hoveredPoint, currentMetric, isMobile, height]);

    // Handle mouse events
    const handleMouseMove = (e) => {
        if (!chartData) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find closest point
        let closestPoint = null;
        let closestDistance = Infinity;
        let closestIndex = -1;

        chartData.points.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < closestDistance && distance < 20) {
                closestDistance = distance;
                closestPoint = point;
                closestIndex = index;
            }
        });

        if (closestPoint) {
            setHoveredPoint(closestIndex);
            setTooltip({
                show: true,
                x: e.clientX,
                y: e.clientY,
                data: closestPoint
            });
        } else {
            setHoveredPoint(null);
            setTooltip(prev => ({ ...prev, show: false }));
        }
    };

    const handleMouseLeave = () => {
        setHoveredPoint(null);
        setTooltip(prev => ({ ...prev, show: false }));
    };

    if (!data?.length) {
        return (
            <div className="speed-chart-empty">
                <div className="empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3v18h18M9 17V9M13 17v-6M17 17v-4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <p>{t('gps.chart.noData', 'No chart data available')}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={`speed-chart ${isMobile ? 'mobile' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Chart Header */}
            <div className="chart-header">
                <div className="chart-title">
                    <h4>{t('gps.chart.title', 'Performance Chart')}</h4>
                    <span className="chart-subtitle">
                        {currentMetric.label} {t('gps.chart.overtime', 'over time')}
                    </span>
                </div>

                {/* Metric Selector */}
                <div className="metric-selector">
                    {metrics.map(metric => (
                        <button
                            key={metric.id}
                            className={`metric-btn ${selectedMetric === metric.id ? 'active' : ''}`}
                            onClick={() => onMetricChange?.(metric.id)}
                            style={{ '--metric-color': metric.color }}
                        >
                            {metric.icon}
                            <span>{metric.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Container */}
            <div className="chart-container">
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: hoveredPoint !== null ? 'pointer' : 'default' }}
                />

                {/* Chart Labels */}
                <div className="chart-labels">
                    <div className="y-axis-label">
                        {currentMetric.label} ({currentMetric.unit})
                    </div>
                    <div className="x-axis-label">
                        {t('gps.chart.time', 'Time')}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            {chartData && (
                <div className="chart-stats">
                    <div className="stat-item">
                        <span className="stat-label">{t('gps.chart.max', 'Max')}</span>
                        <span className="stat-value">
                            {chartData.maxValue.toFixed(1)} {currentMetric.unit}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('gps.chart.avg', 'Avg')}</span>
                        <span className="stat-value">
                            {(processedData.reduce((sum, d) => sum + d.value, 0) / processedData.length).toFixed(1)} {currentMetric.unit}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('gps.chart.min', 'Min')}</span>
                        <span className="stat-value">
                            {chartData.minValue.toFixed(1)} {currentMetric.unit}
                        </span>
                    </div>
                </div>
            )}

            {/* Tooltip */}
            <AnimatePresence>
                {tooltip.show && tooltip.data && (
                    <motion.div
                        className="chart-tooltip"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'fixed',
                            left: tooltip.x + 10,
                            top: tooltip.y - 10,
                            pointerEvents: 'none',
                            zIndex: 1000
                        }}
                    >
                        <div className="tooltip-content">
                            <div className="tooltip-time">
                                {tooltip.data.formattedTime}
                            </div>
                            <div className="tooltip-value">
                                {tooltip.data.value.toFixed(1)} {currentMetric.unit}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SpeedChart;