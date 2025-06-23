import React from 'react';
import './NotFound.css';

const NotFound = () => {
    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <h1 className="error-title">Page Not Found</h1>
                <p className="error-description">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="error-actions">
                    <button onClick={handleGoHome} className="btn btn-primary">
                        Go Home
                    </button>
                    <button onClick={handleGoBack} className="btn btn-secondary">
                        Go Back
                    </button>
                </div>
                <div className="error-illustration">
                    <div className="floating-elements">
                        <div className="element element-1"></div>
                        <div className="element element-2"></div>
                        <div className="element element-3"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;