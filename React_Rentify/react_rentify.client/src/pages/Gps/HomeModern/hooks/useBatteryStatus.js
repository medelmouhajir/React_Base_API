export const useBatteryStatus = () => {
    const [battery, setBattery] = useState(null);
    const [isLowBattery, setIsLowBattery] = useState(false);

    useEffect(() => {
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                setBattery({
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                });

                setIsLowBattery(battery.level < 0.2 && !battery.charging);

                const updateBattery = () => {
                    setBattery({
                        level: battery.level,
                        charging: battery.charging,
                        chargingTime: battery.chargingTime,
                        dischargingTime: battery.dischargingTime
                    });
                    setIsLowBattery(battery.level < 0.2 && !battery.charging);
                };

                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);

                return () => {
                    battery.removeEventListener('levelchange', updateBattery);
                    battery.removeEventListener('chargingchange', updateBattery);
                };
            });
        }
    }, []);

    return { battery, isLowBattery };
};