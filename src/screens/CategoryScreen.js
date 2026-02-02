import React, { useState, useEffect, useMemo } from 'react';
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
import { actionService } from '../services/actionService';
import { entryService } from '../services/entryService';
import ActionButton from '../components/ActionButton';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import { InlineHint } from '../components/GestureHint';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows, categoryColors } from '../constants/theme';

export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryName, colorIndex = 0 } = route.params;
  const [actions, setActions] = useState([]);
  const [lastEntries, setLastEntries] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [isConfigurable, setIsConfigurable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestureHint, setShowGestureHint] = useState(true);

  const { showToast } = useToast();
  const categoryColor = categoryColors[colorIndex % categoryColors.length];

  useEffect(() => {
    loadActions();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadActions();
    });
    return unsubscribe;
  }, [navigation]);

  const loadActions = async () => {
    try {
      const data = await actionService.getByCategory(categoryId);
      setActions(data);

      const entries = {};
      for (const action of data) {
        const lastEntry = await entryService.getLastEntry(action.id);
        entries[action.id] = lastEntry;
      }
      setLastEntries(entries);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les actions');
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return actions;
    const query = searchQuery.toLowerCase();
    return actions.filter(action =>
      action.name.toLowerCase().includes(query)
    );
  }, [actions, searchQuery]);

  const handleAddAction = async () => {
    if (!newActionName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'action');
      return;
    }

    try {
      const actionId = await actionService.create(categoryId, newActionName.trim(), isConfigurable);
      const actionName = newActionName.trim();
      setNewActionName('');
      setIsConfigurable(false);
      setShowAddForm(false);

      if (isConfigurable) {
        navigation.navigate('ConfigureAction', { actionId, actionName });
      }

      loadActions();
      showToast('Action créée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'action');
    }
  };

  const handleActionPress = async (action) => {
    if (action.is_configurable === 1) {
      navigation.navigate('AddEntry', { action });
      return;
    }

    try {
      await entryService.create(action.id);
      showToast(`"${action.name}" enregistre`);
      loadActions();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'entrée');
    }
  };

  const handleHistoryPress = (action) => {
    navigation.navigate('ActionHistory', {
      actionId: action.id,
      actionName: action.name
    });
  };

  const handleActionLongPress = (action) => {
    Alert.alert(
      'Options',
      `Que voulez-vous faire avec "${action.name}" ?`,
      [
        { text: 'Renommer', onPress: () => handleRenameAction(action) },
        { text: 'Supprimer', onPress: () => handleDeleteAction(action), style: 'destructive' },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const handleRenameAction = (action) => {
    Alert.prompt(
      'Renommer l\'action',
      'Entrez le nouveau nom :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Renommer',
          onPress: async (newName) => {
            if (!newName || !newName.trim()) {
              Alert.alert('Erreur', 'Le nom ne peut pas être vide');
              return;
            }
            try {
              await actionService.update(action.id, newName.trim());
              loadActions();
              showToast('Action renommée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de renommer l\'action');
            }
          }
        }
      ],
      'plain-text',
      action.name
    );
  };

  const handleDeleteAction = (action) => {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer "${action.name}" et toutes ses entrées ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await actionService.delete(action.id);
              loadActions();
              showToast('Action supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'action');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleOutsidePress = () => {
    if (showAddForm) {
      setShowAddForm(false);
    }
    if (showGestureHint) {
      setShowGestureHint(false);
    }
  };

  const renderAction = ({ item }) => (
    <ActionButton
      action={item}
      lastEntry={lastEntries[item.id]}
      onPress={() => handleActionPress(item)}
      onHistoryPress={() => handleHistoryPress(item)}
      onLongPress={() => handleActionLongPress(item)}
    />
  );

  if (loading) {
    return <Loading message="Chargement des actions..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header avec dégradé */}
      <LinearGradient
        colors={gradients.night}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>{categoryName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{actions.length}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
            accessibilityLabel="Ajouter une action"
            accessibilityRole="button"
          >
            <LinearGradient colors={gradients.primary} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>{showAddForm ? '×' : '+'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher une action..."
      />

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={() => true}>
          <Text style={styles.formTitle}>Nouvelle action</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'action (ex: Révision voiture)"
            placeholderTextColor={colors.textMuted}
            value={newActionName}
            onChangeText={setNewActionName}
            autoFocus
          />
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsConfigurable(!isConfigurable)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isConfigurable }}
          >
            <View style={[styles.checkbox, isConfigurable && styles.checkboxChecked]}>
              {isConfigurable && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Configurable (avec champs personnalisés)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddAction}>
            <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
              <Text style={styles.submitButtonText}>Créer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <InlineHint
        visible={showGestureHint && actions.length > 0}
        message="Appui long sur une action pour plus d'options"
      />

      <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
        <FlatList
          data={filteredActions}
          renderItem={renderAction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.emptyIconText, { color: categoryColor }]}>📋</Text>
              </View>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Aucune action trouvée'
                  : 'Aucune action dans cette catégorie'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Essayez avec d\'autres termes'
                  : 'Appuyez sur + pour en créer une'}
              </Text>
            </View>
          }
        />
      </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 3,
    height: 30,
    borderRadius: 2,
    marginHorizontal: spacing.lg,
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
    marginBottom: spacing.md,
    backgroundColor: colors.warmGray50,
    color: colors.textPrimary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: touchTargets.minimum,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.warmGray300,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  checkboxLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    flex: 1,
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
    paddingVertical: spacing.lg,
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
});
