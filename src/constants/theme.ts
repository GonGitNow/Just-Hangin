import { ThemeColors, ThemeSpacing, ThemeTypography, ThemeBorderRadius, ThemeShadow, AppTheme } from '../types';

// Light theme colors
const lightColors: ThemeColors = {
  primary: '#3498db',       // Bright blue
  secondary: '#9b59b6',     // Purple
  background: '#ffffff',    // White
  card: '#f5f6fa',         // Light gray
  text: '#2c3e50',         // Dark blue-gray
  border: '#dcdde1',       // Light gray
  notification: '#e74c3c',  // Bright red for notifications
  error: '#e74c3c',         // Bright red for errors
  success: '#2ecc71',       // Emerald green for success states
  warning: '#f39c12',       // Amber for warnings
  info: '#3498db',          // Blue for information
  disabled: '#bdc3c7',      // Light gray for disabled states
  placeholder: '#95a5a6',   // Gray for placeholders
  accent: '#e84393',        // Pink accent
  darkBackground: '#f5f6fa', // Light gray for dark mode
  lightText: '#2c3e50',     // Dark blue-gray for light text
  highlight: '#00cec9',     // Teal highlight
  overlay: 'rgba(255,255,255,0.8)', // Light overlay for modals
  cardShadow: '#dcdde1',    // Light shadow
  gradientStart: '#3498db', // Blue gradient start
  gradientEnd: '#9b59b6',   // Purple gradient end
  deepSpace: '#f5f6fa',     // Light space color
  white: '#ffffff',         // White
};

// Dark theme colors
const darkColors: ThemeColors = {
  primary: '#3498db',       // Bright blue
  secondary: '#9b59b6',     // Purple
  background: '#1a1a2e',    // Deep navy
  card: '#16213e',          // Slightly lighter navy
  text: '#ffffff',          // Pure white text
  border: '#4a69bd',        // Medium blue borders
  notification: '#e74c3c',  // Bright red for notifications
  error: '#e74c3c',         // Bright red for errors
  success: '#2ecc71',       // Emerald green for success states
  warning: '#f39c12',       // Amber for warnings
  info: '#3498db',          // Blue for information
  disabled: '#7f8c8d',      // Slate gray for disabled states
  placeholder: '#bdc3c7',   // Light gray for placeholders
  accent: '#e84393',        // Pink accent
  darkBackground: '#0f3460', // Deeper navy for dark mode
  lightText: '#ecf0f1',     // Off-white for light text
  highlight: '#00cec9',     // Teal highlight
  overlay: 'rgba(26,26,46,0.8)', // Overlay for modals
  cardShadow: '#0f3460',    // Navy shadow
  gradientStart: '#3498db', // Blue gradient start
  gradientEnd: '#9b59b6',   // Purple gradient end
  deepSpace: '#0f3460',     // Deep space color
  white: '#ffffff',         // White
};

// Spacing
export const spacing: ThemeSpacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 22,
    xxl: 28,
  },
  lineHeight: {
    xs: 16,
    s: 20,
    m: 24,
    l: 28,
    xl: 32,
    xxl: 36,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Border radius
export const borderRadius: ThemeBorderRadius = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const shadow: ThemeShadow = {
  light: {
    shadowColor: lightColors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: lightColors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dark: {
    shadowColor: lightColors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: lightColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Create theme objects
const lightTheme: AppTheme = {
  isDark: false,
  colors: lightColors,
  spacing,
  typography,
  borderRadius,
  shadow,
};

const darkTheme: AppTheme = {
  isDark: true,
  colors: darkColors,
  spacing,
  typography,
  borderRadius,
  shadow: {
    ...shadow,
    light: {
      ...shadow.light,
      shadowColor: darkColors.cardShadow,
    },
    medium: {
      ...shadow.medium,
      shadowColor: darkColors.cardShadow,
    },
    dark: {
      ...shadow.dark,
      shadowColor: darkColors.cardShadow,
    },
    button: {
      ...shadow.button,
      shadowColor: darkColors.primary,
    },
  },
};

// Export default theme and colors
export const theme = lightTheme;
export const colors = lightColors;
export { lightTheme, darkTheme }; 