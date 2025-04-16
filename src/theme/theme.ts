import { MD3LightTheme } from 'react-native-paper';

const palette = {
  primary: '#4A6FA5', // Blue shade
  secondary: '#FF8D3F', // Orange
  accent: '#4ECDC4', // Teal
  background: '#FFFFFF',
  surface: '#F8F9FB',
  error: '#E63946',
  text: '#2B2D42',
  disabled: '#9EA3B0',
  placeholder: '#B0B5BD',
  notification: '#FF8D3F',
  success: '#57CC99',
  warning: '#FFD166',
  info: '#4ECDC4',
  card: '#FFFFFF',
  divider: '#E9ECEF',
};

// Spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography system
const typography = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
  bold: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
  },
  h1: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
  },
  h3: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 26,
  },
  body1: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
  },
};

// Shadows system
const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.0,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5.0,
    elevation: 5,
  },
};

// Animation durations
const animation = {
  short: 150,
  medium: 300,
  long: 500,
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...palette,
  },
  spacing,
  typography,
  shadows,
  animation,
  roundness: 12,
  defaultCardStyle: {
    backgroundColor: palette.card,
    borderRadius: 12,
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  defaultInputStyle: {
    marginBottom: spacing.md,
    backgroundColor: palette.surface,
  },
  defaultButtonStyle: {
    borderRadius: 8,
    paddingVertical: spacing.sm,
  },
  severityColors: {
    low: palette.success,
    medium: palette.warning,
    high: palette.error,
  },
};