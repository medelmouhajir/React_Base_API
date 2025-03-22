// src/features/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Protected route component that redirects to login if user is not authenticated
 * or doesn't have the required role
 * 
 * @param {Object} props - Component props
 * @param {string|Array} props.requiredRole - Optional role(s) required to access the route
 * @returns {JSX.Element} - Route component or redirect
 */
const ProtectedRoute = ({ requiredRole }) => {
    const { isAuthenticated, hasRole, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
        // Redirect to login page with redirect back to original route
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }

    // If a role is required, check if user has that role
    if (requiredRole && !hasRole(requiredRole)) {
        // Redirect to unauthorized page
        return <Navigate to="/unauthorized" replace />;
    }

    // User is authenticated and has the required role, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;