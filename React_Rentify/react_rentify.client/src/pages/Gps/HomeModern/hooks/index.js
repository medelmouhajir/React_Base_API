// Export existing hooks from Home directory
export { default as useGpsData } from '../../Home/hooks/useGpsData';
export { default as useRouteData } from '../../Home/hooks/useRouteData';
export { default as useMobileResponsive } from '../../Home/hooks/useMobileResponsive';

// Export new modern hooks
export { useSwipeGestures } from './useSwipeGestures';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useModernLayout } from './useModernLayout';
export { useLongPress } from './useLongPress';
export { useVisibilityChange } from './useVisibilityChange';
export { useNetworkStatus } from './useNetworkStatus';
export { useBatteryStatus } from './useBatteryStatus';

// Export existing modern hooks
export { default as useSpeedingAlerts } from './useSpeedingAlerts';