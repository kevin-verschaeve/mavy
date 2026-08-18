import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryService } from '../services/categoryService';
import { getCurrentUser, clearCurrentUser } from '../services/userService';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import IconPicker from '../components/IconPicker';
import ActionSheet from '../components/ActionSheet';
import Header from '../components/Header';
import {
  colors,
  categoryColors,
  spacing,
  typography,
  borderRadius,
  shadows
} from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(null);
  const [showIconPickerForAdd, setShowIconPickerForAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIconPickerForEdit, setShowIconPickerForEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuCategory, setMenuCategory] = useState(null);
  const editNameRef = useRef(null);

  const { showToast } = useToast();
  const { refreshUser } = useUser();

  useEffect(() => {
    loadCategories();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCategories = async () => {
    try {
      setLoadError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      // On journalise et on affiche la vraie cause : cela permet de distinguer
      // une config manquante, une table absente (migrations non appliquées) ou
      // un problème réseau, plutôt qu'un message générique.
      console.error('Erreur lors du chargement des catégories:', error);
      const message = error?.message || 'Erreur inconnue';
      setLoadError(message);
      Alert.alert('Impossible de charger les catégories', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    loadCategories();
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
      await categoryService.create(newCategoryName.trim(), newCategoryIcon);
      setNewCategoryName('');
      setNewCategoryIcon(null);
      setShowAddForm(false);
      loadCategories();
      showToast('Catégorie créée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la catégorie');
    }
  };

  const handleEditCategory = (category) => {
    setCategoryToEdit(category);
    setEditName(category.name);
    setEditIcon(category.icon || null);
    setShowEditModal(true);
    setTimeout(() => editNameRef.current?.focus(), 100);
  };

  const handleEditConfirm = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    try {
      await categoryService.update(categoryToEdit.id, editName.trim(), editIcon);
      setShowEditModal(false);
      setCategoryToEdit(null);
      loadCategories();
      showToast('Catégorie modifiée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier la catégorie');
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setCategoryToEdit(null);
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
  };

  const handleChangeProfile = () => {
    Alert.alert(
      'Changer de profil',
      'Voulez-vous vraiment changer de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Changer',
          onPress: async () => {
            await clearCurrentUser();
            // Rafraîchir le contexte utilisateur pour revenir à l'écran de sélection
            await refreshUser();
          }
        }
      ]
    );
  };

  const getCategoryColor = (index) => {
    return categoryColors[index % categoryColors.length];
  };

  const menuOptions = useMemo(() => {
    if (!menuCategory) return [];
    return [
      { label: 'Modifier', icon: 'create-outline', onPress: () => handleEditCategory(menuCategory) },
      {
        label: 'Supprimer',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => handleDeleteCategory(menuCategory),
      },
    ];
  }, [menuCategory]);

  const renderCategory = ({ item, index }) => {
    const accentColor = item.color || getCategoryColor(index);

    return (
      <TouchableOpacity
        style={[styles.categoryCard, { borderColor: accentColor }]}
        onPress={() => navigation.navigate('Category', {
          categoryId: item.id,
          categoryName: item.name,
          colorIndex: index
        })}
        onLongPress={() => setMenuCategory(item)}
        activeOpacity={0.7}
      >
        {item.icon && (
          <View style={[styles.categoryIconContainer, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name={item.icon} size={28} color={accentColor} />
          </View>
        )}
        <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Chargement des catégories..." />;
  }

  if (loadError && categories.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Impossible de charger les catégories</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color={colors.textInverse} />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Catégories"
        count={categories.length}
        onAdd={() => setShowAddForm(!showAddForm)}
        addOpen={showAddForm}
        extended
        profile={currentUser ? { name: currentUser.name, onPress: handleChangeProfile } : null}
      />

      {/* Contenu principal */}
      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher une catégorie..."
        />

        {showAddForm && (
          <Pressable style={styles.overlay} onPress={() => { setShowAddForm(false); setNewCategoryIcon(null); }}>
            <View style={styles.addForm} onStartShouldSetResponder={() => true}>
              <Text style={styles.addFormTitle}>Nouvelle catégorie</Text>
              <Input
                placeholder="Nom de la catégorie (ex: Voiture)"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <TouchableOpacity
                style={styles.iconPickerButton}
                onPress={() => setShowIconPickerForAdd(true)}
              >
                {newCategoryIcon
                  ? <Ionicons name={newCategoryIcon} size={20} color={colors.primary} />
                  : <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                }
                <Text style={[styles.iconPickerButtonText, newCategoryIcon && styles.iconPickerButtonTextActive]}>
                  {newCategoryIcon ? 'Icône sélectionnée' : 'Choisir une icône (optionnel)'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowAddForm(false); setNewCategoryIcon(null); }}
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
          </Pressable>
        )}

        <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
          <FlatList
            data={filteredCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color={colors.textMuted} />
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

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={handleEditCancel}
      >
        <Pressable style={styles.centeredOverlay} onPress={handleEditCancel}>
          <View style={styles.editModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.addFormTitle}>Modifier la catégorie</Text>
            <TextInput
              ref={editNameRef}
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nom de la catégorie"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
              onSubmitEditing={handleEditConfirm}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.iconPickerButton}
              onPress={() => setShowIconPickerForEdit(true)}
            >
              {editIcon
                ? <Ionicons name={editIcon} size={20} color={colors.primary} />
                : <Ionicons name="image-outline" size={20} color={colors.textMuted} />
              }
              <Text style={[styles.iconPickerButtonText, editIcon && styles.iconPickerButtonTextActive]}>
                {editIcon ? 'Icône sélectionnée' : 'Choisir une icône (optionnel)'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.addFormButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleEditCancel}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <View style={styles.buttonSpacer} />
              <GradientButton title="Enregistrer" onPress={handleEditConfirm} style={styles.createButton} />
            </View>
          </View>
        </Pressable>
      </Modal>

      <IconPicker
        visible={showIconPickerForAdd}
        selected={newCategoryIcon}
        onSelect={setNewCategoryIcon}
        onClose={() => setShowIconPickerForAdd(false)}
      />
      <IconPicker
        visible={showIconPickerForEdit}
        selected={editIcon}
        onSelect={setEditIcon}
        onClose={() => setShowIconPickerForEdit(false)}
      />

      <ActionSheet
        visible={!!menuCategory}
        title={menuCategory?.name}
        subtitle="Que voulez-vous faire ?"
        options={menuOptions}
        onClose={() => setMenuCategory(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textInverse,
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
  row: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    width: '48%',
    aspectRatio: 1,
    ...shadows.sm,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  editModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    ...shadows.xl,
  },
  editInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    backgroundColor: colors.warmGray50,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  iconPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warmGray50,
    marginBottom: spacing.lg,
  },
  iconPickerButtonText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  iconPickerButtonTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
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
