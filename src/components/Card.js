import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

export default function Card({
  children,
  onPress,
  onLongPress,
  style,
  accentColor,
  variant = 'default', // 'default', 'elevated', 'outlined'
}) {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// Sous-composants pour structurer le contenu
Card.Header = function CardHeader({ children, style }) {
  return <View style={[styles.header, style]}>{children}</View>;
};

Card.Title = function CardTitle({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

Card.Subtitle = function CardSubtitle({ children, style }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
};

Card.Body = function CardBody({ children, style }) {
  return <View style={[styles.body, style]}>{children}</View>;
};

Card.Footer = function CardFooter({ children, style }) {
  return <View style={[styles.footer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  body: {
    marginVertical: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
