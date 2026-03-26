import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle } from 'react-native';

interface AnimatedPressableProps extends PressableProps {
    children: React.ReactNode;
    className?: string;
    style?: ViewStyle | ViewStyle[];
    scaleValue?: number;
    haptic?: boolean;
}

/**
 * Premium animated pressable — spring-back scale + haptic feedback.
 * Drop-in replacement for TouchableOpacity with a liquid, tactile feel.
 */
export function AnimatedPressable({
    children,
    style,
    className,
    scaleValue = 0.96,
    haptic = true,
    onPressIn,
    onPressOut,
    ...props
}: AnimatedPressableProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scale, {
            toValue: scaleValue,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();

        if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        }

        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 6,
        }).start();
        onPressOut?.(e);
    };

    return (
        <Animated.View
            className={className}
            style={[style, { transform: [{ scale }] }]}
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                {...props}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}
