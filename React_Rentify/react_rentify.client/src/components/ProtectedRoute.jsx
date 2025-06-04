// File: src/components/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/Auth/Login';

const ProtectedRoute = ({
    children,
    requiredRole = null,
    requiredRoles = [],
    fallback = null
}) => {
    const { user, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    width: '3rem',
                    height: '3rem',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // If user is not authenticated, show auth page
    if (!user) {
        return fallback || <AuthPage />;
    }

    // Check role requirements
    if (requiredRole && user.role !== requiredRole) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                flexDirection: 'column',
                background: '#f8fafc',
                color: '#64748b',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1rem', color: '#ef4444' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                </svg>
                <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Access Denied</h2>
                <p style={{ margin: 0 }}>You don't have permission to access this page.</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                    Required role: <strong>{requiredRole}</strong> | Your role: <strong>{user.role}</strong>
                </p>
            </div>
        );
    }

    // Check multiple roles requirement
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                flexDirection: 'column',
                background: '#f8fafc',
                color: '#64748b',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1rem', color: '#ef4444' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                </svg>
                <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Access Denied</h2>
                <p style={{ margin: 0 }}>You don't have permission to access this page.</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                    Required roles: <strong>{requiredRoles.join(', ')}</strong> | Your role: <strong>{user.role}</strong>
                </p>
            </div>
        );
    }

    // User is authenticated and has required permissions
    return children;
};

// Role-specific components for convenience
export const AdminRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="Admin" fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export const ManagerRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRoles={['Owner', 'Manager']} fallback={fallback}>
        {children}
    </ProtectedRoute>
);


export default ProtectedRoute;