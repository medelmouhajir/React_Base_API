import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('identity_token'));

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('identity_token');
            const savedUser = localStorage.getItem('identity_user');

            if (savedToken && savedUser) {
                try {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                    authService.setAuthToken(savedToken);
                } catch (error) {
                    console.error('Error parsing saved user data:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            const { token: newToken, account } = response.data;

            setToken(newToken);
            setUser(account);

            localStorage.setItem('identity_token', newToken);
            localStorage.setItem('identity_user', JSON.stringify(account));

            authService.setAuthToken(newToken);

            toast.success('Login successful!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const register = async (email, password, fullName, companyName) => {
        try {
            const response = await authService.register(email, password, fullName, companyName);

            toast.success('Account created successfully! Please log in.');
            return { success: true, data: response.data };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('identity_token');
        localStorage.removeItem('identity_user');
        authService.removeAuthToken();
        toast.success('Logged out successfully');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('identity_user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
