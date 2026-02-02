import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable
} from 'react-native';
import { categoryService } from '../services/categoryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import SwipeableRow from '../components/SwipeableRow';
import { InlineHint } from '../components/GestureHint';
import { colors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestureHint, setShowGestureHint] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de categorie');
      return;
    }

    try {
      await categoryService.create(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddForm(false);
      loadCategories();
      showToast('Categorie creee');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer la categorie');
    }
  };

  const handleRenameCategory = (category) => {
    Alert.prompt(
      'Renommer la categorie',
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
              await categoryService.update(category.id, newName.trim());
              loadCategories();
              showToast('Categorie renommee');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de renommer la categorie');
            }
          }
        }
      ],
      'plain-text',
      category.name
    );
  };

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer "${category.name}" et toutes ses actions ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await categoryService.delete(category.id);
              loadCategories();
              showToast('Categorie supprimee');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la categorie');
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

  const renderCategory = ({ item }) => (
    <SwipeableRow
      onDelete={() => handleDeleteCategory(item)}
      onEdit={() => handleRenameCategory(item)}
    >
      <TouchableOpacity
        style={[styles.categoryCard, { borderLeftColor: item.color || colors.primary }]}
        onPress={() => navigation.navigate('Category', {
          categoryId: item.id,
          categoryName: item.name
        })}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    </SwipeableRow>
  );

  if (loading) {
    return <Loading message="Chargement des categories..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Trackers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
          accessibilityLabel="Ajouter une categorie"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher une categorie..."
      />

      {showAddForm && (
        <View style={styles.addForm} onStartShouldSetResponder={() => true}>
          <TextInput
            style={styles.input}
            placeholder="Nom de la categorie (ex: Voiture)"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoFocus
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddCategory}>
            <Text style={styles.submitButtonText}>Creer</Text>
          </TouchableOpacity>
        </View>
      )}

      <InlineHint
        visible={showGestureHint && categories.length > 0}
        message="Glissez vers la gauche pour modifier ou supprimer"
      />

      <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucune categorie trouvee'
                : 'Aucune categorie. Creez-en une pour commencer !'}
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
    fontSize: typography.sizes.xxxl,
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
  categoryCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...shadows.md,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: spacing.lg,
  },
  categoryName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: 40,
  },
});
