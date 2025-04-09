'use client'

// This file defines the design system tokens and variables for the Cylestio UI
// It provides a centralized place for colors, spacing, typography, and other design constants

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f5ff',
    100: '#e0ebff',
    200: '#c1d8ff',
    300: '#a2c4ff',
    400: '#83b0ff',
    500: '#4d8bff', // Main primary color
    600: '#3878f6',
    700: '#2165e3',
    800: '#154bc8',
    900: '#1243a7'
  },
  
  // Secondary color palette
  secondary: {
    50: '#f3f9fb',
    100: '#e5f3f8',
    200: '#c7e7f1',
    300: '#a9dbe9',
    400: '#8bcfe2',
    500: '#5eb7d0', // Main secondary color
    600: '#4597ad',
    700: '#2d768a',
    800: '#19576a',
    900: '#103e4e'
  },
  
  // Success colors (greens)
  success: {
    50: '#ebfaf0',
    100: '#d7f5e1',
    200: '#b0ebc3',
    300: '#88e1a5',
    400: '#61d787',
    500: '#39c369', // Main success color
    600: '#2ba356',
    700: '#1e8544',
    800: '#156632',
    900: '#0c4d23'
  },
  
  // Warning colors (yellows/oranges)
  warning: {
    50: '#fff9eb',
    100: '#fff3d6',
    200: '#ffe7ad',
    300: '#ffdb85',
    400: '#ffcf5c',
    500: '#ffc333', // Main warning color
    600: '#e6a416',
    700: '#b37d0e',
    800: '#805907',
    900: '#4d3503'
  },
  
  // Error colors (reds)
  error: {
    50: '#fdedee',
    100: '#fadcdc',
    200: '#f6b9b9',
    300: '#f19595',
    400: '#ec7272',
    500: '#e74e4e', // Main error color
    600: '#d03d40',
    700: '#a82c31',
    800: '#811d23',
    900: '#5a1317'
  },
  
  // Neutral colors (grays)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280', // Main neutral color
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

// Spacing system based on 4px increments
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px'
}

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
}

// Borders and radii
export const borders = {
  width: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },
  radius: {
    none: '0px',
    sm: '0.25rem',     // 4px
    md: '0.375rem',    // 6px 
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px'     // Fully rounded (circle)
  }
}

// Shadows
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none'
}

// Z-index scale
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto'
}

// Transitions
export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

// Semantic color tokens
export const semanticColors = {
  // Background colors
  background: {
    primary: colors.neutral[50],
    secondary: colors.neutral[100],
    card: '#ffffff',
    hover: colors.neutral[100],
    active: colors.primary[50]
  },
  
  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    disabled: colors.neutral[400],
    inverse: '#ffffff'
  },
  
  // Border colors
  border: {
    light: colors.neutral[200],
    default: colors.neutral[300],
    focus: colors.primary[500],
    hover: colors.neutral[400]
  },
  
  // Status colors
  status: {
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.primary[500]
  }
}

// Export all design tokens as a unified object
export const designTokens = {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  zIndex,
  transitions,
  semanticColors
}

export default designTokens; 