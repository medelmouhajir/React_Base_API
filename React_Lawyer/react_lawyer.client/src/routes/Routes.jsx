// src/routes/Routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth components
import { useAuth } from '../features/auth/AuthContext';
import ProtectedRoute from '../features/auth/ProtectedRoute';

// Layout components
import ProtectedLayout from '../components/layout/ProtectedLayout';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
//import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
//import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Main pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import NotFoundPage from '../pages/errors/NotFoundPage';

// Cases pages
import CasesListPage from '../pages/cases/CasesListPage';
import CaseDetailsPage from '../pages/cases/CaseDetailsPage';
import NewCasePage from '../pages/cases/NewCasePage';

// Clients pages
import ClientsListPage from '../pages/clients/ClientsListPage';
import ClientDetailsPage from '../pages/clients/ClientDetailsPage';
import NewClientPage from '../pages/clients/NewClientPage';

//// Appointments pages
//import AppointmentsListPage from '../pages/appointments/AppointmentsListPage';
//import AppointmentDetailsPage from '../pages/appointments/AppointmentDetailsPage';
//import NewAppointmentPage from '../pages/appointments/NewAppointmentPage';

//// Billing pages
//import InvoicesListPage from '../pages/billing/InvoicesListPage';
//import InvoiceDetailsPage from '../pages/billing/InvoiceDetailsPage';
//import NewInvoicePage from '../pages/billing/NewInvoicePage';
//import PaymentsPage from '../pages/billing/PaymentsPage';

//// Documents pages
//import DocumentsListPage from '../pages/documents/DocumentsListPage';
//import DocumentDetailsPage from '../pages/documents/DocumentDetailsPage';
//import UploadDocumentPage from '../pages/documents/UploadDocumentPage';

//// Reports pages
//import ReportsPage from '../pages/reports/ReportsPage';

//// Firm pages
//import FirmManagementPage from '../pages/firm/FirmManagementPage';
//import UsersManagementPage from '../pages/firm/UsersManagementPage';

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={
                !isAuthenticated() ? <LoginPage /> : <Navigate to="/" replace />
            } />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedLayout />}>
                {/* Dashboard */}
                <Route path="/" element={<DashboardPage />} />

                {/* Profile and Settings */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Cases - Requires Lawyer or Admin role */}
                <Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin"]} />}>
                    <Route path="/cases" element={<CasesListPage />} />
                    <Route path="/cases/new" element={<NewCasePage />} />
                    <Route path="/cases/:id" element={<CaseDetailsPage />} />
                </Route>

                {/* Clients */}
                <Route path="/clients" element={<ClientsListPage />} />
                <Route path="/clients/new" element={<NewClientPage />} />
                <Route path="/clients/:id" element={<ClientDetailsPage />} />

                {/* Appointments */}
                <Route path="/appointments" element={<AppointmentsListPage />} />
                <Route path="/appointments/new" element={<NewAppointmentPage />} />
                <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />

                {/* Billing - Not for Clients */}
                <Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin", "Secretary"]} />}>
                    <Route path="/billing" element={<InvoicesListPage />} />
                    <Route path="/billing/invoices/new" element={<NewInvoicePage />} />
                    <Route path="/billing/invoices/:id" element={<InvoiceDetailsPage />} />
                    <Route path="/billing/payments" element={<PaymentsPage />} />
                </Route>

                {/* Documents */}
                <Route path="/documents" element={<DocumentsListPage />} />
                <Route path="/documents/upload" element={<UploadDocumentPage />} />
                <Route path="/documents/:id" element={<DocumentDetailsPage />} />

                {/* Reports - Only for Lawyers and Admins */}
                <Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin"]} />}>
                    <Route path="/reports" element={<ReportsPage />} />
                </Route>

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