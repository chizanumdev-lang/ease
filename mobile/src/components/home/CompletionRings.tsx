import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Svg, { Circle } from 'react-native-svg';

interface CompletionRingsProps {
    morning: boolean;
    tasks: boolean | number;
    night: boolean;
    size?: number;
    strokeWidth?: number;
}

export const CompletionRings: React.FC<CompletionRingsProps> = ({ 
    morning, 
    tasks, 
    night,
    size = 120,
    strokeWidth = 12
}) => {
    const { colors } = useTheme();
    const center = size / 2;
    
    // Radii for the three rings
    const r1 = (size - strokeWidth) / 2;
    const r2 = r1 - strokeWidth - 4;
    const r3 = r2 - strokeWidth - 4;

    const circumference = (r: number) => 2 * Math.PI * r;

    const taskProgress = typeof tasks === 'number' ? tasks : (tasks ? 1 : 0);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background Rings */}
                <Circle cx={center} cy={center} r={r1} stroke={colors.outlineVariant} strokeWidth={strokeWidth} fill="none" />
                <Circle cx={center} cy={center} r={r2} stroke={colors.outlineVariant} strokeWidth={strokeWidth} fill="none" />
                <Circle cx={center} cy={center} r={r3} stroke={colors.outlineVariant} strokeWidth={strokeWidth} fill="none" />

                {/* Foreground Rings */}
                <Circle 
                    cx={center} 
                    cy={center} 
                    r={r1} 
                    stroke={colors.primary} 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round"
                    fill="none" 
                    strokeDasharray={`${circumference(r1)}`}
                    strokeDashoffset={morning ? 0 : circumference(r1)}
                    transform={`rotate(-90 ${center} ${center})`}
                />
                <Circle 
                    cx={center} 
                    cy={center} 
                    r={r2} 
                    stroke={colors.secondary} 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round"
                    fill="none" 
                    strokeDasharray={`${circumference(r2)}`}
                    strokeDashoffset={circumference(r2) * (1 - Math.min(1, Math.max(0, taskProgress)))}
                    transform={`rotate(-90 ${center} ${center})`}
                />
                <Circle 
                    cx={center} 
                    cy={center} 
                    r={r3} 
                    stroke={colors.accent} 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round"
                    fill="none" 
                    strokeDasharray={`${circumference(r3)}`}
                    strokeDashoffset={night ? 0 : circumference(r3)}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

});
