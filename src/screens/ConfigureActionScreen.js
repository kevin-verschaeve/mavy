import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable
} from 'react-native';
import { actionFieldService } from '../services/actionFieldService';
import { useOutsideClick } from '../hooks/useOutsideClick';

export default function ConfigureActionScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [showAddForm, setShowAddForm] = useState(false);

  const { handleOutsidePress, handleInsidePress } = useOutsideClick(showAddForm, setShowAddForm);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const data = await actionFieldService.getByAction(actionId);
      setFields(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les champs');
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de champ');
      return;
    }

    try {
      await actionFieldService.create(actionId, newFieldName.trim(), newFieldType, fields.length);
      setNewFieldName('');
      setNewFieldType('text');
      setShowAddForm(false);
      loadFields();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le champ');
    }
  };

  const handleDeleteField = (field) => {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer le champ "${field.field_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await actionFieldService.delete(field.id);
              loadFields();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le champ');
            }
          }
        }
      ]
    );
  };

  const renderField = ({ item }) => (
    <View style={styles.fieldCard}>
      <View style={styles.fieldInfo}>
        <Text style={styles.fieldName}>{item.field_name}</Text>
        <Text style={styles.fieldTypeText}>
          {item.field_type === 'number' ? '123' : 'abc'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteField(item)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuration : {actionName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={handleInsidePress}>
          <TextInput
            style={styles.input}
            placeholder="Nom du champ (ex: Prix, Kilomètres)"
            value={newFieldName}
            onChangeText={setNewFieldName}
          />

          <Text style={styles.typeLabel}>Type de champ :</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, newFieldType === 'text' && styles.typeButtonSelected]}
              onPress={() => setNewFieldType('text')}
            >
              <Text style={[styles.typeButtonText, newFieldType === 'text' && styles.typeButtonTextSelected]}>
                Texte
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, newFieldType === 'number' && styles.typeButtonSelected]}
              onPress={() => setNewFieldType('number')}
            >
              <Text style={[styles.typeButtonText, newFieldType === 'number' && styles.typeButtonTextSelected]}>
                Nombre
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleAddField}>
            <Text style={styles.submitButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      )}

      <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
        <FlatList
          data={fields}
          renderItem={renderField}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aucun champ configuré. Ajoutez-en pour personnaliser cette action !
            </Text>
          }
        />
      </Pressable>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Terminé</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  addForm: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  typeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextSelected: {
    color: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  fieldCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  fieldTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  doneButton: {
    backgroundColor: '#10b981',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
