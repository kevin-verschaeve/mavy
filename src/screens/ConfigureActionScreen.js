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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { actionFieldService } from '../services/actionFieldService';
import { actionService } from '../services/actionService';
import { useToast } from '../components/Toast';
import SwipeableRow from '../components/SwipeableRow';
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

  const renderField = ({ item }) => (
    <SwipeableRow
      onDelete={() => handleDeleteField(item)}
      onEdit={() => handleEditField(item)}
    >
      <View style={styles.fieldCard}>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldName}>{item.field_name}</Text>
          <View style={[
            styles.fieldTypeBadge,
            { backgroundColor: item.field_type === 'number' ? colors.accent + '20' : colors.primary + '20' }
          ]}>
            <Text style={[
              styles.fieldTypeBadgeText,
              { color: item.field_type === 'number' ? colors.accent : colors.primary }
            ]}>
              {item.field_type === 'number' ? 'Nombre' : 'Texte'}
            </Text>
          </View>
        </View>
        <View style={styles.fieldActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditField(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.deleteIconButton]}
            onPress={() => handleDeleteField(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </SwipeableRow>
  );

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
            <Ionicons name="arrow-back" size={28} color={colors.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Configuration</Text>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>{actionName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{fields.length}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
            accessibilityLabel="Ajouter un champ"
            accessibilityRole="button"
          >
            <LinearGradient colors={gradients.primary} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>{showAddForm ? '×' : '+'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
              <TouchableOpacity
                style={[styles.typeButton, newFieldType === 'text' && styles.typeButtonSelected]}
                onPress={() => setNewFieldType('text')}
              >
                <Text style={[styles.typeButtonText, newFieldType === 'text' && styles.typeButtonTextSelected]}>
                  ABC Texte
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newFieldType === 'number' && styles.typeButtonSelected]}
                onPress={() => setNewFieldType('number')}
              >
                <Text style={[styles.typeButtonText, newFieldType === 'number' && styles.typeButtonTextSelected]}>
                  123 Nombre
                </Text>
              </TouchableOpacity>
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

      <View style={styles.footer}>
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
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray400,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  addButton: {
    borderRadius: touchTargets.minimum / 2,
    overflow: 'hidden',
    ...shadows.primary,
  },
  addButtonGradient: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.medium,
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
    backgroundColor: colors.primaryLight,
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
  fieldCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
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
  fieldTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  fieldTypeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.warmGray100,
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: {
    backgroundColor: colors.danger + '15',
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
