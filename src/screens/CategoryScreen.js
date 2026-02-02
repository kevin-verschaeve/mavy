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
import { actionService } from '../services/actionService';
import { entryService } from '../services/entryService';
import ActionButton from '../components/ActionButton';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import { InlineHint } from '../components/GestureHint';
import { colors, spacing, typography, borderRadius, touchTargets } from '../constants/theme';

export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [actions, setActions] = useState([]);
  const [lastEntries, setLastEntries] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [isConfigurable, setIsConfigurable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestureHint, setShowGestureHint] = useState(true);

  const { showToast } = useToast();

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
      showToast('Action creee');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer l\'action');
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
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'entree');
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
              Alert.alert('Erreur', 'Le nom ne peut pas etre vide');
              return;
            }
            try {
              await actionService.update(action.id, newName.trim());
              loadActions();
              showToast('Action renommee');
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
      `Supprimer "${action.name}" et toutes ses entrees ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await actionService.delete(action.id);
              loadActions();
              showToast('Action supprimee');
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
      <View style={styles.header}>
        <Text style={styles.title}>{categoryName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
          accessibilityLabel="Ajouter une action"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher une action..."
      />

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={() => true}>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'action (ex: Revision voiture)"
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
            <Text style={styles.checkboxLabel}>Configurable (avec champs personnalises)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddAction}>
            <Text style={styles.submitButtonText}>Creer</Text>
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
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucune action trouvee'
                : 'Aucune action. Creez-en une pour commencer a tracker !'}
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: touchTargets.minimum,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray300,
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
    color: colors.textPrimary,
    flex: 1,
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
    paddingVertical: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: 40,
    paddingHorizontal: spacing.xl,
  },
});
