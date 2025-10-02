import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import './NotificationBell.css';

const NotificationBell = () => {
    const { unreadCount, setIsDrawerOpen, isDrawerOpen } = useNotifications();
    const { isDarkMode } = useTheme();

    const handleClick = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    return (
        <button
            className={`notification-bell ${isDarkMode ? 'dark' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
            onClick={handleClick}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
            {unreadCount > 0 && <span className="notification-pulse" />}
        </button>
    );
};

export default NotificationBell;