import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { entryService } from '../services/entryService';
import { actionService } from '../services/actionService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SwipeableRow from '../components/SwipeableRow';
import {
  formatElapsedBetween,
  formatDayCount,
  toISODate,
  computeDueDate,
  MS_PER_DAY,
} from '../utils/dateUtils';
import Header from '../components/Header';
import { colors, statusColors, spacing, typography, borderRadius, shadows } from '../constants/theme';

// Échéance du prochain rappel, qu'il soit périodique (court depuis la dernière
// entrée) ou à date fixe. Retourne null quand aucun rappel n'est configuré.
// Le calcul lui-même vit dans `dateUtils.computeDueDate`, partagé avec les cartes
// (`ActionButton`) et la planification des notifications : cet écran ne fait plus
// que mettre en forme, pour que les trois ne puissent pas diverger.
function computeDueDateInfo(action, lastEntry) {
  if (!action) return null;

  const due = computeDueDate(action, lastEntry?.created_at);
  if (!due) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round((due.dueDate - today) / MS_PER_DAY);
  const status = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= due.warnDays ? 'warning' : 'ok';

  return { dueDate: due.dueDate, daysUntilDue, status };
}

export default function ActionHistoryScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [entries, setEntries] = useState([]);
  const [actionData, setActionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [data, action] = await Promise.all([
        entryService.getByAction(actionId),
        actionService.getById(actionId),
      ]);
      setEntries(data);
      setActionData(action);
      return { entries: data, action };
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEditDate = (entry) => {
    setSelectedEntry(entry);
    setTempDate(new Date(entry.created_at));
    setShowDatePicker(true);
  };

  const handleEditFields = (entry) => {
    navigation.navigate('EditEntry', {
      entry,
      actionId,
      actionName
    });
  };

  const handleDateValueChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      confirmDateChange(currentDate);
    } else {
      setTempDate(currentDate);
    }
  };

  const handleDatePickerDismiss = () => {
    setShowDatePicker(false);
    setSelectedEntry(null);
  };

  const confirmDateChange = async (date) => {
    if (!selectedEntry) {
      Alert.alert('Erreur', 'Aucune entrée sélectionnée');
      return;
    }

    try {
      const dateOnly = toISODate(date);
      await entryService.update(selectedEntry.id, dateOnly);
      setShowDatePicker(false);
      setSelectedEntry(null);

      // La date modifiée peut faire entrer l'entrée dans la fenêtre d'alerte :
      // on rejoue la consommation du rappel, sur la dernière entrée rechargée
      // (éditer une entrée ancienne ne doit pas consommer à la place de la plus récente).
      const reloaded = await loadData();
      const lastEntry = reloaded?.entries?.[0];
      if (reloaded?.action?.reminder_date && lastEntry?.created_at) {
        const consumed = await actionService.consumeReminderDate(
          reloaded.action,
          lastEntry.created_at
        );
        if (consumed) await loadData();
      }

      showToast('Date modifiée');
    } catch (error) {
      console.error('Erreur modification date:', error);
      Alert.alert('Erreur', 'Impossible de modifier la date');
    }
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Confirmer la suppression',
      'Supprimer cette entrée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await entryService.delete(entry.id);
              loadData();
              showToast('Entrée supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'entrée');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const dueDateInfo = computeDueDateInfo(actionData, entries[0]);

  const BANNER_ICONS = {
    overdue: 'alert-circle',
    warning: 'time',
    ok: 'checkmark-circle',
  };

  const renderDueDateBanner = () => {
    if (!dueDateInfo) return null;

    const { dueDate, daysUntilDue, status } = dueDateInfo;
    const palette = statusColors[status];
    const dueDateStr = dueDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const titleText = daysUntilDue < 0
      ? `En retard de ${formatDayCount(-daysUntilDue)}`
      : daysUntilDue === 0
        ? "À faire aujourd'hui"
        : `Dans ${formatDayCount(daysUntilDue)}`;

    return (
      <View style={[styles.banner, { backgroundColor: palette.tint }]}>
        <View style={[styles.bannerAccent, { backgroundColor: palette.main }]} />
        <Ionicons name={BANNER_ICONS[status]} size={20} color={palette.main} />
        <View style={styles.bannerTextContainer}>
          <Text style={[styles.bannerTitle, { color: palette.text }]}>{titleText}</Text>
          <Text style={styles.bannerSubtitle}>Prochain rappel le {dueDateStr}</Text>
        </View>
      </View>
    );
  };

  const renderEntry = ({ item, index }) => {
    let fieldValues = null;
    if (item.field_values) {
      try {
        fieldValues = JSON.parse(item.field_values);
      } catch (error) {
        console.error('Erreur parsing field_values:', error);
      }
    }

    const isConfigurable = item.is_configurable === 1;
    const nextEntry = index < entries.length - 1 ? entries[index + 1] : null;
    const isLatest = index === 0;

    return (
      <View style={styles.timelineRow}>
        {/* Rail : pastille alignée sur la date, trait qui descend vers l'entrée suivante */}
        <View style={styles.rail}>
          <View style={[styles.railDot, isLatest && styles.railDotLatest]} />
          {nextEntry && <View style={styles.railLine} />}
        </View>

        <View style={styles.timelineContent}>
          <SwipeableRow
            onDelete={() => handleDelete(item)}
            onEdit={isConfigurable ? () => handleEditFields(item) : undefined}
          >
            <TouchableOpacity
              style={styles.entryCard}
              onPress={() => handleEditDate(item)}
              activeOpacity={0.7}
              accessibilityLabel={`Entrée du ${formatDisplayDate(item.created_at)}`}
              accessibilityHint="Modifier la date"
            >
              <Text style={styles.date}>{formatDisplayDate(item.created_at)}</Text>

              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

              {fieldValues && Object.keys(fieldValues).length > 0 && (
                <View style={styles.fieldsContainer}>
                  {Object.entries(fieldValues).map(([key, value]) => (
                    <View key={key} style={styles.fieldRow}>
                      <Text style={styles.fieldLabel} numberOfLines={1}>{key}</Text>
                      <Text style={styles.fieldValue} numberOfLines={1}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </SwipeableRow>

          {nextEntry && (
            <Text style={styles.elapsedText}>
              {formatElapsedBetween(item.created_at, nextEntry.created_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <Loading message="Chargement de l'historique..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title={actionName}
        subtitle="Historique"
        count={entries.length}
        onBack={() => navigation.goBack()}
      />

      {renderDueDateBanner()}

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucune entrée</Text>
            <Text style={styles.emptySubtext}>
              L'historique apparaîtra ici
            </Text>
          </View>
        }
      />

      {showDatePicker && Platform.OS === 'ios' && (
        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Modifier la date</Text>
              <TouchableOpacity onPress={() => confirmDateChange(tempDate)}>
                <Text style={styles.datePickerConfirm}>Confirmer</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onValueChange={handleDateValueChange}
              onDismiss={handleDatePickerDismiss}
            />
          </View>
        </Pressable>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onValueChange={handleDateValueChange}
          onDismiss={handleDatePickerDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  bannerAccent: {
    width: 5,
    alignSelf: 'stretch',
    marginVertical: -spacing.md,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  bannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  rail: {
    width: 20,
    alignItems: 'center',
  },
  railDot: {
    width: 9,
    height: 9,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warmGray300,
    marginTop: spacing.lg + 2,
  },
  // L'entrée la plus récente porte la couleur primaire pour ancrer le regard en haut
  railDotLatest: {
    width: 13,
    height: 13,
    backgroundColor: colors.primary,
    marginTop: spacing.lg,
  },
  railLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.warmGray200,
    marginTop: spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  entryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  date: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  notes: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray600,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  fieldsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  elapsedText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    ...shadows.lg,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  datePickerCancel: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  datePickerConfirm: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
