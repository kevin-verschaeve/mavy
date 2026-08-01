import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { actionFieldService } from '../services/actionFieldService';
import { actionService } from '../services/actionService';
import { useToast } from '../components/Toast';
import SwipeableRow from '../components/SwipeableRow';
import Header from '../components/Header';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function ConfigureActionScreen({ route, navigation }) {
  const { actionId, actionName } = route.params;
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [initialFieldCount, setInitialFieldCount] = useState(null);

  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Si des champs ont été ajoutés, laisser partir normalement
      if (fields.length > 0) {
        return;
      }

      // Si on est en mode édition (des champs existaient au départ), laisser partir
      if (initialFieldCount !== null && initialFieldCount > 0) {
        return;
      }

      // Empêcher la navigation par défaut
      e.preventDefault();

      // Afficher une confirmation
      Alert.alert(
        'Action sans champs',
        'Cette action n\'a aucun champ configuré. Voulez-vous la supprimer ?',
        [
          {
            text: 'Continuer à configurer',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Supprimer l\'action',
            style: 'destructive',
            onPress: async () => {
              try {
                await actionService.delete(actionId);
                showToast('Action supprimée');
                navigation.dispatch(e.data.action);
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer l\'action');
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, fields, actionId, initialFieldCount]);

  const loadFields = async () => {
    try {
      const data = await actionFieldService.getByAction(actionId);
      setFields(data);
      // Sauvegarder le nombre initial de champs pour différencier création/édition
      if (initialFieldCount === null) {
        setInitialFieldCount(data.length);
      }
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
      if (editingField) {
        await actionFieldService.update(editingField.id, newFieldName.trim(), newFieldType);
        showToast('Champ modifié');
      } else {
        await actionFieldService.create(actionId, newFieldName.trim(), newFieldType, fields.length);
        showToast('Champ ajouté');
      }
      setNewFieldName('');
      setNewFieldType('text');
      setShowAddForm(false);
      setEditingField(null);
      loadFields();
    } catch (error) {
      Alert.alert('Erreur', editingField ? 'Impossible de modifier le champ' : 'Impossible de créer le champ');
    }
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setNewFieldName(field.field_name);
    setNewFieldType(field.field_type);
    setShowAddForm(true);
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
              showToast('Champ supprimé');
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
      setEditingField(null);
      setNewFieldName('');
      setNewFieldType('text');
    }
  };

  const renderField = ({ item, index }) => {
    const isNumber = item.field_type === 'number';
    const typeColor = isNumber ? colors.accent : colors.primary;

    return (
      <SwipeableRow
        onDelete={() => handleDeleteField(item)}
        onEdit={() => handleEditField(item)}
      >
        <TouchableOpacity
          style={styles.fieldCard}
          onPress={() => handleEditField(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Champ ${item.field_name}, type ${isNumber ? 'nombre' : 'texte'}`}
          accessibilityHint="Modifier ce champ. Balayer vers la gauche pour supprimer"
        >
          <View style={styles.fieldOrder}>
            <Text style={styles.fieldOrderText}>{index + 1}</Text>
          </View>

          <View style={[styles.fieldTypeIcon, { backgroundColor: typeColor + '18' }]}>
            <Ionicons
              name={isNumber ? 'calculator-outline' : 'text-outline'}
              size={18}
              color={typeColor}
            />
          </View>

          <View style={styles.fieldInfo}>
            <Text style={styles.fieldName} numberOfLines={1}>{item.field_name}</Text>
            <Text style={styles.fieldType}>{isNumber ? 'Nombre' : 'Texte'}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={actionName}
        subtitle="Configuration"
        count={fields.length}
        onBack={() => navigation.goBack()}
        onAdd={() => setShowAddForm(!showAddForm)}
        addOpen={showAddForm}
      />

      {showAddForm && (
        <Pressable style={styles.overlay} onPress={handleOutsidePress}>
          <View style={styles.addForm} onStartShouldSetResponder={() => true}>
            <Text style={styles.formTitle}>{editingField ? 'Modifier le champ' : 'Nouveau champ'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du champ (ex: Prix, Kilomètres)"
              placeholderTextColor={colors.textMuted}
              value={newFieldName}
              onChangeText={setNewFieldName}
              autoFocus
            />

            <Text style={styles.typeLabel}>Type de champ</Text>
            <View style={styles.typeSelector}>
              {[
                { key: 'text', label: 'Texte', icon: 'text-outline' },
                { key: 'number', label: 'Nombre', icon: 'calculator-outline' },
              ].map((type) => {
                const selected = newFieldType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeButton, selected && styles.typeButtonSelected]}
                    onPress={() => setNewFieldType(type.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={type.icon}
                      size={20}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.typeButtonText, selected && styles.typeButtonTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddField}>
              <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
                <Text style={styles.submitButtonText}>{editingField ? 'Modifier' : 'Ajouter'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
        <FlatList
          data={fields}
          renderItem={renderField}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="settings-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucun champ configuré</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des champs pour personnaliser cette action
              </Text>
            </View>
          }
        />
      </Pressable>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.doneButton,
            fields.length === 0 && initialFieldCount === 0 && styles.doneButtonDisabled
          ]}
          onPress={() => {
            // En mode création (pas de champs initiaux), exiger au moins 1 champ
            if (fields.length === 0 && initialFieldCount === 0) {
              Alert.alert(
                'Aucun champ',
                'Vous devez ajouter au moins un champ avant de terminer la configuration.'
              );
              return;
            }
            navigation.goBack();
          }}
          disabled={fields.length === 0 && initialFieldCount === 0}
        >
          <LinearGradient
            colors={
              fields.length === 0 && initialFieldCount === 0
                ? [colors.warmGray300, colors.warmGray400]
                : gradients.forest
            }
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>
              {fields.length === 0 && initialFieldCount === 0 ? 'Ajoutez au moins 1 champ' : 'Terminé'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: spacing.huge + spacing.xxl,
    zIndex: 1000,
  },
  addForm: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  formTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.warmGray50,
    color: colors.textPrimary,
  },
  typeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.warmGray50,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '40',
  },
  typeButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.primary,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.primary,
  },
  submitButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  fieldCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTargets.large,
    ...shadows.sm,
  },
  // Numéro d'ordre : les champs apparaissent dans cet ordre à la saisie
  fieldOrder: {
    width: 20,
  },
  fieldOrderText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  fieldTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  fieldType: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
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
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + spacing.lg : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.primary,
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});
