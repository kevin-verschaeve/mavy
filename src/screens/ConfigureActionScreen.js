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
import { LinearGradient } from 'expo-linear-gradient';
import { actionFieldService } from '../services/actionFieldService';
import { useToast } from '../components/Toast';
import SwipeableRow from '../components/SwipeableRow';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Configuration</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{actionName}</Text>
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

        {/* Compteur de champs */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fields.length}</Text>
            <Text style={styles.statLabel}>champs configures</Text>
          </View>
        </View>
      </LinearGradient>

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={() => true}>
          <Text style={styles.formTitle}>Nouveau champ</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du champ (ex: Prix, Kilometres)"
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
              <Text style={styles.submitButtonText}>Ajouter</Text>
            </LinearGradient>
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
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⚙️</Text>
              </View>
              <Text style={styles.emptyText}>Aucun champ configure</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des champs pour personnaliser cette action
              </Text>
            </View>
          }
        />
      </Pressable>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
          <LinearGradient colors={gradients.forest} style={styles.doneButtonGradient}>
            <Text style={styles.doneButtonText}>Termine</Text>
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
  addForm: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
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
  fieldTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  fieldTypeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
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
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.primary,
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
