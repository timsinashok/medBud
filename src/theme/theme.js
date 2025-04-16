import { MD3LightTheme } from 'react-native-paper';
import { Platform } from 'react-native';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#aa9b82', // Deep Brown for professional look
    secondary: '#F4A261', // Warm Orange for accents
    background: '#FAFAFA', // Light Gray for clean background
    surface: '#FFFFFF', // Pure White for cards
    error: '#D32F2F', // Vibrant Red for errors
    text: '#212121', // Dark Gray for text
    onSurface: '#212121', // Dark Gray for on-surface text
    disabled: '#B0BEC5', // Light Gray for disabled states
    placeholder: '#78909C', // Medium Gray for placeholders
    backdrop: 'rgba(33, 33, 33, 0.5)', // Semi-transparent dark backdrop
    notification: '#F4A261', // Orange for notifications
    elevation: {
      level0: 'transparent',
      level1: 'rgba(0, 0, 0, 0.05)',
      level2: 'rgba(0, 0, 0, 0.08)',
      level3: 'rgba(0, 0, 0, 0.11)',
      level4: 'rgba(0, 0, 0, 0.14)',
      level5: 'rgba(0, 0, 0, 0.17)',
    },
  },
  typography: {
    regular: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontWeight: '400',
      fontSize: 16,
    },
    medium: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      fontWeight: '500',
      fontSize: 16,
    },
    bold: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
      fontWeight: '700',
      fontSize: 16,
    },
    title: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontWeight: '700',
      fontSize: 20,
    },
    caption: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontWeight: '400',
      fontSize: 12,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: 8,
  animation: {
    scale: 1.0,
    duration: 300,
  },
};