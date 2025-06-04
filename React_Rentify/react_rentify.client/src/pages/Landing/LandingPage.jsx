// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

// Feature icons
const features = [
    {
        id: 'fleet',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 4h-4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2zm0 0H5a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
            </svg>
        )
    },
    {
        id: 'reservations',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
        )
    },
    {
        id: 'customers',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
        )
    },
    {
        id: 'gps',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        )
    },
    {
        id: 'reports',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
        )
    },
    {
        id: 'maintenance',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        )
    }
];

// Pricing tiers
const pricingTiers = [
    {
        id: 'basic',
        price: 299,
        features: ['basic.feature1', 'basic.feature2', 'basic.feature3', 'basic.feature4']
    },
    {
        id: 'pro',
        price: 599,
        features: ['pro.feature1', 'pro.feature2', 'pro.feature3', 'pro.feature4', 'pro.feature5', 'pro.feature6']
    },
    {
        id: 'enterprise',
        price: 999,
        features: ['enterprise.feature1', 'enterprise.feature2', 'enterprise.feature3', 'enterprise.feature4', 'enterprise.feature5', 'enterprise.feature6', 'enterprise.feature7']
    }
];

const LandingPage = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="space-y-20">
            {/* Hero section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
                        <div className="sm:text-center lg:text-left">
                            <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                                <span className="block">{t('landing.hero.title1')}</span>
                                <span className="block text-primary-600">{t('landing.hero.title2')}</span>
                            </h1>
                            <p className={`mt-3 text-base sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto lg:mx-0 md:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {t('landing.hero.description')}
                            </p>
                            <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                                <div className="rounded-md shadow">
                                    <a
                                        href="/register"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                                    >
                                        {t('landing.hero.cta')}
                                    </a>
                                </div>
                                <div className="mt-3 sm:mt-0 sm:ml-3">
                                    <a
                                        href="#features"
                                        className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md ${isDarkMode
                                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } md:py-4 md:text-lg md:px-10`}
                                    >
                                        {t('landing.hero.learnMore')}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 sm:mt-16 lg:mt-0 lg:relative">
                            <div className="sm:max-w-md sm:mx-auto lg:max-w-none">
                                <img
                                    className="w-full rounded-lg shadow-xl"
                                    src="/dashboard-preview.png"
                                    alt="Dashboard preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features section */}
            <section id="features" className={`py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold sm:text-4xl">
                            {t('landing.features.title')}
                        </h2>
                        <p className={`mt-3 max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('landing.features.subtitle')}
                        </p>
                    </div>

                    <div className="mt-12">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.id} className={`pt-6 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
                                    <div className="px-6">
                                        <div className={`${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="mt-4 text-lg font-medium">{t(`landing.features.${feature.id}.title`)}</h3>
                                        <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {t(`landing.features.${feature.id}.description`)}
                                        </p>
                                    </div>
                                    <div className="px-6 pt-4 pb-6">
                                        <a
                                            href={`#${feature.id}`}
                                            className={`text-base font-medium ${isDarkMode ? 'text-primary-400' : 'text-primary-600'} hover:underline`}
                                        >
                                            {t('landing.features.learnMore')} →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits section */}
            <section id="benefits" className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold sm:text-4xl">
                            {t('landing.benefits.title')}
                        </h2>
                        <p className={`mt-3 max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('landing.benefits.subtitle')}
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            <div>
                                <div className={`flex items-center justify-center h-12 w-12 rounded-md ${isDarkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-500 text-white'}`}>
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="mt-5">
                                    <h3 className="text-lg font-medium">{t('landing.benefits.timeTitle')}</h3>
                                    <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {t('landing.benefits.timeDescription')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 lg:mt-0">
                                <div className={`flex items-center justify-center h-12 w-12 rounded-md ${isDarkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-500 text-white'}`}>
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>
                                <div className="mt-5">
                                    <h3 className="text-lg font-medium">{t('landing.benefits.moneyTitle')}</h3>
                                    <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {t('landing.benefits.moneyDescription')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 lg:mt-0">
                                <div className={`flex items-center justify-center h-12 w-12 rounded-md ${isDarkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-500 text-white'}`}>
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                </div>
                                <div className="mt-5">
                                    <h3 className="text-lg font-medium">{t('landing.benefits.securityTitle')}</h3>
                                    <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {t('landing.benefits.securityDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing section */}
            <section id="pricing" className={`py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold sm:text-4xl">
                            {t('landing.pricing.title')}
                        </h2>
                        <p className={`mt-3 max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('landing.pricing.subtitle')}
                        </p>
                    </div>

                    <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
                        {pricingTiers.map((tier) => (
                            <div
                                key={tier.id}
                                className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}
                            >
                                <div className="p-6">
                                    <h2 className="text-2xl font-medium">{t(`landing.pricing.${tier.id}.title`)}</h2>
                                    <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {t(`landing.pricing.${tier.id}.description`)}
                                    </p>
                                    <p className="mt-8">
                                        <span className="text-4xl font-extrabold">{tier.price}</span>
                                        <span className={`ml-1 text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            MAD
                                        </span>
                                        <span className={`ml-1 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            /{t('landing.pricing.perMonth')}
                                        </span>
                                    </p>
                                    <a
                                        href="/register"
                                        className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${tier.id === 'pro'
                                                ? 'text-white bg-primary-600 hover:bg-primary-700'
                                                : isDarkMode
                                                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {t('landing.pricing.getStarted')}
                                    </a>
                                </div>
                                <div className="pt-6 pb-8 px-6">
                                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        {t('landing.pricing.includes')}
                                    </h3>
                                    <ul className="mt-6 space-y-4">
                                        {tier.features.map((feature, index) => (
                                            <li key={index} className="flex">
                                                <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {t(`landing.pricing.${feature}`)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact section */}
            <section id="contact" className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold sm:text-4xl">
                            {t('landing.contact.title')}
                        </h2>
                        <p className={`mt-3 max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('landing.contact.subtitle')}
                        </p>
                    </div>

                    <div className="mt-12 max-w-lg mx-auto">
                        <form className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                            <div>
                                <label htmlFor="firstName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('landing.contact.firstName')}
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        autoComplete="given-name"
                                        className={`py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            } rounded-md`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="lastName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('landing.contact.lastName')}
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        autoComplete="family-name"
                                        className={`py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            } rounded-md`}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('landing.contact.email')}
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        className={`py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            } rounded-md`}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="message" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('landing.contact.message')}
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="4"
                                        className={`py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            } rounded-md`}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    {t('landing.contact.send')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;