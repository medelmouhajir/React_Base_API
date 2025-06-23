// src/components/Studio/BackgroundTasksIndicator/BackgroundTasksIndicator.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageGeneration } from '../../../contexts/ImageGenerationContext';
import { useTranslation } from 'react-i18next';
import './BackgroundTasksIndicator.css';

const BackgroundTasksIndicator = () => {
    const { backgroundTasks } = useImageGeneration();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const aiStatus = backgroundTasks.some(task => task.status !== 'completed')
        ? 'busy'
        : 'ready';



    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    return (
        <div className="studio-tasks">
            {/* AI Status Indicator */}
            <div
                className={`studio-header__ai-status ${backgroundTasks.length > 0 ? 'studio-header__ai-status--busy' : ''}`}
                onClick={toggleDropdown}
            >
                <div
                    className={`studio-header__ai-indicator ${aiStatus === 'ready'
                            ? 'studio-header__ai-indicator--active'
                            : 'studio-header__ai-indicator--busy'
                        }`}
                ></div>
                <span>AI {t('studio.ai.tasks.status.' + aiStatus)}</span>

                {backgroundTasks.length > 0 && (
                    <div className="studio-tasks__badge">{backgroundTasks.length}</div>
                )}
            </div>

            {/* Tasks Dropdown */}
            {isDropdownOpen && backgroundTasks.length > 0 && (
                <div className="studio-tasks__dropdown">
                    <div className="studio-tasks__header">
                        <h3 className="studio-tasks__title">{t('studio.ai.status.title')}</h3>
                        <span className="studio-tasks__count">{backgroundTasks.length}</span>
                    </div>

                    <div className="studio-tasks__list">
                        {backgroundTasks.map(task => (
                            <div
                                key={task.id}
                                className={`studio-tasks__item studio-tasks__item--${task.status}`}
                                onClick={() => {
                                    if (task.status === 'completed' && task.result?.generationId) {
                                        navigate(`/assets/generations/${task.result.generationId}`);
                                    }
                                }}
                                style={{ cursor: task.status === 'completed' ? 'pointer' : 'default' }}
                            >
                                <div className="studio-tasks__item-icon">
                                    {task.status === 'pending' && (
                                        <svg className="spinner" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" />
                                        </svg>
                                    )}
                                    {task.status === 'completed' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                    {task.status === 'failed' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>

                                <div className="studio-tasks__item-content">
                                    <div className="studio-tasks__item-title">{task.title}</div>
                                    <div className="studio-tasks__item-description">{task.description}</div>

                                    {task.status === 'failed' && (
                                        <div className="studio-tasks__item-error">{task.error}</div>
                                    )}

                                    {task.startTime && (
                                        <div className="studio-tasks__item-time">
                                            Started: {new Date(task.startTime).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackgroundTasksIndicator;