// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layouts
import LandingLayout from './layouts/LandingLayout';
import MainLayout from './layouts/MainLayout';

// Core Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Pages - using lazy loading for better performance
// Landing & Auth
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));

// Main App
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
//const Cars = lazy(() => import('./pages/cars/Cars'));
//const Customers = lazy(() => import('./pages/customers/Customers'));
//const Reservations = lazy(() => import('./pages/reservations/Reservations'));
//const Invoices = lazy(() => import('./pages/invoices/Invoices'));
//const Profile = lazy(() => import('./pages/Profile'));
//const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

//// Child routes for Cars
//const CarDetails = lazy(() => import('./pages/cars/CarDetails'));
//const CarForm = lazy(() => import('./pages/cars/CarForm'));

//// Child routes for Customers
//const CustomerDetails = lazy(() => import('./pages/customers/CustomerDetails'));
//const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'));

//// Child routes for Reservations
//const ReservationDetails = lazy(() => import('./pages/reservations/ReservationDetails'));
//const ReservationForm = lazy(() => import('./pages/reservations/ReservationForm'));

//// Child route for Invoices
//const InvoiceDetails = lazy(() => import('./pages/invoices/InvoiceDetails'));

//// Other standalone pages
//const MaintenancePage = lazy(() => import('./pages/maintenance/Maintenance'));
//const GpsTracking = lazy(() => import('./pages/gps/GpsTracking'));
//const ReportsPage = lazy(() => import('./pages/reports/Reports'));
//const AgenciesPage = lazy(() => import('./pages/admin/Agencies'));
//const StaffPage = lazy(() => import('./pages/admin/Staff'));
//const SearchPage = lazy(() => import('./pages/Search'));

function App() {
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                            {/* Public routes */}
                            <Route element={<LandingLayout />}>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                            </Route>

                            {/* Protected routes */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <MainLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/dashboard" element={<Dashboard />} />

                                {/* Cars */}
                                {/*<Route path="/cars" element={<Cars />} />*/}
                                {/*<Route path="/cars/:id" element={<CarDetails />} />*/}
                                {/*<Route path="/cars/add" element={<CarForm />} />*/}
                                {/*<Route path="/cars/:id/edit" element={<CarForm />} />*/}

                                {/* Customers */}
                                {/*<Route path="/customers" element={<Customers />} />*/}
                                {/*<Route path="/customers/:id" element={<CustomerDetails />} />*/}
                                {/*<Route path="/customers/add" element={<CustomerForm />} />*/}
                                {/*<Route path="/customers/:id/edit" element={<CustomerForm />} />*/}

                                {/* Reservations */}
                                {/*<Route path="/reservations" element={<Reservations />} />*/}
                                {/*<Route path="/reservations/:id" element={<ReservationDetails />} />*/}
                                {/*<Route path="/reservations/add" element={<ReservationForm />} />*/}
                                {/*<Route path="/reservations/:id/edit" element={<ReservationForm />} />*/}

                                {/* Invoices */}
                                {/*<Route path="/invoices" element={<Invoices />} />*/}
                                {/*<Route path="/invoices/:id" element={<InvoiceDetails />} />*/}

                                {/* Maintenance */}
                                {/*<Route path="/maintenance" element={<MaintenancePage />} />*/}

                                {/* GPS Tracking */}
                                {/*<Route path="/gps" element={<GpsTracking />} />*/}

                                {/* Reports */}
                                {/*<Route path="/reports" element={<ReportsPage />} />*/}

                                {/* Admin Routes */}
                                {/*<Route path="/agencies" element={<AgenciesPage />} />*/}
                                {/*<Route path="/staff" element={<StaffPage />} />*/}

                                {/* User Routes */}
                                {/*<Route path="/profile" element={<Profile />} />*/}
                                {/*<Route path="/settings" element={<Settings />} />*/}

                                {/* Search */}
                                {/*<Route path="/search" element={<SearchPage />} />*/}
                            </Route>

                            {/* 404 and redirects */}
                            <Route path="/404" element={<NotFound />} />
                            <Route path="*" element={<Navigate to="/404" replace />} />
                        </Routes>
                    </Suspense>

                    {/* Toast notifications */}
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
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
