// src/components/Loading/Loading.jsx
import { useTheme } from '../../contexts/ThemeContext';
import './Loading.css';

// Loading types: spinner, pulse, dots, skeleton
const Loading = ({
    type = 'spinner',
    text = 'Loading...',
    showText = true,
    overlay = false,
    height = null,
    width = null
}) => {
    const { isDarkMode } = useTheme();

    // Determine which loading indicator to show
    const renderLoadingIndicator = () => {
        switch (type) {
            case 'pulse':
                return (
                    <div className="loading-pulse">
                        <div></div>
                        <div></div>
                    </div>
                );
            case 'dots':
                return (
                    <div className="loading-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                );
            case 'skeleton':
                return (
                    <div
                        className="loading-skeleton"
                        style={{
                            height: height || '1.25rem',
                            width: width || '100%'
                        }}
                    ></div>
                );
            case 'spinner':
            default:
                return <div className="loading-spinner"></div>;
        }
    };

    // For overlay loading indicator (covers parent element)
    if (overlay) {
        return (
            <div className="loading-overlay">
                {renderLoadingIndicator()}
                {showText && <div className="loading-text">{text}</div>}
            </div>
        );
    }

    // For inline loading indicator
    return (
        <div className="flex flex-col items-center justify-center" style={{ height: height || 'auto' }}>
            {renderLoadingIndicator()}
            {showText && <div className="loading-text">{text}</div>}
        </div>
    );
};

// Skeleton loader components for common UI patterns
export const SkeletonText = ({ lines = 1, width = '100%' }) => {
    return (
        <div className="space-y-2">
            {[...Array(lines)].map((_, index) => (
                <div
                    key={index}
                    className="loading-skeleton"
                    style={{
                        height: '1rem',
                        width: typeof width === 'string' ? width :
                            typeof width === 'object' ? width[index] || '100%' : '100%'
                    }}
                ></div>
            ))}
        </div>
    );
};

export const SkeletonCircle = ({ size = '3rem' }) => {
    return (
        <div
            className="loading-skeleton rounded-full"
            style={{
                height: size,
                width: size
            }}
        ></div>
    );
};

export const SkeletonCard = () => {
    return (
        <div className="card">
            <div className="card-body">
                <SkeletonCircle size="4rem" />
                <div className="mt-4">
                    <SkeletonText lines={3} width={['70%', '100%', '80%']} />
                </div>
            </div>
        </div>
    );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {[...Array(columns)].map((_, index) => (
                            <th key={index}>
                                <div className="loading-skeleton" style={{ height: '1.5rem', width: '80%' }}></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {[...Array(columns)].map((_, colIndex) => (
                                <td key={colIndex}>
                                    <div className="loading-skeleton" style={{ height: '1rem', width: '90%' }}></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Loading;