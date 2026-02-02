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
import { useToast } from '../components/Toast';
import SwipeableRow from '../components/SwipeableRow';
import { colors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function ConfigureActionScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [showAddForm, setShowAddForm] = useState(false);

  const { showToast } = useToast();

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
      showToast('Champ ajoute');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer le champ');
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
              showToast('Champ supprime');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le champ');
            }
          }
        }
      ]
    );
  };

  const handleOutsidePress = () => {
    if (showAddForm) {
      setShowAddForm(false);
    }
  };

  const renderField = ({ item }) => (
    <SwipeableRow onDelete={() => handleDeleteField(item)}>
      <View style={styles.fieldCard}>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldName}>{item.field_name}</Text>
          <Text style={styles.fieldTypeText}>
            {item.field_type === 'number' ? 'Nombre' : 'Texte'}
          </Text>
        </View>
      </View>
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>Configuration : {actionName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
          accessibilityLabel="Ajouter un champ"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={() => true}>
          <TextInput
            style={styles.input}
            placeholder="Nom du champ (ex: Prix, Kilometres)"
            value={newFieldName}
            onChangeText={setNewFieldName}
            autoFocus
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
              Aucun champ configure. Ajoutez-en pour personnaliser cette action !
            </Text>
          }
        />
      </Pressable>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Termine</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  addButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: touchTargets.minimum / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.regular,
  },
  addForm: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
  },
  typeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  list: {
    padding: spacing.lg,
  },
  fieldCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  fieldTypeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: 40,
    paddingHorizontal: spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.success,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});
