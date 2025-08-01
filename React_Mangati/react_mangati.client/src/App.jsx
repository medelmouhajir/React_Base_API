// src/App.jsx - Modified version with landing page
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components';
import { StudioLayout } from './components/Studio/StudioLayout/StudioLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Account from './pages/Account/Account';
import Home from './pages/Home/Home';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Create from './pages/Series/Create';
import SeriesList from './pages/Series/SeriesList';
import SerieDetails from './pages/Series/SerieDetails';

import ChapterEdit from './pages/Chapters/ChapterEdit';

import Viewer from './pages/Viewer/Viewer';

import Search from './pages/Search/Search';

import Favorites from './pages/Favorites/Favorites';
import MySeries from './pages/Series/MySeries';

import StudioHome from './pages/Studio/Home/StudioHome';
import CharactersList from './pages/Studio/Characters/CharactersList';
import CreateCharacter from './pages/Studio/Characters/CreateCharacter';

import CharacterDetails from './pages/Studio/Characters/CharacterDetails';

import UploadsList from './pages/Studio/Uploads/UploadsList';

import GenerationsList from './pages/Studio/Generations/GenerationsList';

import Character from './pages/Studio/AI/Character';

import LandingPage from './pages/Landing/LandingPage';

//import Settings from './pages/Settings/Settings';

import NotFound from './pages/NotFound/NotFound';
import './App.css';

function App() {
    const { i18n } = useTranslation();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        // Set document direction based on current language
        if (i18n.language === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'ar';
        } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = i18n.language;
        }
    }, [i18n.language]);

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <div className="app__loading">
                <div className="app__spinner"></div>
                <p><em>Checking authentication...</em></p>
            </div>
        );
    }

    // Public routes that don't require authentication
    if (!user) {
        return (
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    // User is authenticated, show main app with routing
    return (
        <Routes>
            {/* Studio Routes */}
            <Route
                path="/studio/*"
                element={
                    <ProtectedRoute requiredRole="Writer">
                        <ImageGenerationProvider>
                            <StudioLayout>
                                <Routes>
                                    <Route path="/" element={<StudioHome />} />
                                    <Route path="/characters" element={<CharactersList />} />
                                    <Route path="/characters/create" element={<CreateCharacter />} />
                                    <Route path="/characters/:id/details" element={<CharacterDetails />} />

                                    <Route path="/ai/character" element={<Character />} />


                                    <Route path="/uploads" element={<UploadsList />} />

                                    <Route path="/generations" element={<GenerationsList />} />
                                    {/* Add other studio routes here */}
                                </Routes>
                            </StudioLayout>
                        </ImageGenerationProvider>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/viewer/:id"
                element={
                    <ProtectedRoute>
                        <Viewer />
                    </ProtectedRoute>
                }
            />
            {/* Main App Routes */}
            <Route
                path="/*"
                element={
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/auth" element={<Navigate to="/home" replace />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/account" element={<Account />} />
                            <Route path="/series" element={<SeriesList />} />
                            <Route path="/series/:id" element={<SerieDetails />} />
                            <Route path="/series/create" element={<Create />} />
                            <Route path="/series/:id/chapters/:id/edit" element={<ChapterEdit />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/favorites" element={<Favorites />} />
                            <Route path="/myseries" element={<MySeries />} />
                            {/*<Route path="/settings" element={<Settings />} />*/}
                            {/*<Route path="/settings/:section" element={<Settings />} />*/}


                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </MainLayout>
                }
            />
        </Routes>
    );
}

export default App;