import { useState, useEffect } from 'react';
import { MainLayout } from './components';
import './App.css';

function App() {
    const [forecasts, setForecasts] = useState();

    useEffect(() => {
        populateWeatherData();
    }, []);

    const contents = forecasts === undefined
        ? <div className="app__loading">
            <div className="app__spinner"></div>
            <p><em>Loading... Please refresh once the ASP.NET backend has started.</em></p>
        </div>
        : <div className="app__content">
            <div className="app__header">
                <h1 className="app__title">Weather Forecast</h1>
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
        const response = await fetch('weatherforecast');
        if (response.ok) {
            const data = await response.json();
            setForecasts(data);
        }
    }
}

export default App;