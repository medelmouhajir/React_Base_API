import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';

//import Settings from './pages/Settings/Settings';
//import NotFound from './pages/NotFound/NotFound';
import './App.css';

function App() {
    const { user, loading: authLoading } = useAuth();

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

    // User is authenticated, show main app with routing
    return (
        <MainLayout>
            <Routes>
                {/* Default redirect to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Main application routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                {/*<Route path="/settings" element={<Settings />} />*/}
                {/*<Route path="/settings/:section" element={<Settings />} />*/}

                {/* 404 Not Found */}
                {/*<Route path="*" element={<NotFound />} />*/}
            </Routes>
        </MainLayout>
    );
}

export default App;