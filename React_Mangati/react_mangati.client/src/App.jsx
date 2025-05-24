import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Account from './pages/Account/Account';
import Home from './pages/Home/Home';

import Create from './pages/Series/Create';
import SeriesList from './pages/Series/SeriesList';
import SerieDetails from './pages/Series/SerieDetails';

import ChapterEdit from './pages/Chapters/ChapterEdit';

import Viewer from './pages/Viewer/Viewer';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="app__loading">
                <div className="app__spinner"></div>
                <p><em>Checking authentication...</em></p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return children;
};

// Public Layout Component (without sidebar/navigation)
const PublicLayout = ({ children }) => {
    return (
        <div className="public-layout">
            {children}
        </div>
    );
};

function App() {
    const { loading: authLoading } = useAuth();

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <div className="app__loading">
                <div className="app__spinner"></div>
                <p><em>Checking authentication...</em></p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={
                <PublicLayout>
                    <Home />
                </PublicLayout>
            } />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Dashboard />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/account" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Account />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/series" element={
                <ProtectedRoute>
                    <MainLayout>
                        <SeriesList />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/series/:id" element={
                <ProtectedRoute>
                    <MainLayout>
                        <SerieDetails />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/series/create" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Create />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/series/:id/chapters/:id/edit" element={
                <ProtectedRoute>
                    <MainLayout>
                        <ChapterEdit />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/viewer/:id" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Viewer />
                    </MainLayout>
                </ProtectedRoute>
            } />

            {/* 404 Not Found */}
            <Route path="*" element={
                <PublicLayout>
                    <div className="not-found">
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="/home">Go to Home</a>
                    </div>
                </PublicLayout>
            } />
        </Routes>
    );
}

export default App;