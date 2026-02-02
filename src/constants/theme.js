/**
 * Design tokens pour l'application Mavy
 */

export const colors = {
  // Couleurs primaires
  primary: '#3b82f6',
  primaryLight: '#eff6ff',
  primaryDark: '#2563eb',

  // Couleurs de succès
  success: '#10b981',
  successLight: '#d1fae5',

  // Couleurs de danger
  danger: '#ef4444',
  dangerLight: '#fee2e2',

  // Couleurs neutres
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Couleurs de fond
  background: '#f5f5f5',
  surface: '#ffffff',

  // Couleurs de texte
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',

  // Bordures
  border: '#e0e0e0',
  borderLight: '#e5e7eb',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  // Tailles de police
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },

  // Poids de police
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Taille minimum pour les touch targets (accessibilité)
export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
};

// Ombres
export const shadows = {
  sm: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  md: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  touchTargets,
  shadows,
};
