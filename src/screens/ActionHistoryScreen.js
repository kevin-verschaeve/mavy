import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { entryService } from '../services/entryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SwipeableRow from '../components/SwipeableRow';
import { InlineHint } from '../components/GestureHint';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, gradients, spacing, typography, borderRadius, shadows, touchTargets } from '../constants/theme';

export default function ActionHistoryScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showGestureHint, setShowGestureHint] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await entryService.getByAction(actionId);
      setEntries(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
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

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;

    if (Platform.OS === 'android') {
      setShowDatePicker(false);

      if (event?.type === 'set') {
        confirmDateChange(currentDate);
      } else {
        setSelectedEntry(null);
      }
    } else {
      setTempDate(currentDate);
    }
  };

  const confirmDateChange = async (date) => {
    if (!selectedEntry) {
      Alert.alert('Erreur', 'Aucune entree selectionnee');
      return;
    }

    try {
      const dateOnly = date.toISOString().split('T')[0];
      await entryService.update(selectedEntry.id, dateOnly);
      setShowDatePicker(false);
      setSelectedEntry(null);
      loadEntries();
      showToast('Date modifiee');
    } catch (error) {
      console.error('Erreur modification date:', error);
      Alert.alert('Erreur', 'Impossible de modifier la date');
    }
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Confirmer la suppression',
      'Supprimer cette entree ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await entryService.delete(entry.id);
              loadEntries();
              showToast('Entree supprimee');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'entree');
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

  const renderEntry = ({ item, index }) => {
    let fieldValues = null;
    if (item.field_values) {
      try {
        fieldValues = JSON.parse(item.field_values);
      } catch (error) {
        console.error('Erreur parsing field_values:', error);
      }
    }

    const hasFields = item.field_values;

    return (
      <SwipeableRow
        onDelete={() => handleDelete(item)}
        onEdit={hasFields ? () => handleEditFields(item) : undefined}
      >
        <TouchableOpacity
          style={styles.entryCard}
          onPress={() => handleEditDate(item)}
          activeOpacity={0.7}
        >
          <View style={styles.entryHeader}>
            <View style={styles.entryNumber}>
              <Text style={styles.entryNumberText}>#{entries.length - index}</Text>
            </View>
            <Text style={styles.date}>{formatDisplayDate(item.created_at)}</Text>
          </View>

          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

          {fieldValues && (
            <View style={styles.fieldsContainer}>
              {Object.entries(fieldValues).map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{key}</Text>
                  <Text style={styles.fieldValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (loading) {
    return <Loading message="Chargement de l'historique..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header avec dégradé */}
      <LinearGradient
        colors={gradients.night}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Historique</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{actionName}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>entrees</Text>
          </View>
        </View>
      </LinearGradient>

      <InlineHint
        visible={showGestureHint && entries.length > 0}
        message="Glissez vers la gauche pour supprimer, appuyez pour modifier la date"
      />

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
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📭</Text>
            </View>
            <Text style={styles.emptyText}>Aucune entree</Text>
            <Text style={styles.emptySubtext}>
              L'historique apparaitra ici
            </Text>
          </View>
        }
        onScrollBeginDrag={() => setShowGestureHint(false)}
      />

      {showDatePicker && Platform.OS === 'ios' && (
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
            onChange={handleDateChange}
          />
        </View>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
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
  header: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.medium,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray400,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  statsContainer: {
    marginTop: spacing.lg,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray400,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
  },
  entryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryNumber: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  entryNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warmGray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIconText: {
    fontSize: 36,
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
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
