import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useNetwork } from '../hooks/useNetwork';

export const OfflineBanner = () => {
    const { isConnected } = useNetwork();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isConnected === false) {
            setShow(true);
        } else {
            // Hide banner after 3 seconds of reconnection
            if (show) {
                const timer = setTimeout(() => setShow(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isConnected]);

    if (!show) return null;

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutUp}
            className={`absolute top-12 left-4 right-4 z-50 p-3 rounded-lg flex-row justify-center items-center shadow-lg ${isConnected === false ? 'bg-red-500' : 'bg-green-500'}`}
        >
            <Text className="text-white font-bold text-center">
                {isConnected === false ? "Aucune connexion Internet" : "Connexion Internet rétablie"}
            </Text>
        </Animated.View>
    );
};
