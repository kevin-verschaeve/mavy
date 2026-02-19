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
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { entryService } from '../services/entryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SwipeableRow from '../components/SwipeableRow';
import { formatRelativeDate } from '../utils/dateUtils';
import Header from '../components/Header';
import { colors, spacing, typography, borderRadius, shadows, touchTargets } from '../constants/theme';

export default function ActionHistoryScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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
      Alert.alert('Erreur', 'Aucune entrée sélectionnée');
      return;
    }

    try {
      const dateOnly = date.toISOString().split('T')[0];
      await entryService.update(selectedEntry.id, dateOnly);
      setShowDatePicker(false);
      setSelectedEntry(null);
      loadEntries();
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
              loadEntries();
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

    return (
      <SwipeableRow
        onDelete={() => handleDelete(item)}
        onEdit={isConfigurable ? () => handleEditFields(item) : undefined}
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
      <Header
        title={actionName}
        subtitle="Historique"
        count={entries.length}
        onBack={() => navigation.goBack()}
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
              onChange={handleDateChange}
            />
          </View>
        </Pressable>
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
