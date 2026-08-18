import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatRelativeDate,
  formatDayCount,
  formatShortDate,
  parseISODate,
  entrySatisfiesReminderDate,
  DEFAULT_WARN_DAYS,
} from '../utils/dateUtils';
import { colors, statusColors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function statusFromDaysUntilDue(daysUntilDue, warnDays) {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warnDays) return 'warning';
  return 'ok';
}

function formatDueLabel(daysUntilDue) {
  if (daysUntilDue < 0) return `En retard de ${formatDayCount(-daysUntilDue)}`;
  if (daysUntilDue === 0) return "À faire aujourd'hui";
  return `Dans ${formatDayCount(daysUntilDue)}`;
}

// Retourne { status, dueLabel, everyLabel } :
//   status    – 'overdue' | 'warning' | 'ok' | null (null = aucun rappel configuré)
//   dueLabel  – l'échéance ("Dans 3 semaines"), null si non calculable
//   everyLabel– la périodicité ("Tous les 3 mois") ou la date fixe, null si aucun rappel
export function computeReminder(action, lastEntry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warnDays = action.reminder_warn_days ? Number(action.reminder_warn_days) : DEFAULT_WARN_DAYS;

  // Rappel à date fixe : one-shot, consommé par une entrée tombant dans la fenêtre d'alerte
  if (action.reminder_date) {
    const dueDate = parseISODate(action.reminder_date);
    if (entrySatisfiesReminderDate(action.reminder_date, lastEntry?.created_at, action.reminder_warn_days)) {
      return { status: null, dueLabel: null, everyLabel: null };
    }
    const daysUntilDue = Math.round((dueDate - today) / MS_PER_DAY);
    return {
      status: statusFromDaysUntilDue(daysUntilDue, warnDays),
      dueLabel: formatDueLabel(daysUntilDue),
      everyLabel: formatShortDate(dueDate),
    };
  }

  if (!action.reminder_interval_days) {
    return { status: null, dueLabel: null, everyLabel: null };
  }

  // Rappel périodique : l'échéance court depuis la dernière entrée
  const intervalDays = Number(action.reminder_interval_days);
  const everyLabel = `Tous les ${formatDayCount(intervalDays)}`;

  // Sans entrée, la périodicité est connue mais l'échéance ne l'est pas
  if (!lastEntry?.created_at) {
    return { status: 'ok', dueLabel: null, everyLabel };
  }

  const daysSince = Math.floor((today - parseISODate(lastEntry.created_at)) / MS_PER_DAY);
  const daysUntilDue = intervalDays - daysSince;
  return {
    status: statusFromDaysUntilDue(daysUntilDue, warnDays),
    dueLabel: formatDueLabel(daysUntilDue),
    everyLabel,
  };
}

const STATUS_ICONS = {
  overdue: 'alert-circle',
  warning: 'time',
  ok: 'checkmark-circle',
};

export default function ActionButton({ action, onPress, onHistoryPress, onLongPress, lastEntry }) {
  const { status, dueLabel, everyLabel } = computeReminder(action, lastEntry);
  const palette = statusColors[status] || statusColors.neutral;
  const isConfigurable = action.is_configurable === 1;

  return (
    <View style={styles.card}>
      {/* Barre d'accent : la couleur seule porte l'urgence */}
      <View style={[styles.accentBar, { backgroundColor: palette.main }]} />

      {/* Zone principale : ouvre l'historique */}
      <TouchableOpacity
        style={styles.body}
        onPress={onHistoryPress}
        onLongPress={onLongPress}
        activeOpacity={0.6}
        accessibilityLabel={`${action.name}, ${formatRelativeDate(lastEntry?.created_at)}${dueLabel ? `, ${dueLabel}` : ''}`}
        accessibilityRole="button"
        accessibilityHint="Ouvre l'historique. Appui long pour plus d'options"
      >
        <View style={styles.titleRow}>
          <Text style={styles.actionName} numberOfLines={1}>{action.name}</Text>
          {isConfigurable && (
            <Ionicons name="options-outline" size={16} color={colors.textMuted} />
          )}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatRelativeDate(lastEntry?.created_at)}
          </Text>
        </View>

        {(dueLabel || everyLabel) && (
          <View style={styles.reminderRow}>
            {dueLabel && (
              <View style={[styles.duePill, { backgroundColor: palette.tint }]}>
                <Ionicons name={STATUS_ICONS[status]} size={12} color={palette.text} />
                <Text style={[styles.dueText, { color: palette.text }]} numberOfLines={1}>
                  {dueLabel}
                </Text>
              </View>
            )}
            {everyLabel && (
              <Text style={styles.everyText} numberOfLines={1}>{everyLabel}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Action principale : enregistrer une entrée */}
      <TouchableOpacity
        style={[styles.recordButton, { backgroundColor: palette.main }]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`Enregistrer ${action.name}`}
        accessibilityRole="button"
      >
        <Ionicons
          name={isConfigurable ? 'add' : 'checkmark'}
          size={30}
          color={colors.textInverse}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs + 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  accentBar: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    justifyContent: 'center',
    minHeight: touchTargets.xlarge,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  dueText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  everyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    flexShrink: 1,
  },
  recordButton: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
