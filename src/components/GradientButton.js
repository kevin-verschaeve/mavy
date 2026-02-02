import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function GradientButton({
  title,
  onPress,
  variant = 'primary', // 'primary', 'accent', 'outline', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  icon,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const getGradientColors = () => {
    if (disabled) return [colors.warmGray300, colors.warmGray400];
    switch (variant) {
      case 'accent':
        return gradients.accent;
      case 'success':
        return [colors.success, colors.successDark];
      case 'danger':
        return [colors.danger, colors.dangerDark];
      default:
        return gradients.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          minHeight: touchTargets.minimum,
        };
      case 'lg':
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xxl,
          minHeight: touchTargets.large,
        };
      default:
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          minHeight: touchTargets.comfortable,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return typography.sizes.sm;
      case 'lg':
        return typography.sizes.lg;
      default:
        return typography.sizes.md;
    }
  };

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          getSizeStyles(),
          variant === 'outline' && styles.outlineButton,
          variant === 'ghost' && styles.ghostButton,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.text,
            { fontSize: getTextSize() },
            variant === 'outline' && styles.outlineText,
            variant === 'ghost' && styles.ghostText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          getSizeStyles(),
          disabled ? shadows.sm : (variant === 'accent' ? shadows.accent : shadows.primary),
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.text, { fontSize: getTextSize() }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.warmGray400,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
});
