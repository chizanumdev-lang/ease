export const Theme = {
  colors: {
    // Quiet Premium Palette (Sage & Clay)
    primary: {
      main: '#334537', // Deep Sage
      light: '#4a5d4e', // Primary Sage
      dark: '#171d18',
    },
    primaryContainer: {
      light: '#d3e8d5',
      dark: '#394b3d',
    },
    secondary: {
      main: '#d4c5b3', // Soft Sand / Beige
      light: '#e8ddce',
      dark: '#8b7f70',
    },
    secondaryContainer: {
      light: '#f2ece4',
      dark: '#5a5146',
    },
    tertiary: {
      main: '#c89f5d', // Golden Ochre
      light: '#e8c58b',
      dark: '#856126',
    },
    tertiaryContainer: {
      light: '#ffdcbd',
      dark: '#765028',
    },

    background: {
      light: '#f5fbf3', // Soft Mint Tint
      dark: '#171d18',
    },
    surface: {
      light: '#f5fbf3',
      dark: '#171d18',
    },

    text: {
      light: '#171d18',
      dark: '#f1f5f9',
      muted: '#434843',
    },

    surfaceContainerLowest: {
      light: '#f5fbf3',
      dark: '#171d18',
    },
    surfaceContainerLow: {
      light: '#eff5ed',
      dark: '#2c322d',
    },
    surfaceContainer: {
      light: '#eaefe8',
      dark: '#2c322d',
    },
    surfaceContainerHigh: {
      light: '#e4eae2',
      dark: '#434843',
    },
    surfaceContainerHighest: {
      light: '#dee4dd',
      dark: '#737872',
    },

    onSurface: {
      light: '#171d18',
      dark: '#f1f5f9',
    },
    onSurfaceVariant: {
      light: '#434843',
      dark: '#c3c8c1',
    },

    outline: {
      light: '#737872',
      dark: '#c3c8c1',
    },
    outlineVariant: {
      light: '#c3c8c1',
      dark: '#434843',
    },

    error: '#ba1a1a',
    success: '#4a5d4e',
    warning: '#765028',
    info: '#334537',

    // Quiet Gradients
    gradients: {
      primary: ['#4a5d4e', '#334537'],
      surface: ['#f5fbf3', '#ffffff'],
      dark: ['#171d18', '#2c322d'],
      clay: ['#f0bd8b', '#5c3913'],
    },

    // Glassmorphism
    glass: {
      light: 'rgba(255, 255, 255, 0.7)',
      dark: 'rgba(23, 29, 24, 0.7)',
      border: 'rgba(255, 255, 255, 0.2)',
    },

    white: '#ffffff',
    transparent: 'transparent',
  },
  fonts: {
    display: 'Newsreader_400Regular', // High-end literary serif
    displayBold: 'Newsreader_700Bold',
    label: 'DMSans_500Medium', // Functional modern sans
    labelBold: 'DMSans_700Bold',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
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
    xxxl: 48, // Signature rounded corners
    full: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    ambient: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 8,
    },
    premium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
