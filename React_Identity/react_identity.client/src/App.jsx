
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SelfieVerification from './pages/verification/SelfieVerification';
import DocumentVerification from './pages/verification/DocumentVerification';
import CombinedVerification from './pages/verification/CombinedVerification';
import VerificationHistory from './pages/verification/VerificationHistory';
import VerificationResult from './pages/verification/VerificationResult';
import CallbackSettings from './pages/settings/CallbackSettings';
import ApiKeys from './pages/settings/ApiKeys';
import Profile from './pages/settings/Profile';
import Documentation from './pages/Documentation';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                        <Navbar />

                        <main className="flex-grow">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/docs" element={<Documentation />} />

                                {/* Protected Routes */}
                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />

                                <Route path="/verify/selfie" element={
                                    <ProtectedRoute>
                                        <SelfieVerification />
                                    </ProtectedRoute>
                                } />

                                <Route path="/verify/document" element={
                                    <ProtectedRoute>
                                        <DocumentVerification />
                                    </ProtectedRoute>
                                } />

                                <Route path="/verify/combined" element={
                                    <ProtectedRoute>
                                        <CombinedVerification />
                                    </ProtectedRoute>
                                } />

                                <Route path="/verification/history" element={
                                    <ProtectedRoute>
                                        <VerificationHistory />
                                    </ProtectedRoute>
                                } />

                                <Route path="/verification/:requestId" element={
                                    <ProtectedRoute>
                                        <VerificationResult />
                                    </ProtectedRoute>
                                } />

                                <Route path="/settings/callbacks" element={
                                    <ProtectedRoute>
                                        <CallbackSettings />
                                    </ProtectedRoute>
                                } />

                                <Route path="/settings/api-keys" element={
                                    <ProtectedRoute>
                                        <ApiKeys />
                                    </ProtectedRoute>
                                } />

                                <Route path="/settings/profile" element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                } />

                                {/* Redirect unknown routes */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>

                        <Footer />

                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="colored"
                        />
                    </div>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;