// src/layouts/LandingLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSelector from '../components/ui/LanguageSelector';
import ThemeToggle from '../components/ui/ThemeToggle';
import Loading from '../components/Loading/Loading';
import './LandingLayout.css';

const LandingLayout = () => {
    const { user, loading } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Track scroll position for navbar styling
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }

        // Simulate page transition effect
        setPageLoading(true);
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [user, loading, navigate]);

    // Define main navigation items
    const navItems = [
        { path: '#features', label: t('landing.features') },
        { path: '#benefits', label: t('landing.benefits') },
        { path: '#pricing', label: t('landing.pricing') },
        { path: '#contact', label: t('landing.contact') }
    ];

    // Function to determine if link is active
    const isActive = (path) => {
        if (path.startsWith('#')) {
            return window.location.hash === path;
        }
        return window.location.pathname === path;
    };

    return (
        <div className={`landing-layout ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Landing navbar */}
            <header className={`landing-header ${isScrolled ? 'landing-header-scrolled' : ''} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="landing-header-container">
                    {/* Logo */}
                    <a href="#" className="landing-logo">
                        <img src="/logo.png" alt="Rentify" />
                        <span className={`landing-logo-text ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rentify</span>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="landing-nav">
                        {navItems.map(item => (
                            <a
                                key={item.path}
                                href={item.path}
                                className={`landing-nav-link ${isActive(item.path) ? 'landing-nav-link-active' : ''} ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        <LanguageSelector />
                        <ThemeToggle />

                        <div className="hidden md:flex items-center space-x-2">
                            <NavLink
                                to="/login"
                                className={`px-3 py-2 rounded-md text-sm font-medium ${isDarkMode
                                        ? 'text-white hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {t('auth.login')}
                            </NavLink>
                            <NavLink
                                to="/register"
                                className="px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                {t('auth.register')}
                            </NavLink>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="landing-mobile-menu-button md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded={mobileMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg
                                className={`h-6 w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`landing-mobile-menu ${mobileMenuOpen ? 'open' : ''} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <nav className="landing-mobile-nav">
                        {navItems.map(item => (
                            <a
                                key={item.path}
                                href={item.path}
                                className={`landing-mobile-nav-link ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        ))}
                        <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                            <NavLink
                                to="/login"
                                className={`landing-mobile-nav-link ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('auth.login')}
                            </NavLink>
                            <NavLink
                                to="/register"
                                className={`landing-mobile-nav-link font-semibold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-primary-50 text-primary-700'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('auth.register')}
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="landing-main">
                {pageLoading ? (
                    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                        <Loading type="pulse" />
                    </div>
                ) : (
                    <div className="page-fade-enter page-fade-enter-active">
                        <Outlet />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className={`landing-footer ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="landing-footer-container">
                    <div className="landing-footer-grid">
                        {/* Company info */}
                        <div className="landing-footer-column">
                            <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('footer.company')}</h3>
                            <div className="landing-footer-links">
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.about')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.careers')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.blog')}</a>
                            </div>
                        </div>

                        {/* Services */}
                        <div className="landing-footer-column">
                            <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('footer.services')}</h3>
                            <div className="landing-footer-links">
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.carRental')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.fleetManagement')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.maintenance')}</a>
                            </div>
                        </div>

                        {/* Support */}
                        <div className="landing-footer-column">
                            <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('footer.support')}</h3>
                            <div className="landing-footer-links">
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.help')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.faq')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.contact')}</a>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="landing-footer-column">
                            <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('footer.legal')}</h3>
                            <div className="landing-footer-links">
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.terms')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.privacy')}</a>
                                <a href="#" className={`landing-footer-link ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('footer.cookies')}</a>
                            </div>
                        </div>
                    </div>

                    <div className="landing-footer-bottom">
                        <div className="landing-footer-social">
                            <a href="#" className="landing-footer-social-link" aria-label="Facebook">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="#" className="landing-footer-social-link" aria-label="Twitter">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                            <a href="#" className="landing-footer-social-link" aria-label="Instagram">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            &copy; {new Date().getFullYear()} Rentify. {t('common.allRightsReserved')}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingLayout;