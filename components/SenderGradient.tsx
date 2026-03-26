import { Dimensions, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SenderGradientProps {
    heightRatio?: number;
}

/**
 * Fond vert solide pour les écrans sender — simple, sans animation.
 */
export function SenderGradient({ heightRatio = 0.55 }: SenderGradientProps) {
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: SCREEN_HEIGHT * heightRatio,
                zIndex: 0,
                backgroundColor: '#14533d',
            }}
        />
    );
}
