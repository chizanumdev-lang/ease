import React from 'react';
import { StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface RewardAnimationProps {
    trigger: boolean;
    onAnimationEnd?: () => void;
}

export default function RewardAnimation({ trigger, onAnimationEnd }: RewardAnimationProps) {
    if (!trigger) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ConfettiCannon
                count={200}
                origin={{ x: -10, y: 0 }}
                autoStart={true}
                fadeOut={true}
                fallSpeed={3000}
                onAnimationEnd={onAnimationEnd}
            />
        </View>
    );
}
