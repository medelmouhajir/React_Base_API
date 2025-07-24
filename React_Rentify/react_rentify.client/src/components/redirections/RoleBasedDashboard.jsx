// src/components/RoleBasedDashboard.jsx
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard/Dashboard';
import DashboardAdmin from '../../pages/Dashboard/DashboardAdmin';
import LoadingScreen from '../ui/LoadingScreen';

const RoleBasedDashboard = () => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;

    return user.role === 'Admin'
        ? <DashboardAdmin />
        : <Dashboard />;
};

export default RoleBasedDashboard;
