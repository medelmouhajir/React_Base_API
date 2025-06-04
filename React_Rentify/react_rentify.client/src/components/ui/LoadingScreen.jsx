// src/components/ui/LoadingScreen.jsx
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import '../Loading/Loading.css';

const LoadingScreen = ({ message = null }) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const loadingMessage = message || t('common.loading');

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Logo with pulsing animation */}
            <div className="relative">
                <div className="loading-pulse">
                    <div></div>
                    <div></div>
                </div>
                <img
                    src="/logo.png"
                    alt="Rentify"
                    className="w-20 h-20 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
            </div>

            {/* Spinner */}
            <div className="mt-8">
                <div className="loading-spinner"></div>
            </div>

            {/* Loading text */}
            <p className={`mt-6 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loadingMessage}
            </p>

            {/* Loading dots animation */}
            <div className="mt-2 flex space-x-2">
                <span className="animate-bounce delay-75 h-2 w-2 rounded-full bg-primary-600"></span>
                <span className="animate-bounce delay-100 h-2 w-2 rounded-full bg-primary-600"></span>
                <span className="animate-bounce delay-150 h-2 w-2 rounded-full bg-primary-600"></span>
            </div>
        </div>
    );
};

export default LoadingScreen;