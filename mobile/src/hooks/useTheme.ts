import { useColorScheme } from 'react-native';
import { Theme } from '../constants/theme';

export const useTheme = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const colors = {
        primary: isDark ? Theme.colors.primary.dark : Theme.colors.primary.main,
        primaryLight: isDark ? Theme.colors.primaryContainer.dark : Theme.colors.primary.light,
        primaryContainer: isDark ? Theme.colors.primaryContainer.dark : Theme.colors.primaryContainer.light,
        secondary: isDark ? Theme.colors.secondary.dark : Theme.colors.secondary.main,
        secondaryContainer: isDark ? Theme.colors.secondary.dark : Theme.colors.secondary.light,
        background: isDark ? Theme.colors.background.dark : Theme.colors.background.light,
        surface: isDark ? Theme.colors.surface.dark : Theme.colors.surface.light,
        text: isDark ? Theme.colors.text.dark : Theme.colors.text.light,
        textMuted: isDark ? Theme.colors.onSurfaceVariant.dark : Theme.colors.text.muted,
        onSurface: isDark ? Theme.colors.onSurface.dark : Theme.colors.onSurface.light,
        onSurfaceVariant: isDark ? Theme.colors.onSurfaceVariant.dark : Theme.colors.onSurfaceVariant.light,
        surfaceContainerLow: isDark ? Theme.colors.surfaceContainerLow.dark : Theme.colors.surfaceContainerLow.light,
        surfaceContainerHigh: isDark ? Theme.colors.surfaceContainerHigh.dark : Theme.colors.surfaceContainerHigh.light,
        surfaceContainerHighest: isDark ? Theme.colors.surfaceContainerHighest.dark : Theme.colors.surfaceContainerHighest.light,
        outline: isDark ? Theme.colors.outline.dark : Theme.colors.outline.light,
        outlineVariant: isDark ? Theme.colors.outlineVariant.dark : Theme.colors.outlineVariant.light,
        accent: isDark ? Theme.colors.primary.dark : Theme.colors.primary.main,
        error: Theme.colors.error,
        success: Theme.colors.success,
        white: Theme.colors.white,
        transparent: Theme.colors.transparent,
        glass: Theme.colors.glass,
        gradients: Theme.colors.gradients,
    };

    const toggleTheme = () => {
        console.log('Theme toggling not yet implemented with persistence');
    };

    return {
        colors,
        isDark,
        spacing: Theme.spacing,
        borderRadius: Theme.borderRadius,
        fonts: Theme.fonts,
        shadows: Theme.shadows,
        toggleTheme,
    };
};
