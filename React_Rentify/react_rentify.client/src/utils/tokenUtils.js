// CREATE new file: src/utils/tokenUtils.js

export const handleTokenExpiry = (userEmail = null) => {
    // Store email if provided, or get from current storage
    const emailToStore = userEmail ||
        JSON.parse(localStorage.getItem('currentUser') || '{}')?.email ||
        localStorage.getItem('lastUserEmail');

    if (emailToStore) {
        localStorage.setItem('lastUserEmail', emailToStore);
    }

    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('currentUser');

    // Redirect with email parameter
    const redirectUrl = emailToStore
        ? `/login?email=${encodeURIComponent(emailToStore)}`
        : '/login';

    window.location.href = redirectUrl;
};

export const clearUserSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('currentUser');
    // Keep lastUserEmail for future logins
};

export const getStoredUserEmail = () => {
    return localStorage.getItem('lastUserEmail');
};