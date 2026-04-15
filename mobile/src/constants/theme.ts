export const Theme = {
    colors: {
        // Core Palettes (Nested for legacy compatibility and theme switching)
        primary: {
            main: '#225344', // Dark Green (Light Mode Primary)
            light: '#3b6b5b',
            dark: '#fafaf5', // Contrast Neutral (Dark Mode Primary)
        },
        primaryContainer: {
            light: '#3b6b5b',
            dark: '#163a2f',
        },
        secondary: {
            main: '#56624b', // Updated from design
            light: '#dae7ca',
            dark: '#becbaf',
        },
        secondaryContainer: {
            light: '#d7e4c7', // New from design
            dark: '#3f4a35',
        },
        
        background: {
            light: '#fafaf5', // Warm Neutral Base
            dark: '#225344', // Deep Green Base
        },
        surface: {
            light: '#ffffff',
            dark: '#2b5d4e', // Lighter Green Surface
        },
        
        text: {
            light: '#1a1c19', // onSurface High-end charcoal
            dark: '#fafaf5',  // onSurface Warm Neutral
            muted: '#3e494a', // onSurfaceVariant
        },

        surfaceContainerLow: {
            light: '#f4f4ef',
            dark: '#1e4a3c',
        },
        surfaceContainer: {
            light: '#eeeee9',
            dark: '#1a1c19',
        },
        surfaceContainerHigh: {
            light: '#e8e8e3',
            dark: '#1b4236',
        },
        surfaceContainerHighest: {
            light: '#e3e3de',
            dark: '#163a2f',
        },
        
        onSurface: {
            light: '#1a1c19',
            dark: '#fafaf5',
        },
        onSurfaceVariant: {
            light: '#3e494a',
            dark: '#b0babb',
        },
        
        outline: {
            light: '#6f797a', // Updated from design
            dark: '#89938f',
        },
        outlineVariant: {
            light: '#bec8ca', // Updated from design
            dark: '#3f4948',
        },
        
        error: '#ba1a1a',

        // Legacy & Utility Palettes (to prevent crashes in un-migrated components)
        accent: '#225344', 
        slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
        },

        // Quick access / Flattended aliases for components
        white: '#ffffff',
        transparent: 'transparent',
    },
    fonts: {
        display: 'Manrope_700Bold',
        label: 'Manrope_500Medium',
        body: 'Inter_400Regular',
        bodyMedium: 'Inter_500Medium',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        xxl: 48,
        full: 9999,
    },
    shadows: {
        ambient: {
            shadowColor: '#225344',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.06,
            shadowRadius: 40,
            elevation: 8,
        }
    }
};

