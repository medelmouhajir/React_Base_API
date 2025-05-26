// src/components/GoogleLoginButton.jsx
import React from 'react';

const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        // The backend URL that initiates Google OAuth flow
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5229';

        // The frontend URL for the callback (must match what's registered in Google Cloud Console)
        const redirectUri = encodeURIComponent(window.location.origin);

        // Redirect to the backend endpoint that starts Google auth flow
        window.location.href = `${apiUrl}/api/GoogleAuth/signin?returnUrl=${redirectUri}`;
    };

    return (
        <button
            onClick={handleGoogleLogin}
            className="auth-form__google-btn"
            type="button"
        >
            <svg className="auth-form__google-icon" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032
        s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814
        C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10
        c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Continue with Google
        </button>
    );
};

export default GoogleLoginButton;