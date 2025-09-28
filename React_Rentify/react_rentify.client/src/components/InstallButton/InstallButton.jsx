import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from 'react-i18next';

export default function InstallButton() {
    const { isInstallable, isInstalled, promptInstall } = usePWA();
    const { t } = useTranslation();

    if (isInstalled || !isInstallable) return null;

    return (
        <button
            onClick={promptInstall}
            className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-2 z-50"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            {t('install.app', 'Install App')}
        </button>
    );
}