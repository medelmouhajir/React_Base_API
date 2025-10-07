// src/pages/Reservations/Details/components/FloatingActionButton.jsx
const FloatingActionButton = ({ action }) => {
    if (!action) return null;

    const getVariantClass = () => {
        switch (action.variant) {
            case 'success': return 'fab-success';
            case 'primary': return 'fab-primary';
            case 'warning': return 'fab-warning';
            case 'danger': return 'fab-danger';
            default: return 'fab-primary';
        }
    };

    return (
        <button
            className={`floating-action-button ${getVariantClass()}`}
            onClick={action.onClick}
            title={action.label}
        >
            <span className="fab-icon">{action.icon}</span>
            <span className="fab-label">{action.label}</span>
        </button>
    );
};

export default FloatingActionButton;