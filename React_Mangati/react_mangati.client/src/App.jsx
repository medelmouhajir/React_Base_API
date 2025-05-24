import { useState, useEffect } from 'react';
import { MainLayout } from './components';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import './App.css';

function App() {
    const [forecasts, setForecasts] = useState();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        // Only fetch weather data if user is authenticated
        if (user) {
            populateWeatherData();
        }
    }, [user]);

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <div className="app__loading">
                <div className="app__spinner"></div>
                <p><em>Checking authentication...</em></p>
            </div>
        );
    }

    // Show auth page if user is not authenticated
    if (!user) {
        return <AuthPage />;
    }

    // User is authenticated, show main app content
    const contents = forecasts === undefined
        ? <div className="app__loading">
            <div className="app__spinner"></div>
            <p><em>Loading... Please refresh once the ASP.NET backend has started.</em></p>
        </div>
        : <div className="app__content">
            <div className="app__header">
                <h1 className="app__title">Welcome to Mangati, {user.firstName}!</h1>
                <p className="app__subtitle">This component demonstrates fetching data from the server.</p>
            </div>

            <div className="app__table-container">
                <table className="app__table">
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
                                    <span className={`app__weather-badge app__weather-badge--${forecast.summary.toLowerCase()}`}>
                                        {forecast.summary}
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>;

    return (
        <MainLayout>
            {contents}
        </MainLayout>
    );

    async function populateWeatherData() {
        try {
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
                // Token expired or invalid, user will be redirected to login
                console.log('Authentication required');
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    }
}

export default App;