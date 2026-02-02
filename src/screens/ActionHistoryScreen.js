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

export default function ActionHistoryScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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

  const handleLongPress = (entry) => {
    const options = [
      {
        text: 'Modifier la date',
        onPress: () => handleEditDate(entry)
      }
    ];

    // Ajouter l'option de modification des champs si l'entrée a des field_values
    if (entry.field_values) {
      options.push({
        text: 'Modifier les champs',
        onPress: () => handleEditFields(entry)
      });
    }

    options.push(
      {
        text: 'Supprimer',
        onPress: () => handleDelete(entry),
        style: 'destructive'
      },
      {
        text: 'Annuler',
        style: 'cancel'
      }
    );

    Alert.alert(
      'Options',
      `Que voulez-vous faire avec cette entrée ?`,
      options,
      { cancelable: true }
    );
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
        // L'utilisateur a confirmé la date
        confirmDateChange(currentDate);
      } else {
        // L'utilisateur a annulé
        setSelectedEntry(null);
      }
    } else {
      // Sur iOS, on met juste à jour la date temporaire
      setTempDate(currentDate);
    }
  };

  const confirmDateChange = async (date) => {
    if (!selectedEntry) {
      Alert.alert('Erreur', 'Aucune entrée sélectionnée');
      return;
    }

    try {
      // Convertir en format ISO puis extraire uniquement la date (YYYY-MM-DD)
      const dateOnly = date.toISOString().split('T')[0];
      await entryService.update(selectedEntry.id, dateOnly);
      setShowDatePicker(false);
      setSelectedEntry(null);
      loadEntries();
      Alert.alert('✅ Succès', 'La date a été modifiée');
    } catch (error) {
      console.error('Erreur modification date:', error);
      Alert.alert('Erreur', 'Impossible de modifier la date');
    }
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette entrée ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await entryService.delete(entry.id);
              loadEntries();
              Alert.alert('✅ Succès', 'Entrée supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'entrée');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier`;
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
    // Parser les field_values si présents
    let fieldValues = null;
    if (item.field_values) {
      try {
        fieldValues = JSON.parse(item.field_values);
      } catch (error) {
        console.error('Erreur parsing field_values:', error);
      }
    }

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
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
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucune entrée pour cette action.
          </Text>
        }
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6b7280',
  },
  list: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  notes: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
    fontStyle: 'italic',
  },
  fieldsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerButton: {
    fontSize: 17,
    color: '#3b82f6',
  },
  confirmButton: {
    fontWeight: '600',
  },
});
