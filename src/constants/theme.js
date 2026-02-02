/**
 * Mavy Design System - "Warm Modern"
 *
 * Direction artistique:
 * - Palette chaude et accueillante
 * - Dégradés subtils pour la profondeur
 * - Ombres colorées et douces
 * - Coins arrondis généreux
 * - Contraste élevé pour la lisibilité
 */

// Palette de couleurs principale
export const colors = {
  // Couleurs primaires - Indigo/Violet chaud
  primary: '#6366f1',
  primaryLight: '#a5b4fc',
  primaryDark: '#4f46e5',
  primaryGradientStart: '#6366f1',
  primaryGradientEnd: '#8b5cf6',

  // Accent - Corail/Orange chaud pour les CTAs
  accent: '#f97316',
  accentLight: '#fed7aa',
  accentDark: '#ea580c',
  accentGradientStart: '#f97316',
  accentGradientEnd: '#fb923c',

  // Succès - Émeraude
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',

  // Danger - Rouge corail
  danger: '#f43f5e',
  dangerLight: '#fecdd3',
  dangerDark: '#e11d48',

  // Warning - Ambre
  warning: '#f59e0b',
  warningLight: '#fef3c7',

  // Neutres chauds
  warmGray50: '#fafaf9',
  warmGray100: '#f5f5f4',
  warmGray200: '#e7e5e4',
  warmGray300: '#d6d3d1',
  warmGray400: '#a8a29e',
  warmGray500: '#78716c',
  warmGray600: '#57534e',
  warmGray700: '#44403c',
  warmGray800: '#292524',
  warmGray900: '#1c1917',

  // Couleurs de fond
  background: '#faf9f7',
  backgroundSecondary: '#f5f3f0',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  // Header sombre pour contraste
  headerBackground: '#1c1917',
  headerText: '#ffffff',

  // Couleurs de texte
  textPrimary: '#1c1917',
  textSecondary: '#57534e',
  textMuted: '#a8a29e',
  textInverse: '#ffffff',
  textOnPrimary: '#ffffff',

  // Bordures
  border: '#e7e5e4',
  borderLight: '#f5f5f4',
  borderFocus: '#6366f1',

  // Overlays
  overlay: 'rgba(28, 25, 23, 0.5)',
  overlayLight: 'rgba(28, 25, 23, 0.1)',
};

// Dégradés prédéfinis
export const gradients = {
  primary: ['#6366f1', '#8b5cf6'],
  accent: ['#f97316', '#fb923c'],
  sunset: ['#f97316', '#f43f5e'],
  ocean: ['#06b6d4', '#6366f1'],
  forest: ['#10b981', '#06b6d4'],
  night: ['#1c1917', '#44403c'],
  card: ['#ffffff', '#fafaf9'],
};

// Couleurs pour les catégories (palette variée)
export const categoryColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Jaune
  '#22c55e', // Vert
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Bleu
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  // Line heights pour meilleure lisibilité
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
  xlarge: 64,
};

// Ombres avec teinte colorée
export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: '#78716c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  md: {
    elevation: 4,
    shadowColor: '#78716c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  lg: {
    elevation: 8,
    shadowColor: '#78716c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  // Ombre colorée pour les éléments primaires
  primary: {
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  accent: {
    elevation: 4,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};

// Animations timing
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

export default {
  colors,
  gradients,
  categoryColors,
  spacing,
  typography,
  borderRadius,
  touchTargets,
  shadows,
  animation,
};
