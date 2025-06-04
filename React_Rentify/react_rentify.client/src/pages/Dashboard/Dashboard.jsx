// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Mock data for dashboard widgets
const mockReservations = [
    { id: 1, customer: 'Ahmed Hassan', car: 'Toyota Corolla', startDate: '2025-06-01', endDate: '2025-06-05', status: 'Confirmed' },
    { id: 2, customer: 'Sofia Alami', car: 'Renault Clio', startDate: '2025-06-02', endDate: '2025-06-04', status: 'Ongoing' },
    { id: 3, customer: 'Omar Benali', car: 'Hyundai Tucson', startDate: '2025-06-07', endDate: '2025-06-10', status: 'Pending' },
];

const mockCars = [
    { id: 1, model: 'Toyota Corolla', licensePlate: '12345-A-5', status: 'Available', maintenanceDue: '2025-07-15' },
    { id: 2, model: 'Renault Clio', licensePlate: '67890-B-7', status: 'Rented', maintenanceDue: '2025-08-20' },
    { id: 3, model: 'Hyundai Tucson', licensePlate: '54321-C-9', status: 'Maintenance', maintenanceDue: '2025-06-05' },
];

const mockStats = {
    totalCars: 15,
    availableCars: 9,
    activeReservations: 4,
    pendingReservations: 2,
    upcomingMaintenance: 3,
    monthlyRevenue: 24500,
};

const Dashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [stats, setStats] = useState(mockStats);
    const [recentReservations, setRecentReservations] = useState([]);
    const [carStatus, setCarStatus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        // Simulate API call
        const fetchDashboardData = async () => {
            try {
                // In a real app, these would be API calls
                // const statsResponse = await dashboardService.getStats();
                // const reservationsResponse = await reservationService.getRecent();
                // const carsResponse = await carService.getStatus();

                // For demo, use mock data with a delay
                setTimeout(() => {
                    setStats(mockStats);
                    setRecentReservations(mockReservations);
                    setCarStatus(mockCars);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome message */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                <h1 className="text-2xl font-bold">
                    {t('dashboard.welcomeMessage', { name: user?.fullName || t('common.user') })}
                </h1>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {new Date().toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cars stats */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className="flex items-center">
                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 4h-4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2zm0 0H5a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {t('dashboard.totalCars')}
                            </p>
                            <p className="text-2xl font-semibold">{stats.totalCars}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {t('dashboard.availableCars')}
                            </p>
                            <p className="text-xl font-semibold text-green-500">{stats.availableCars}</p>
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {t('dashboard.maintenanceCars')}
                            </p>
                            <p className="text-xl font-semibold text-yellow-500">{stats.upcomingMaintenance}</p>
                        </div>
                    </div>
                </div>

                {/* Reservations stats */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className="flex items-center">
                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {t('dashboard.activeReservations')}
                            </p>
                            <p className="text-2xl font-semibold">{stats.activeReservations}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {t('dashboard.pendingReservations')}
                        </p>
                        <p className="text-xl font-semibold text-yellow-500">{stats.pendingReservations}</p>
                    </div>
                </div>

                {/* Revenue stats */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className="flex items-center">
                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {t('dashboard.monthlyRevenue')}
                            </p>
                            <p className="text-2xl font-semibold">
                                {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(stats.monthlyRevenue)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent reservations */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                <h2 className="text-lg font-medium mb-4">{t('dashboard.recentReservations')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('reservations.customer')}</th>
                                <th scope="col" className="px-6 py-3">{t('reservations.car')}</th>
                                <th scope="col" className="px-6 py-3">{t('reservations.startDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('reservations.endDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('reservations.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReservations.map(reservation => (
                                <tr
                                    key={reservation.id}
                                    className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <td className="px-6 py-4">{reservation.customer}</td>
                                    <td className="px-6 py-4">{reservation.car}</td>
                                    <td className="px-6 py-4">{reservation.startDate}</td>
                                    <td className="px-6 py-4">{reservation.endDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${reservation.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                reservation.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-right">
                    <a href="/reservations" className="text-primary-600 hover:underline font-medium text-sm">
                        {t('common.viewAll')} →
                    </a>
                </div>
            </div>

            {/* Car status */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                <h2 className="text-lg font-medium mb-4">{t('dashboard.carStatus')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('cars.model')}</th>
                                <th scope="col" className="px-6 py-3">{t('cars.licensePlate')}</th>
                                <th scope="col" className="px-6 py-3">{t('cars.status')}</th>
                                <th scope="col" className="px-6 py-3">{t('cars.maintenanceDue')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carStatus.map(car => (
                                <tr
                                    key={car.id}
                                    className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <td className="px-6 py-4">{car.model}</td>
                                    <td className="px-6 py-4">{car.licensePlate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${car.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                car.status === 'Rented' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {car.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{car.maintenanceDue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-right">
                    <a href="/cars" className="text-primary-600 hover:underline font-medium text-sm">
                        {t('common.viewAll')} →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;