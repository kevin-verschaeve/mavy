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
import DateTimePicker from '@react-native-community/datetimepicker';
import { entryService } from '../services/entryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SwipeableRow from '../components/SwipeableRow';
import { InlineHint } from '../components/GestureHint';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

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

  const renderEntry = ({ item }) => {
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
          <Text style={styles.date}>{formatDisplayDate(item.created_at)}</Text>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

          {fieldValues && (
            <View style={styles.fieldsContainer}>
              {Object.entries(fieldValues).map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{key}:</Text>
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
          <Text style={styles.emptyText}>
            Aucune entree pour cette action.
          </Text>
        }
        onScrollBeginDrag={() => setShowGestureHint(false)}
      />

      {showDatePicker && Platform.OS === 'ios' && (
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerButton}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDateChange(tempDate)}>
              <Text style={[styles.datePickerButton, styles.confirmButton]}>
                Confirmer
              </Text>
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
  list: {
    padding: spacing.lg,
  },
  entryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  date: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  notes: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
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
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray700,
    marginRight: spacing.sm,
  },
  fieldValue: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: 40,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  datePickerButton: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
  },
  confirmButton: {
    fontWeight: typography.weights.semibold,
  },
});
