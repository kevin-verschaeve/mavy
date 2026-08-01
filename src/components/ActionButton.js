import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeDate, formatDayCount, formatShortDate } from '../utils/dateUtils';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function statusFromDaysUntilDue(daysUntilDue, warnDays) {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warnDays) return 'warning';
  return null;
}

function formatDueLabel(daysUntilDue) {
  if (daysUntilDue < 0) return `En retard de ${formatDayCount(-daysUntilDue)}`;
  if (daysUntilDue === 0) return "À faire aujourd'hui";
  return `Dans ${formatDayCount(daysUntilDue)}`;
}

// Retourne { status, label } : status pilote le badge, label résume le rappel.
// status vaut null quand rien n'est à signaler, label null quand il n'y a pas de rappel.
export function computeReminder(action, lastEntry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warnDays = action.reminder_warn_days ? Number(action.reminder_warn_days) : 30;

  // Rappel à date fixe : one-shot, consommé par une entrée postérieure à l'échéance
  if (action.reminder_date) {
    const dueDate = parseLocalDate(action.reminder_date);
    if (lastEntry?.created_at && parseLocalDate(lastEntry.created_at) >= dueDate) {
      return { status: null, label: null };
    }
    const daysUntilDue = Math.round((dueDate - today) / MS_PER_DAY);
    return {
      status: statusFromDaysUntilDue(daysUntilDue, warnDays),
      label: `${formatShortDate(dueDate)} · ${formatDueLabel(daysUntilDue)}`,
    };
  }

  if (!action.reminder_interval_days) return { status: null, label: null };

  // Rappel périodique : l'échéance court depuis la dernière entrée
  const intervalDays = Number(action.reminder_interval_days);
  const everyLabel = `Tous les ${formatDayCount(intervalDays)}`;

  // Sans entrée, la périodicité est connue mais l'échéance ne l'est pas
  if (!lastEntry?.created_at) return { status: null, label: everyLabel };

  const daysSince = Math.floor((today - parseLocalDate(lastEntry.created_at)) / MS_PER_DAY);
  const daysUntilDue = intervalDays - daysSince;
  return {
    status: statusFromDaysUntilDue(daysUntilDue, warnDays),
    label: `${everyLabel} · ${formatDueLabel(daysUntilDue)}`,
  };
}

export default function ActionButton({ action, onPress, onHistoryPress, onLongPress, lastEntry }) {
  const { status: reminderStatus, label: reminderLabel } = computeReminder(action, lastEntry);

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
            <View style={styles.actionNameRow}>
              <Text style={styles.actionName} numberOfLines={1}>{action.name}</Text>
              {reminderStatus === 'overdue' && (
                <View style={[styles.reminderBadge, styles.reminderBadgeOverdue]}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                </View>
              )}
              {reminderStatus === 'warning' && (
                <View style={[styles.reminderBadge, styles.reminderBadgeWarning]}>
                  <Ionicons name="alert-circle" size={16} color={colors.warning} />
                </View>
              )}
              {action.is_configurable === 1 && (
                <View style={styles.configurableBadge}>
                  <Ionicons name="options-outline" size={16} color={colors.textInverse} />
                </View>
              )}
            </View>
            <View style={styles.lastDateContainer}>
              <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.lastDate}>
                {formatRelativeDate(lastEntry?.created_at)}
              </Text>
            </View>
            {reminderLabel && (
              <View style={styles.reminderInfoRow}>
                <Ionicons
                  name={action.reminder_date ? 'calendar-outline' : 'repeat-outline'}
                  size={14}
                  color="rgba(255, 255, 255, 0.85)"
                />
                <Text
                  style={[
                    styles.reminderInfo,
                    reminderStatus === 'overdue' && styles.reminderInfoOverdue,
                    reminderStatus === 'warning' && styles.reminderInfoWarning,
                  ]}
                  numberOfLines={1}
                >
                  {reminderLabel}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.tapIndicator}>
            <Ionicons name="play" size={14} color={colors.textInverse} />
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
        <Ionicons name="stats-chart" size={24} color={colors.primary} />
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
  actionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  actionName: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  reminderBadge: {
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderBadgeWarning: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  reminderBadgeOverdue: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  configurableBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lastDate: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.sizes.sm,
  },
  reminderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  reminderInfo: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  reminderInfoWarning: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  reminderInfoOverdue: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
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
  historyButton: {
    backgroundColor: colors.surface,
    width: touchTargets.xlarge,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    ...shadows.md,
  },
  historyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
