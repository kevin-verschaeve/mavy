import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatRelativeDate,
  formatDayCount,
  formatShortDate,
  computeDueDate,
  MS_PER_DAY,
} from '../utils/dateUtils';
import { colors, statusColors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

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

  // `computeDueDate` porte le calcul d'échéance, partagé avec la planification
  // des notifications : les cartes et les rappels doivent dire la même chose.
  const due = computeDueDate(action, lastEntry?.created_at);

  if (action.reminder_date) {
    // Rappel à date fixe consommé : plus rien à afficher
    if (!due) return { status: null, dueLabel: null, everyLabel: null };

    const daysUntilDue = Math.round((due.dueDate - today) / MS_PER_DAY);
    return {
      status: statusFromDaysUntilDue(daysUntilDue, due.warnDays),
      dueLabel: formatDueLabel(daysUntilDue),
      everyLabel: formatShortDate(due.dueDate),
    };
  }

  if (!action.reminder_interval_days) {
    return { status: null, dueLabel: null, everyLabel: null };
  }

  const everyLabel = `Tous les ${formatDayCount(Number(action.reminder_interval_days))}`;

  // Sans entrée, la périodicité est connue mais l'échéance ne l'est pas
  if (!due) {
    return { status: 'ok', dueLabel: null, everyLabel };
  }

  const daysUntilDue = Math.round((due.dueDate - today) / MS_PER_DAY);
  return {
    status: statusFromDaysUntilDue(daysUntilDue, due.warnDays),
    dueLabel: formatDueLabel(daysUntilDue),
    everyLabel,
  };
}

const STATUS_ICONS = {
  overdue: 'alert-circle',
  warning: 'time',
  ok: 'checkmark-circle',
};

export default function ActionButton({ action, onPress, onRecordLongPress, onHistoryPress, onLongPress, lastEntry }) {
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

      {/* Action principale : enregistrer une entrée.
          Appui long : choisir la date, pour une action faite hier. */}
      <TouchableOpacity
        style={[styles.recordButton, { backgroundColor: palette.main }]}
        onPress={onPress}
        onLongPress={onRecordLongPress}
        activeOpacity={0.8}
        accessibilityLabel={`Enregistrer ${action.name}`}
        accessibilityRole="button"
        accessibilityHint="Appui long pour choisir la date"
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
