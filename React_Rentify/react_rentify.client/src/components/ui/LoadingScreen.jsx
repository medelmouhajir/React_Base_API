// src/components/ui/LoadingScreen.jsx
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import '../ui/LoadingScreen.css';

const LoadingScreen = ({ message = null }) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const loadingMessage = message || t('common.loading');

    return (
        <div className={`ls-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Logo with pulsing animation */}
            <div className="ls-logo-wrapper">
                <div className="ls-pulse">
                    <div></div>
                    <div></div>
                </div>
                <img
                    src="/logo.png"
                    alt="Rentify"
                    className="ls-logo"
                />
            </div>

            {/* Spinner */}
            <div className="ls-spinner-wrapper">
                <div className="ls-spinner"></div>
            </div>

            {/* Loading text */}
            <p className={`ls-text ${isDarkMode ? 'dark-text' : ''}`}>
                {loadingMessage}
            </p>

            {/* Loading dots animation */}
            <div className="ls-dots-wrapper">
                <span className="ls-dot delay-1"></span>
                <span className="ls-dot delay-2"></span>
                <span className="ls-dot delay-3"></span>
            </div>
        </div>
    );
};

export default LoadingScreen;
