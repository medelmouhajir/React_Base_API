import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './FloatingActionButton.css';


const FloatingActionButton = ({
    isVisible = true,
    onToggleQuickActions,
    hasAlerts = false,
    className = ''
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`fab-container ${className}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                >
                    <motion.button
                        className={`fab-button ${hasAlerts ? 'has-alerts' : ''}`}
                        onClick={onToggleQuickActions}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        aria-label={t('gps.modern.quickActions.title', 'Quick Actions')}
                    >
                        <motion.svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            animate={{ rotate: hasAlerts ? [0, 10, -10, 0] : 0 }}
                            transition={{
                                repeat: hasAlerts ? Infinity : 0,
                                duration: 0.5,
                                repeatDelay: 2
                            }}
                        >
                            <path
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </motion.svg>

                        {/* Alert Indicator */}
                        <AnimatePresence>
                            {hasAlerts && (
                                <motion.div
                                    className="fab-alert-indicator"
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [1, 0.7, 1]
                                    }}
                                    exit={{ scale: 0 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Ripple Effect */}
                        <motion.div
                            className="fab-ripple"
                            animate={{
                                scale: [0.8, 2],
                                opacity: [0.6, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeOut"
                            }}
                        />
                    </motion.button>

                    {/* Tooltip */}
                    {/*<motion.div*/}
                    {/*    className="fab-tooltip"*/}
                    {/*    initial={{ opacity: 0, x: 10 }}*/}
                    {/*    animate={{ opacity: 1, x: 0 }}*/}
                    {/*    exit={{ opacity: 0, x: 10 }}*/}
                    {/*    transition={{ delay: 1 }}*/}
                    {/*>*/}
                    {/*    {t('gps.modern.quickActions', 'Quick Actions')}*/}
                    {/*</motion.div>*/}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloatingActionButton;