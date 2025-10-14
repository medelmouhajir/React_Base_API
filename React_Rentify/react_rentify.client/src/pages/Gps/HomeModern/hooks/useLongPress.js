export const useLongPress = (callback, options = {}) => {
    const { threshold = 500, onStart, onFinish, onCancel } = options;
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef();
    const target = useRef();

    const start = useCallback(
        (event) => {
            if (onStart) {
                onStart(event);
            }
            target.current = event.target;
            timeout.current = setTimeout(() => {
                callback(event);
                setLongPressTriggered(true);
            }, threshold);
        },
        [callback, threshold, onStart]
    );

    const clear = useCallback(
        (event, shouldTriggerOnFinish = true) => {
            timeout.current && clearTimeout(timeout.current);
            shouldTriggerOnFinish && longPressTriggered && onFinish?.(event);
            setLongPressTriggered(false);
        },
        [longPressTriggered, onFinish]
    );

    return {
        onMouseDown: (e) => start(e),
        onTouchStart: (e) => start(e),
        onMouseUp: (e) => clear(e),
        onMouseLeave: (e) => clear(e, false),
        onTouchEnd: (e) => clear(e),
    };
};