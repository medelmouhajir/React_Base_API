// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';


// Notifications
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import LandingLayout from './layouts/LandingLayout';
import MainLayout from './layouts/MainLayout';

// Core Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

import { useRtlDirection } from './hooks/useRtlDirection';

// Pages - using lazy loading for better performance
// Landing & Auth
const Login = lazy(() => import('./pages/Auth/Login'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));

// Landing & terms
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const PrivacyPolicy = lazy(() => import('./pages/Landing/PrivacyPolicy/PrivacyPolicy'));
const UseTerms = lazy(() => import('./pages/Landing/UseTerms/UseTerms'));

// Main App
const RoleBasedDashboard = lazy(() => import('./components/redirections/RoleBasedDashboard'));



const CarsList = lazy(() => import('./pages/Cars/List/CarsList'));
const ReservationsList = lazy(() => import('./pages/Reservations/List/ReservationsList'));
const MaintenancesList = lazy(() => import('./pages/Maintenances/List/MaintenancesList'));
const InvoicesList = lazy(() => import('./pages/Invoices/List/InvoicesList'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const SettingsHome = lazy(() => import('./pages/Settings/Home/SettingsHome'));
const NotFound = lazy(() => import('./pages/NotFound'));


const AgencyCreate = lazy(() => import('./pages/Agencies/Create/AgencyCreate'));
const AgencyDetails = lazy(() => import('./pages/Agencies/Details/AgencyDetails'));
const AgenciesList = lazy(() => import('./pages/Agencies/List/AgenciesList'));
const AgencyStuff = lazy(() => import('./pages/Agencies/Stuff/AgencyStuff'));
const QuickNewAgencySetup = lazy(() => import('./pages/Agencies/QuickSetup/QuickNewAgencySetup'));


const Filters = lazy(() => import('./pages/Filters/Filters'));
const Manufacturer = lazy(() => import('./pages/Filters/Manufacturer/Manufacturer'));
const Models = lazy(() => import('./pages/Filters/CarModels/Models'));
const CarYear = lazy(() => import('./pages/Filters/CarYear/CarYear'));
const UploadFilters = lazy(() => import('./pages/Filters/Upload/UploadFilters'));


// Child routes for Cars
const CarDetails = lazy(() => import('./pages/Cars/Details/CarDetails'));
const AddCar = lazy(() => import('./pages/Cars/Add/AddCar'));
const EditCar = lazy(() => import('./pages/Cars/Edit/EditCar'));

//// Child routes for Customers
const CustomerDetails = lazy(() => import('./pages/Customers/Details/CustomerDetails'));
const AddCustomer = lazy(() => import('./pages/Customers/Add/AddCustomer'));
const CustomerEdit = lazy(() => import('./pages/Customers/Edit/CustomerEdit'));
const CustomersList = lazy(() => import('./pages/Customers/List/CustomersList'));

//// Child routes for Reservations
const ReservationDetails = lazy(() => import('./pages/Reservations/Details/ReservationDetails'));
const ReservationAdd = lazy(() => import('./pages/Reservations/Add/ReservationAdd'));
const Contract = lazy(() => import('./pages/Reservations/Contract/Contract'));


const AddMaintenance = lazy(() => import('./pages/Maintenances/Add/AddMaintenance'));
const MaintenanceDetails = lazy(() => import('./pages/Maintenances/Details/MaintenanceDetails'));
const EditMaintenance = lazy(() => import('./pages/Maintenances/Edit/EditMaintenance'));

//// Child route for services Alerts
const ServiceAlertsList = lazy(() => import('./pages/ServiceAlerts/ServiceAlertsList'));
const AddServiceAlert = lazy(() => import('./pages/ServiceAlerts/Add/AddServiceAlert'));

//// Child route for Invoices
const AddInvoice = lazy(() => import('./pages/Invoices/Add/AddInvoice'));
const InvoiceDetails = lazy(() => import('./pages/Invoices/Details/InvoiceDetails'));
const InvoicePrint = lazy(() => import('./pages/Invoices/Print/InvoicePrint'));
const AddPayment = lazy(() => import('./pages/Invoices/AddPayment/AddPayment'));


//// Child route for Settings
const AgencySettings = lazy(() => import('./pages/Settings/Agency/AgencySettings'));
const NotificationPreferences = lazy(() => import('./pages/Settings/Notifications/NotificationPreferences'));


//// Child route for Tickets
const TicketsList = lazy(() => import('./pages/Tickets/List/TicketsList'));
const TicketDetails = lazy(() => import('./pages/Tickets/Details/TicketDetails'));
const ThanksPage = lazy(() => import('./pages/Auth/ThanksPage/ThanksPage'));


//// Child route for Reports
const ReportsHome = lazy(() => import('./pages/Reports/Home/ReportsHome'));
const CarRevenue = lazy(() => import('./pages/Reports/Cars/CarRevenue'));
const CarMaintenance = lazy(() => import('./pages/Reports/Cars/CarMaintenance'));
const AgencyFinancial = lazy(() => import('./pages/Reports/Agency/AgencyFinancial'));
const AgencyCustomers = lazy(() => import('./pages/Reports/Agency/AgencyCustomers'));
const FinancialExpenses = lazy(() => import('./pages/Reports/Financial/FinancialExpenses'));
const FinancialCashFlow = lazy(() => import('./pages/Reports/Financial/FinancialCashFlow'));
const ReservationsOccupancy = lazy(() => import('./pages/Reports/Reservations/ReservationsOccupancy'));


//// Child route for Expenses
const ExpenseList = lazy(() => import('./pages/Expenses/List/ExpenseList'));
const ExpenseDetails = lazy(() => import('./pages/Expenses/Details/ExpenseDetails'));
const ExpenseAdd = lazy(() => import('./pages/Expenses/Add/ExpenseAdd'));


//// Child route for Accidents
const AccidentsList = lazy(() => import('./pages/Accidents/List/AccidentsList'));
const AddAccident = lazy(() => import('./pages/Accidents/Add/AddAccident'));
const AccidentDetails = lazy(() => import('./pages/Accidents/Details/AccidentDetails'));

//// Child route for Gadgets
const GadgetsHome = lazy(() => import('./pages/Gadgets/Home/GadgetsHome'));
const BlacklistCheck = lazy(() => import('./pages/Gadgets/BlacklistChecks/BlacklistCheck'));
const CarCheck = lazy(() => import('./pages/Gadgets/CarChecks/CarCheck'));
const IdentityReader = lazy(() => import('./pages/Gadgets/IdentityReaders/IdentityReader'));
const CarLegalDocuments = lazy(() => import('./pages/Gadgets/CarLegal/CarLegalDocuments'));


//// Child route for GPS
const GpsHome = lazy(() => import('./pages/Gps/Home/GpsHome'));
const SetCarGps = lazy(() => import('./pages/Gps/Cars/SetCarGps'));
const SpeedingAlertsPage = lazy(() => import('./pages/Gps/Alerts/Speeding/SpeedingAlertsPage'));

//// Other standalone pages
const SearchPage = lazy(() => import('./pages/Search/SearchPage'));

//// Other standalone pages
const SubscriptionsList = lazy(() => import('./pages/Subscriptions/List/SubscriptionsList'));
const SubscriptionAgency = lazy(() => import('./pages/Subscriptions/Agency/SubscriptionAgency'));

const ThemedToastContainer = () => {
    const { isDarkMode } = useTheme();
    const { i18n } = useTranslation(); 

    return (
        <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={i18n.language === 'ar'}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={isDarkMode ? 'dark' : 'light'}
            style={{ zIndex: 9999 }}
        />
    );
};

function App() {
    // Initialize RTL direction
    useRtlDirection();
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <NotificationProvider>
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                {/* Public routes */}
                                <Route element={<LandingLayout />}>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/privacy" element={<PrivacyPolicy />} />
                                    <Route path="/terms" element={<UseTerms />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/tickets/thanks" element={<ThanksPage />} />
                                </Route>

                                {/* GPS Route - Independent (no MainLayout) */}
                                <Route
                                    path="/gps"
                                    element={
                                        <ProtectedRoute>
                                            <GpsHome />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Protected routes */}
                                <Route
                                    element={
                                        <ProtectedRoute>
                                            <MainLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route path="/dashboard" element={<RoleBasedDashboard />} />
                                    <Route path="/client" element={<RoleBasedDashboard />} />

                                    <Route path="/agencies" element={<AgenciesList />} />
                                    <Route path="/agencies/create" element={<AgencyCreate />} />
                                    <Route path="/agencies/:id" element={<AgencyDetails />} />
                                    <Route path="/agencies/:id/staff" element={<AgencyStuff />} />
                                    <Route path="/agencies/quick" element={<QuickNewAgencySetup />} />


                                    <Route path="/filters" element={<Filters />} />
                                    <Route path="/filters/manufacturer" element={<Manufacturer />} />
                                    <Route path="/filters/models" element={<Models />} />
                                    <Route path="/filters/caryear" element={<CarYear />} />
                                    <Route path="/filters/upload" element={<UploadFilters />} />


                                    <Route path="/gps/cars" element={<SetCarGps />} />
                                    <Route path="/gps/alerts/speeding" element={<SpeedingAlertsPage />} />

                                    {/* Cars */}
                                    <Route path="/cars" element={<CarsList />} />
                                    <Route path="/cars/:id" element={<CarDetails />} />
                                    <Route path="/cars/add" element={<AddCar />} />
                                    <Route path="/cars/:id/edit" element={<EditCar />} />

                                    {/* Customers */}
                                    <Route path="/customers" element={<CustomersList />} />
                                    <Route path="/customers/:id" element={<CustomerDetails />} />
                                    <Route path="/customers/add" element={<AddCustomer />} />
                                    <Route path="/customers/:id/edit" element={<CustomerEdit />} />

                                    {/* Reservations */}
                                    <Route path="/reservations" element={<ReservationsList />} />
                                    <Route path="/reservations/:id" element={<ReservationDetails />} />
                                    <Route path="/reservations/add" element={<ReservationAdd />} />
                                    <Route path="/reservations/:id/contract" element={<Contract />} />
                                    {/*<Route path="/reservations/:id/edit" element={<ReservationForm />} />*/}

                                    {/* maintenances */}
                                    <Route path="/maintenances" element={<MaintenancesList />} />
                                    <Route path="/maintenances/:id" element={<MaintenanceDetails />} />
                                    <Route path="/maintenances/add" element={<AddMaintenance />} />
                                    <Route path="/maintenances/:id/edit" element={<EditMaintenance />} />

                                    {/* service alerts */}
                                    <Route path="/service-alerts" element={<ServiceAlertsList />} />
                                    <Route path="/service-alerts/add" element={<AddServiceAlert />} />

                                    {/* Invoices */}
                                    <Route path="/invoices" element={<InvoicesList />} />
                                    <Route path="/invoices/add" element={<AddInvoice />} />
                                    <Route path="/invoices/:id" element={<InvoiceDetails />} />
                                    <Route path="/invoices/:id/print" element={<InvoicePrint />} />
                                    <Route path="/invoices/:id/add-payment" element={<AddPayment />} />


                                    {/* Tickets */}
                                    <Route path="/tickets" element={<TicketsList />} />
                                    <Route path="/tickets/:id" element={<TicketDetails />} />


                                    {/* Accidents */}
                                    <Route path="/accidents" element={<AccidentsList />} />
                                    <Route path="/accidents/:id" element={<AccidentDetails />} />
                                    <Route path="/accidents/add" element={<AddAccident />} />

                                    {/* Reports */}
                                    <Route path="/reports" element={<ReportsHome />} />
                                    <Route path="/reports/cars/revenue" element={<CarRevenue />} />
                                    <Route path="/reports/cars/maintenance" element={<CarMaintenance />} />
                                    <Route path="/reports/agency/financial" element={<AgencyFinancial />} />
                                    <Route path="/reports/agency/customers" element={<AgencyCustomers />} />
                                    <Route path="/reports/financial/expense-analysis" element={<FinancialExpenses />} />
                                    <Route path="/reports/reservations/occupancy" element={<ReservationsOccupancy />} />
                                    <Route path="/reports/financial/cash-flow" element={<FinancialCashFlow />} />

                                    {/* Expenses */}
                                    <Route path="/expenses" element={<ExpenseList />} />
                                    <Route path="/expenses/:id" element={<ExpenseDetails />} />
                                    <Route path="/expenses/add" element={<ExpenseAdd />} />

                                    {/* Gadgets */}
                                    <Route path="/gadgets" element={<GadgetsHome />} />
                                    <Route path="/gadgets/blacklist" element={<BlacklistCheck />} />
                                    <Route path="/gadgets/carcheck" element={<CarCheck />} />
                                    <Route path="/gadgets/identity" element={<IdentityReader />} />
                                    <Route path="/gadgets/carLegal" element={<CarLegalDocuments />} />

                                    {/* Settings */}
                                    <Route path="/settings" element={<SettingsHome />} />
                                    <Route path="/settings/agency" element={<AgencySettings />} />
                                    <Route path="/settings/notifications" element={<NotificationPreferences />} />

                                    {/* User Routes */}
                                    <Route path="/profile" element={<Profile />} />

                                    {/* Search */}
                                    <Route path="/search" element={<SearchPage />} />

                                    {/* Subscriptions */}
                                    <Route path="/subscriptions" element={<SubscriptionsList />} />
                                    <Route path="/agencies/:id/subscription" element={<SubscriptionAgency />} />
                                </Route>

                                {/* 404 and redirects */}
                                <Route path="/404" element={<NotFound />} />
                                <Route path="*" element={<Navigate to="/404" replace />} />
                            </Routes>
                        </Suspense>
                        {/* Toast notifications */}
                        <ThemedToastContainer />
                    </NotificationProvider>


                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
