// src/routes/Routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth components
import { useAuth } from '../features/auth/AuthContext';
import ProtectedRoute from '../features/auth/ProtectedRoute';

// Layout components
import ProtectedLayout from '../components/layout/ProtectedLayout';


import NotificationsPage from '../pages/notifications/NotificationsPage';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import FirmRegistrationPage from '../pages/auth/FirmRegistrationPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Main pages
import DashboardPage from '../pages/dashboard/DashboardPage'
import HomePage from '../pages/dashboard/HomePage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import NotFoundPage from '../pages/errors/NotFoundPage';

// Cases pages
import CasesListPage from '../pages/cases/CasesListPage';
import CaseDetailsPage from '../pages/cases/CaseDetailsPage';
import NewCasePage from '../pages/cases/NewCasePage';
import EditCasePage from '../pages/cases/EditCasePage';

// Clients pages
import ClientsListPage from '../pages/clients/ClientsListPage';
import ClientDetailsPage from '../pages/clients/ClientDetailsPage';
import NewClientPage from '../pages/clients/NewClientPage';
import EditClientPage from '../pages/clients/EditClientPage';

//// Appointments pages
import AppointmentsListPage from '../pages/appointments/AppointmentsListPage';
import AppointmentDetailsPage from '../pages/appointments/AppointmentDetailsPage';
import NewAppointmentPage from '../pages/appointments/NewAppointmentPage';
import CalendarPage from '../pages/appointments/CalendarPage';

// Billing pages
import InvoicesListPage from '../pages/billing/InvoicesListPage';
import InvoiceDetailsPage from '../pages/billing/InvoiceDetailsPage';
import InvoicePrintPage from '../pages/billing/InvoicePrintPage';
import InvoiceDownloadPdfPage from '../pages/billing/InvoiceDownloadPdfPage';
import NewInvoicePage from '../pages/billing/NewInvoicePage';
import PaymentsPage from '../pages/billing/PaymentsPage';
import TimeEntriesListPage from '../pages/billing/TimeEntriesListPage';

//// Documents pages
import DocumentsListPage from '../pages/documents/DocumentsListPage';
import DocumentDetailsPage from '../pages/documents/DocumentDetailsPage';
import DocumentEditor from '../pages/documents/DocumentEditor';
import DocumentGenerationPage from '../pages/documents/DocumentGenerationPage';

//// Reports pages
//import ReportsPage from '../pages/reports/ReportsPage';

// Firm pages
import FirmManagementPage from '../pages/firms/FirmManagementPage';
import UsersManagementPage from '../pages/firms/FirmDetailsPage';

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={
                !isAuthenticated() ? <LoginPage /> : <Navigate to="/" replace />
            } />
            <Route path="/register" element={
                !isAuthenticated() ? <RegisterPage /> : <Navigate to="/" replace />
            } />
            <Route path="/register-firm" element={
                !isAuthenticated() ? <FirmRegistrationPage /> : <Navigate to="/" replace />
            } />
            <Route path="/forgotPassword" element={
                !isAuthenticated() ? <ForgotPasswordPage /> : <Navigate to="/" replace />
            } />
            <Route path="/resetPassword" element={
                !isAuthenticated() ? <ResetPasswordPage /> : <Navigate to="/" replace />
            } />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedLayout />}>
                {/* Dashboard */}
                <Route path="/" element={<HomePage />} />

                {/* Profile and Settings */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />


                {/* Notifications */}
                <Route path="/notifications" element={<NotificationsPage />} />


                {/* Cases - Requires Lawyer or Admin role */}
                <Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin"]} />}>
                    <Route path="/cases" element={<CasesListPage />} />
                    <Route path="/cases/new" element={<NewCasePage />} />
                    <Route path="/cases/:id" element={<CaseDetailsPage />} />
                    <Route path="/cases/:id/edit" element={<EditCasePage />} />
                </Route>

                {/* Clients */}
                <Route path="/clients" element={<ClientsListPage />} />
                    <Route path="/clients/new" element={<NewClientPage />} />
                    <Route path="/clients/:id" element={<ClientDetailsPage />} />
                    <Route path="/clients/:id/edit" element={<EditClientPage />} />
                
                {/* Appointments */}
                <Route path="/appointments" element={<AppointmentsListPage />} />
                <Route path="/appointments/new" element={<NewAppointmentPage />} />
                <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
                <Route path="/appointments/calendar" element={<CalendarPage />} />

                {/* Billing - Not for Clients */}
                <Route element={<ProtectedRoute requiredrole={["Lawyer", "Admin", "Secretary"]} />}>
                    <Route path="/billing" element={<InvoicesListPage />} />
                    <Route path="/billing/invoices" element={<InvoicesListPage />} />
                    <Route path="/billing/invoices/new" element={<NewInvoicePage />} />
                    <Route path="/billing/invoices/:id" element={<InvoiceDetailsPage />} />
                    <Route path="/billing/invoices/:id/print" element={<InvoicePrintPage />} />
                    <Route path="/billing/invoices/:id/download" element={<InvoiceDownloadPdfPage />} />
                    <Route path="/billing/payments" element={<PaymentsPage />} />
                    <Route path="/billing/time-entries" element={<TimeEntriesListPage />} />
                </Route>

                {/* Documents */}
                <Route path="/documents" element={<DocumentsListPage />} />
                <Route path="/documents/generator" element={<DocumentGenerationPage />} />
                <Route path="/documents/:id/edit" element={<DocumentEditor />} />
                <Route path="/documents/:id" element={<DocumentDetailsPage />} />

                {/* Reports - Only for Lawyers and Admins */}
                {/*<Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin"]} />}>*/}
                {/*    <Route path="/reports" element={<ReportsPage />} />*/}
                {/*</Route>*/}

                {/* Firm Management - Only for Admins */}
                <Route element={<ProtectedRoute requiredRole="Admin" />}>
                    <Route path="/firm" element={<FirmManagementPage />} />
                    <Route path="/firm/users" element={<UsersManagementPage />} />
                </Route>
            </Route>

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;