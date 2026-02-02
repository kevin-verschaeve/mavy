import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function ActionButton({ action, onPress, onHistoryPress, onLongPress, lastEntry }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        accessibilityLabel={`Action ${action.name}`}
        accessibilityRole="button"
        accessibilityHint="Appui long pour plus d'options"
      >
        <View style={styles.content}>
          <Text style={styles.actionName}>{action.name}</Text>
          <Text style={styles.lastDate}>
            Derniere fois: {formatRelativeDate(lastEntry?.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={onHistoryPress}
        activeOpacity={0.7}
        accessibilityLabel={`Historique de ${action.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.historyIcon}>📋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  content: {
    flexDirection: 'column',
  },
  actionName: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  lastDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.sm,
  },
  historyButton: {
    backgroundColor: colors.gray500,
    width: touchTargets.large,
    height: touchTargets.large,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  historyIcon: {
    fontSize: typography.sizes.xxl,
  },
});
