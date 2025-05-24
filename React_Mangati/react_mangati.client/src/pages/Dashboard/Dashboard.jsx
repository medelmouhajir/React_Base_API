import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const [forecasts, setForecasts] = useState();
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        populateWeatherData();
    }, []);

    const populateWeatherData = async () => {
        try {
            setLoading(true);
            const response = await fetch('weatherforecast', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setForecasts(data);
            } else if (response.status === 401) {
                console.log('Authentication required');
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard__loading">
                <div className="dashboard__spinner"></div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <h1 className="dashboard__title">Welcome to Mangati, {user.firstName}!</h1>
                <p className="dashboard__subtitle">Here's your project overview and recent activity.</p>
            </div>

            {/* Stats Cards */}
            <div className="dashboard__stats">
                <div className="dashboard__card">
                    <div className="dashboard__card-icon dashboard__card-icon--projects">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                    </div>
                    <div className="dashboard__card-content">
                        <h3>Active Projects</h3>
                        <p className="dashboard__card-number">24</p>
                        <span className="dashboard__card-change dashboard__card-change--positive">+3 this week</span>
                    </div>
                </div>

                <div className="dashboard__card">
                    <div className="dashboard__card-icon dashboard__card-icon--tasks">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </div>
                    <div className="dashboard__card-content">
                        <h3>Tasks Completed</h3>
                        <p className="dashboard__card-number">89</p>
                        <span className="dashboard__card-change dashboard__card-change--positive">+12 today</span>
                    </div>
                </div>

                <div className="dashboard__card">
                    <div className="dashboard__card-icon dashboard__card-icon--team">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className="dashboard__card-content">
                        <h3>Team Members</h3>
                        <p className="dashboard__card-number">28</p>
                        <span className="dashboard__card-change dashboard__card-change--neutral">No change</span>
                    </div>
                </div>

                <div className="dashboard__card">
                    <div className="dashboard__card-icon dashboard__card-icon--progress">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <div className="dashboard__card-content">
                        <h3>Overall Progress</h3>
                        <p className="dashboard__card-number">73%</p>
                        <span className="dashboard__card-change dashboard__card-change--positive">+5% this month</span>
                    </div>
                </div>
            </div>

            {/* Weather Demo Section */}
            {forecasts && (
                <div className="dashboard__section">
                    <h2 className="dashboard__section-title">Weather Forecast Demo</h2>
                    <div className="dashboard__table-container">
                        <table className="dashboard__table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Temp. (C)</th>
                                    <th>Temp. (F)</th>
                                    <th>Summary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecasts.map(forecast =>
                                    <tr key={forecast.date}>
                                        <td>{forecast.date}</td>
                                        <td>{forecast.temperatureC}</td>
                                        <td>{forecast.temperatureF}</td>
                                        <td>
                                            <span className={`dashboard__weather-badge dashboard__weather-badge--${forecast.summary.toLowerCase()}`}>
                                                {forecast.summary}
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;