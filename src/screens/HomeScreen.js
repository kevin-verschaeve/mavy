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
          style={styles.categoryCard}
          onPress={() => navigation.navigate('Category', {
            categoryId: item.id,
            categoryName: item.name,
            colorIndex: index
          })}
          activeOpacity={0.7}
        >
          <View style={[styles.categoryIconContainer, { backgroundColor: accentColor + '15' }]}>
            <Text style={styles.categoryIcon}>{item.icon || '📁'}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categorySubtitle}>Appuyez pour voir les actions</Text>
          </View>
          <View style={[styles.categoryAccent, { backgroundColor: accentColor }]} />
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (loading) {
    return <Loading message="Chargement des categories..." />;
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
          <View>
            <Text style={styles.greeting}>Bonjour !</Text>
            <Text style={styles.title}>Mes Trackers</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
            accessibilityLabel="Ajouter une categorie"
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

        {/* Stats rapides */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>∞</Text>
            <Text style={styles.statLabel}>Possibilites</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher une categorie..."
        />

        {showAddForm && (
          <View style={styles.addForm} onStartShouldSetResponder={() => true}>
            <Text style={styles.addFormTitle}>Nouvelle categorie</Text>
            <Input
              placeholder="Nom de la categorie (ex: Voiture)"
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
                title="Creer"
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
                  {searchQuery ? 'Aucun resultat' : 'Aucune categorie'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Essayez avec d\'autres termes'
                    : 'Creez votre premiere categorie pour commencer a tracker !'}
                </Text>
              </View>
            }
          />
        </Pressable>
      </View>
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
  greeting: {
    fontSize: typography.sizes.md,
    color: colors.warmGray400,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xxxl,
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
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  categorySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  categoryAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
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
