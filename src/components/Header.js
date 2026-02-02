import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, typography, borderRadius, touchTargets } from '../constants/theme';

export default function Header({
  title,
  subtitle,
  rightAction,
  leftAction,
  variant = 'gradient', // 'gradient', 'solid', 'transparent'
}) {
  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.leftSection}>
        {leftAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={leftAction.onPress}
            accessibilityLabel={leftAction.label}
          >
            <Text style={styles.actionIcon}>{leftAction.icon}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSection}>
        {rightAction && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={rightAction.onPress}
            accessibilityLabel={rightAction.label}
          >
            <Text style={styles.primaryActionIcon}>{rightAction.icon || '+'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={gradients.night}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {renderContent()}
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={variant === 'transparent' ? 'dark-content' : 'light-content'} />
      <View style={[styles.container, variant === 'solid' && styles.solidContainer]}>
        {renderContent()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  solidContainer: {
    backgroundColor: colors.headerBackground,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: touchTargets.minimum,
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  rightSection: {
    width: touchTargets.minimum,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray400,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: typography.sizes.xl,
    color: colors.textInverse,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  primaryActionIcon: {
    fontSize: typography.sizes.xxl,
    color: colors.textInverse,
    fontWeight: typography.weights.regular,
  },
});
