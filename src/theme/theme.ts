import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#8B4513', // Brown
    secondary: '#FFA500', // Orange
    background: '#FFFFFF', // White
    surface: '#FFFFFF', // White
    error: '#B00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#757575',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FFA500', // Orange for notifications
  },
};