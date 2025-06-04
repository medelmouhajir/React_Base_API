// src/components/ui/LoadingScreen.jsx
import { useTheme } from '../../contexts/ThemeContext';

const LoadingScreen = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="w-24 h-24 relative">
                <div className="animate-pulse">
                    <img src="/logo.png" alt="Rentify" className="w-full h-full" />
                </div>
            </div>

            <div className="mt-8">
                <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>

            <p className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Loading...
            </p>
        </div>
    );
};

export default LoadingScreen;