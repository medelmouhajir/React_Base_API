// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

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
const CarsList = lazy(() => import('./pages/Cars/List/CarsList'));
//const Customers = lazy(() => import('./pages/customers/Customers'));
const ReservationsList = lazy(() => import('./pages/Reservations/List/ReservationsList'));
const MaintenancesList = lazy(() => import('./pages/Maintenances/List/MaintenancesList'));
const InvoicesList = lazy(() => import('./pages/Invoices/List/InvoicesList'));
//const Profile = lazy(() => import('./pages/Profile'));
//const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));


const AgencyCreate = lazy(() => import('./pages/Agencies/Create/AgencyCreate'));
const AgenciesList = lazy(() => import('./pages/Agencies/List/AgenciesList'));
const AgencyStuff = lazy(() => import('./pages/Agencies/Stuff/AgencyStuff'));


const Filters = lazy(() => import('./pages/Filters/Filters'));
const Manufacturer = lazy(() => import('./pages/Filters/Manufacturer/Manufacturer'));
const Models = lazy(() => import('./pages/Filters/CarModels/Models'));
const CarYear = lazy(() => import('./pages/Filters/CarYear/CarYear'));


// Child routes for Cars
//const CarDetails = lazy(() => import('./pages/cars/CarDetails'));
const AddCar = lazy(() => import('./pages/Cars/Add/AddCar'));
const EditCar = lazy(() => import('./pages/Cars/Edit/EditCar'));

//// Child routes for Customers
const CustomerDetails = lazy(() => import('./pages/Customers/Details/CustomerDetails'));
const AddCustomer = lazy(() => import('./pages/Customers/Add/AddCustomer'));
const CustomerEdit = lazy(() => import('./pages/Customers/Edit/CustomerEdit'));
const CustomersList = lazy(() => import('./pages/Customers/List/CustomersList'));

//// Child routes for Reservations
//const ReservationDetails = lazy(() => import('./pages/reservations/ReservationDetails'));
const ReservationAdd = lazy(() => import('./pages/Reservations/Add/ReservationAdd'));



const AddMaintenance = lazy(() => import('./pages/Maintenances/Add/AddMaintenance'));
const EditMaintenance = lazy(() => import('./pages/Maintenances/Edit/EditMaintenance'));

//// Child route for Invoices
const AddInvoice = lazy(() => import('./pages/Invoices/Add/AddInvoice'));
const InvoiceDetails = lazy(() => import('./pages/Invoices/Details/InvoiceDetails'));

//// Other standalone pages
//const MaintenancePage = lazy(() => import('./pages/maintenance/Maintenance'));
const GpsHome = lazy(() => import('./pages/Gps/Home/GpsHome'));
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

                                <Route path="/agencies" element={<AgenciesList />} />
                                <Route path="/agencies/create" element={<AgencyCreate />} />
                                <Route path="/agencies/:id/stuff" element={<AgencyStuff />} />


                                <Route path="/filters" element={<Filters />} />
                                <Route path="/filters/manufacturer" element={<Manufacturer />} />
                                <Route path="/filters/models" element={<Models />} />
                                <Route path="/filters/caryear" element={<CarYear />} />


                                {/* Cars */}
                                <Route path="/cars" element={<CarsList />} />
                                {/*<Route path="/cars/:id" element={<CarDetails />} />*/}
                                <Route path="/cars/add" element={<AddCar />} />
                                <Route path="/cars/:id/edit" element={<EditCar />} />

                                {/* Customers */}
                                <Route path="/customers" element={<CustomersList />} />
                                <Route path="/customers/:id" element={<CustomerDetails />} />
                                <Route path="/customers/add" element={<AddCustomer />} />
                                <Route path="/customers/:id/edit" element={<CustomerEdit />} />

                                {/* Reservations */}
                                <Route path="/reservations" element={<ReservationsList />} />
                                {/*<Route path="/reservations/:id" element={<ReservationDetails />} />*/}
                                <Route path="/reservations/add" element={<ReservationAdd />} />
                                {/*<Route path="/reservations/:id/edit" element={<ReservationForm />} />*/}

                                {/* maintenances */}
                                <Route path="/maintenances" element={<MaintenancesList />} />
                                {/*<Route path="/reservations/:id" element={<ReservationDetails />} />*/}
                                <Route path="/maintenances/add" element={<AddMaintenance />} />
                                <Route path="/maintenances/:id/edit" element={<EditMaintenance />} />

                                {/* Invoices */}
                                <Route path="/invoices" element={<InvoicesList />} />
                                <Route path="/invoices/add" element={<AddInvoice />} />
                                <Route path="/invoices/:id" element={<InvoiceDetails />} />

                                {/* Maintenance */}
                                {/*<Route path="/maintenance" element={<MaintenancePage />} />*/}

                                {/* GPS Tracking */}
                                <Route path="/gps" element={<GpsHome />} />

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
