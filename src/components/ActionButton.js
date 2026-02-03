import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function ActionButton({ action, onPress, onHistoryPress, onLongPress, lastEntry }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
        accessibilityLabel={`Action ${action.name}`}
        accessibilityRole="button"
        accessibilityHint="Appui long pour plus d'options"
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <View style={styles.content}>
            <Text style={styles.actionName} numberOfLines={1}>{action.name}</Text>
            <View style={styles.lastDateContainer}>
              <Text style={styles.clockIcon}>🕐</Text>
              <Text style={styles.lastDate}>
                {formatRelativeDate(lastEntry?.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.tapIndicator}>
            <Text style={styles.tapIcon}>▶</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={onHistoryPress}
        activeOpacity={0.7}
        accessibilityLabel={`Historique de ${action.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.historyIcon}>📊</Text>
        <Text style={styles.historyLabel}>Histo.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
    ...shadows.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    minHeight: touchTargets.xlarge,
  },
  content: {
    flex: 1,
  },
  actionName: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  lastDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: typography.sizes.xs,
    marginRight: spacing.xs,
  },
  lastDate: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.sizes.sm,
  },
  tapIndicator: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  tapIcon: {
    color: colors.textInverse,
    fontSize: typography.sizes.sm,
  },
  historyButton: {
    backgroundColor: colors.surface,
    width: touchTargets.xlarge,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  historyIcon: {
    fontSize: typography.sizes.xl,
    marginBottom: spacing.xs,
  },
  historyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
