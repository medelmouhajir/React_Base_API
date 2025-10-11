// src/pages/Gps/Home/components/RoutePanel/SpeedColorLegend.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { createSpeedLegend } from '../../utils/speedColorUtils';

const SpeedColorLegend = ({ showDescription = true }) => {
    const { t } = useTranslation();
    const legendData = createSpeedLegend();

    return (
        <div className="speed-color-legend">
            {showDescription && (
                <div className="legend-description">
                    <h4>{t('gps.legend.title', 'Speed Color Legend')}</h4>
                    <p>{t('gps.legend.description', 'Route segments are colored based on vehicle speed to help you understand driving patterns.')}</p>
                </div>
            )}

            <div className="legend-items">
                {legendData.map(item => (
                    <div key={item.category} className="legend-item">
                        <div className="legend-visual">
                            <div
                                className="color-bar"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="legend-icon">{item.icon}</span>
                        </div>

                        <div className="legend-text">
                            <div className="legend-label">{item.label}</div>
                            <div className="legend-range">{item.range}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="legend-additional-info">
                <div className="info-section">
                    <h5>{t('gps.legend.ignitionTitle', 'Ignition Status')}</h5>
                    <div className="legend-item">
                        <div className="legend-visual">
                            <span className="legend-icon">🔥</span>
                        </div>
                        <div className="legend-text">
                            <div className="legend-label">{t('gps.legend.ignitionOn', 'Engine On')}</div>
                            <div className="legend-range">{t('gps.legend.ignitionOnDesc', 'Vehicle is running')}</div>
                        </div>
                    </div>

                    <div className="legend-item">
                        <div className="legend-visual">
                            <span className="legend-icon">❄️</span>
                        </div>
                        <div className="legend-text">
                            <div className="legend-label">{t('gps.legend.ignitionOff', 'Engine Off')}</div>
                            <div className="legend-range">{t('gps.legend.ignitionOffDesc', 'Vehicle is parked')}</div>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <h5>{t('gps.legend.readingTips', 'Reading Tips')}</h5>
                    <ul className="tips-list">
                        <li>{t('gps.legend.tip1', 'Thicker lines indicate higher speeds')}</li>
                        <li>{t('gps.legend.tip2', 'Gray segments show stationary periods')}</li>
                        <li>{t('gps.legend.tip3', 'Red segments indicate potential speeding')}</li>
                        <li>{t('gps.legend.tip4', 'Use timeline to replay the journey')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SpeedColorLegend;