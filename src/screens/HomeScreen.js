import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Pressable,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoryService } from '../services/categoryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import SwipeableRow from '../components/SwipeableRow';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import { InlineHint } from '../components/GestureHint';
import PromptDialog from '../components/PromptDialog';
import {
  colors,
  gradients,
  categoryColors,
  spacing,
  typography,
  borderRadius,
  touchTargets,
  shadows
} from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestureHint, setShowGestureHint] = useState(true);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState(null);

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
      Alert.alert('Erreur', 'Impossible de charger les catégories');
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
      Alert.alert('Erreur', 'Veuillez entrer un nom de catégorie');
      return;
    }

    try {
      await categoryService.create(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddForm(false);
      loadCategories();
      showToast('Catégorie créée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la catégorie');
    }
  };

  const handleRenameCategory = (category) => {
    setCategoryToRename(category);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async (newName) => {
    setShowRenameDialog(false);

    if (!newName || !newName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }

    try {
      await categoryService.update(categoryToRename.id, newName.trim());
      loadCategories();
      showToast('Catégorie renommée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de renommer la catégorie');
    }

    setCategoryToRename(null);
  };

  const handleRenameCancel = () => {
    setShowRenameDialog(false);
    setCategoryToRename(null);
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
              showToast('Catégorie supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
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

  const getCategoryColor = (index) => {
    return categoryColors[index % categoryColors.length];
  };

  const renderCategory = ({ item, index }) => {
    const accentColor = item.color || getCategoryColor(index);

    return (
      <SwipeableRow
        onDelete={() => handleDeleteCategory(item)}
        onEdit={() => handleRenameCategory(item)}
      >
        <TouchableOpacity
          style={[styles.categoryCard, { borderColor: accentColor }]}
          onPress={() => navigation.navigate('Category', {
            categoryId: item.id,
            categoryName: item.name,
            colorIndex: index
          })}
          activeOpacity={0.7}
        >
          {item.icon && (
            <View style={[styles.categoryIconContainer, { backgroundColor: accentColor + '20' }]}>
              <Text style={styles.categoryIcon}>{item.icon}</Text>
            </View>
          )}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
          </View>
          <Text style={styles.categoryArrow}>→</Text>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (loading) {
    return <Loading message="Chargement des catégories..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={gradients.night}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mes Trackers</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{categories.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
            accessibilityLabel="Ajouter une catégorie"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher une catégorie..."
        />

        {showAddForm && (
          <View style={styles.addForm} onStartShouldSetResponder={() => true}>
            <Text style={styles.addFormTitle}>Nouvelle catégorie</Text>
            <Input
              placeholder="Nom de la catégorie (ex: Voiture)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.addFormButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <View style={styles.buttonSpacer} />
              <GradientButton
                title="Créer"
                onPress={handleAddCategory}
                style={styles.createButton}
              />
            </View>
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
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Aucun résultat' : 'Aucune catégorie'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Essayez avec d\'autres termes'
                    : 'Créez votre première catégorie pour commencer à tracker !'}
                </Text>
              </View>
            }
          />
        </Pressable>
      </View>

      <PromptDialog
        visible={showRenameDialog}
        title="Renommer la catégorie"
        message="Entrez le nouveau nom :"
        placeholder="Nom de la catégorie"
        defaultValue={categoryToRename?.name || ''}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
        confirmText="Renommer"
        cancelText="Annuler"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.huge + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl,
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
    ...shadows.primary,
  },
  addButtonGradient: {
    width: touchTargets.large,
    height: touchTargets.large,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statNumber: {
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
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    marginTop: -spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  addForm: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  addFormTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  addFormButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  buttonSpacer: {
    width: spacing.md,
  },
  createButton: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 68,
    ...shadows.sm,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  categoryArrow: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
