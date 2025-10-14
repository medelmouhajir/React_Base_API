import { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts = {}) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Don't trigger shortcuts when typing in inputs
            if (event.target.tagName === 'INPUT' ||
                event.target.tagName === 'TEXTAREA' ||
                event.target.contentEditable === 'true') {
                return;
            }

            const key = event.key.toLowerCase();
            const isCtrl = event.ctrlKey || event.metaKey;
            const isShift = event.shiftKey;
            const isAlt = event.altKey;

            // Create key combination string
            let keyCombo = '';
            if (isCtrl) keyCombo += 'ctrl+';
            if (isShift) keyCombo += 'shift+';
            if (isAlt) keyCombo += 'alt+';
            keyCombo += key;

            // Check for exact key match first
            if (shortcuts[key]) {
                event.preventDefault();
                shortcuts[key]();
                return;
            }

            // Check for key combination match
            if (shortcuts[keyCombo]) {
                event.preventDefault();
                shortcuts[keyCombo]();
                return;
            }

            // Special case for escape key
            if (key === 'escape' && shortcuts['escape']) {
                event.preventDefault();
                shortcuts['escape']();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
};

export default useKeyboardShortcuts;