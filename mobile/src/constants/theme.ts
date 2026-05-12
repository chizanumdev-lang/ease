export const Theme = {
    colors: {
        // Premium Palette
        primary: {
            main: '#0284c7', // Calm Ocean Blue
            light: '#38bdf8',
            dark: '#0369a1', 
        },
        primaryContainer: {
            light: '#e0f2fe',
            dark: '#0c4a6e',
        },
        secondary: {
            main: '#10b981', // Serene Mint Green
            light: '#6ee7b7',
            dark: '#065f46',
        },
        secondaryContainer: {
            light: '#d1fae5',
            dark: '#064e3b',
        },
        
        background: {
            light: '#ffffff',
            dark: '#020617', // Rich Black-Blue
        },
        surface: {
            light: '#f8fafc',
            dark: '#0f172a', 
        },
        
        text: {
            light: '#0f172a',
            dark: '#f1f5f9',
            muted: '#64748b',
        },

        surfaceContainerLow: {
            light: '#f1f5f9',
            dark: '#334155',
        },
        surfaceContainer: {
            light: '#e2e8f0',
            dark: '#1e293b',
        },
        surfaceContainerHigh: {
            light: '#cbd5e1',
            dark: '#475569',
        },
        surfaceContainerHighest: {
            light: '#94a3b8',
            dark: '#64748b',
        },
        
        onSurface: {
            light: '#0f172a',
            dark: '#f8fafc',
        },
        onSurfaceVariant: {
            light: '#475569',
            dark: '#94a3b8',
        },
        
        outline: {
            light: '#cbd5e1',
            dark: '#475569',
        },
        outlineVariant: {
            light: '#e2e8f0',
            dark: '#334155',
        },
        
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6',

        // Premium Gradients
        gradients: {
            primary: ['#0284c7', '#10b981'], // Blue to Green
            secondary: ['#10b981', '#34d399'], // Green to Mint
            surface: ['#ffffff', '#f8fafc'],
            dark: ['#020617', '#0f172a'],
        },

        // Glassmorphism
        glass: {
            light: 'rgba(255, 255, 255, 0.7)',
            dark: 'rgba(15, 23, 42, 0.7)',
            border: 'rgba(255, 255, 255, 0.2)',
        },

        white: '#ffffff',
        transparent: 'transparent',
    },
    fonts: {
        display: 'Outfit_700Bold', // High-end rounded geometric
        label: 'Outfit_500Medium',
        body: 'Inter_400Regular',
        bodyMedium: 'Inter_500Medium',
        mono: 'SpaceMono_400Regular',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        xxxl: 48,
        full: 9999,
    },
    shadows: {
        soft: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
        },
        ambient: {
            shadowColor: '#0284c7',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 8,
        },
        premium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.15,
            shadowRadius: 30,
            elevation: 12,
        }
    }
};

