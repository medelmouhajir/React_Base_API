import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const EmptyState = ({
    hasSearch = false,
    hasFilters = false,
    onClear,
    onRefresh,
    type = 'vehicles', // vehicles, routes, alerts
    customTitle,
    customMessage,
    customIcon
}) => {
    const { t } = useTranslation();

    const getEmptyStateConfig = () => {
        if (hasSearch && hasFilters) {
            return {
                icon: customIcon || (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor" opacity="0.3" />
                    </svg>
                ),
                title: customTitle || t('gps.modern.empty.searchAndFilter.title', 'No matching results'),
                message: customMessage || t('gps.modern.empty.searchAndFilter.message', 'Try adjusting your search terms or filters to find what you\'re looking for.'),
                actions: [
                    {
                        label: t('gps.modern.empty.clearFilters', 'Clear Filters'),
                        action: onClear,
                        primary: true
                    }
                ]
            };
        }

        if (hasSearch) {
            return {
                icon: customIcon || (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                ),
                title: customTitle || t('gps.modern.empty.search.title', 'No search results'),
                message: customMessage || t('gps.modern.empty.search.message', 'We couldn\'t find any vehicles matching your search. Try different keywords.'),
                actions: [
                    {
                        label: t('gps.modern.empty.clearSearch', 'Clear Search'),
                        action: onClear,
                        primary: true
                    }
                ]
            };
        }

        if (hasFilters) {
            return {
                icon: customIcon || (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor" opacity="0.3" />
                    </svg>
                ),
                title: customTitle || t('gps.modern.empty.filters.title', 'No vehicles match your filters'),
                message: customMessage || t('gps.modern.empty.filters.message', 'Try adjusting your status or type filters to see more results.'),
                actions: [
                    {
                        label: t('gps.modern.empty.clearFilters', 'Clear Filters'),
                        action: onClear,
                        primary: true
                    }
                ]
            };
        }

        // Default empty states by type
        switch (type) {
            case 'vehicles':
                return {
                    icon: customIcon || (
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" opacity="0.3" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
                        </svg>
                    ),
                    title: customTitle || t('gps.modern.empty.vehicles.title', 'No vehicles found'),
                    message: customMessage || t('gps.modern.empty.vehicles.message', 'There are no vehicles in your fleet yet. Add vehicles to start tracking.'),
                    actions: [
                        {
                            label: t('gps.modern.empty.refresh', 'Refresh'),
                            action: onRefresh,
                            primary: true
                        }
                    ]
                };

            case 'routes':
                return {
                    icon: customIcon || (
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L13.09 8.26L18 7L16.74 12.74L22 14L15.74 15.26L17 21L11.26 19.74L10 24L8.74 19.74L3 21L4.26 15.26L2 14L7.26 12.74L6 7L10.91 8.26L12 2Z" fill="currentColor" opacity="0.3" />
                            <path d="M9 9l6 6M9 15l6-6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                        </svg>
                    ),
                    title: customTitle || t('gps.modern.empty.routes.title', 'No route data'),
                    message: customMessage || t('gps.modern.empty.routes.message', 'No route information is available for the selected time period.'),
                    actions: [
                        {
                            label: t('gps.modern.empty.changeDateRange', 'Change Date Range'),
                            action: onClear,
                            primary: true
                        }
                    ]
                };

            case 'alerts':
                return {
                    icon: customIcon || (
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" opacity="0.3" />
                            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    ),
                    title: customTitle || t('gps.modern.empty.alerts.title', 'All clear!'),
                    message: customMessage || t('gps.modern.empty.alerts.message', 'No active alerts at the moment. Your fleet is running smoothly.'),
                    actions: []
                };

            default:
                return {
                    icon: customIcon || (
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    ),
                    title: customTitle || t('gps.modern.empty.default.title', 'Nothing to show'),
                    message: customMessage || t('gps.modern.empty.default.message', 'No data is currently available.'),
                    actions: []
                };
        }
    };

    const config = getEmptyStateConfig();

    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {/* Animated Icon */}
            <motion.div
                className="empty-icon"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                {config.icon}
            </motion.div>

            {/* Title */}
            <motion.h3
                className="empty-title"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                {config.title}
            </motion.h3>

            {/* Message */}
            <motion.p
                className="empty-message"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
            >
                {config.message}
            </motion.p>

            {/* Actions */}
            {config.actions.length > 0 && (
                <motion.div
                    className="empty-actions"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                >
                    {config.actions.map((action, index) => (
                        <motion.button
                            key={index}
                            className={`empty-btn ${action.primary ? 'primary' : 'secondary'}`}
                            onClick={action.action}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={!action.action}
                        >
                            {action.icon && (
                                <span className="btn-icon">{action.icon}</span>
                            )}
                            {action.label}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Helpful Tips */}
            <motion.div
                className="empty-tips"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
            >
                {(hasSearch || hasFilters) && (
                    <div className="tip-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span>
                            {t('gps.modern.empty.tip.searchFilters', 'Try using broader search terms or removing filters')}
                        </span>
                    </div>
                )}

                {type === 'vehicles' && !hasSearch && !hasFilters && (
                    <div className="tip-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L13.09 8.26L18 7L16.74 12.74L22 14L15.74 15.26L17 21L11.26 19.74L10 24L8.74 19.74L3 21L4.26 15.26L2 14L7.26 12.74L6 7L10.91 8.26L12 2Z" fill="currentColor" />
                        </svg>
                        <span>
                            {t('gps.modern.empty.tip.vehicles', 'Check your network connection and try refreshing')}
                        </span>
                    </div>
                )}
            </motion.div>

            {/* Animated Background Elements */}
            <div className="empty-background">
                <motion.div
                    className="bg-element bg-element-1"
                    animate={{
                        y: [0, -10, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="bg-element bg-element-2"
                    animate={{
                        y: [0, 15, 0],
                        opacity: [0.05, 0.15, 0.05]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
                <motion.div
                    className="bg-element bg-element-3"
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.08, 0.18, 0.08]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                />
            </div>
        </motion.div>
    );
};

export default EmptyState;