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
  ScrollView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { actionService } from '../services/actionService';
import { entryService } from '../services/entryService';
import ActionButton, { computeReminder } from '../components/ActionButton';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import SearchBar from '../components/SearchBar';
import { toISODate, parseISODate, DEFAULT_WARN_DAYS } from '../utils/dateUtils';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

const INTERVAL_PRESETS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
  { label: 'Autre', days: 'custom' },
];

const WARN_PRESETS = [
  { label: '1 sem.', days: 7 },
  { label: '2 sem.', days: 14 },
  { label: '1 mois', days: 30 },
  { label: '2 mois', days: 60 },
];

const REMINDER_MODES = [
  { key: 'none', label: 'Aucun' },
  { key: 'periodic', label: 'Périodique' },
  { key: 'fixed', label: 'Date fixe' },
];

function getFinalIntervalDays(reminderDays, customDays) {
  if (reminderDays === null) return null;
  if (reminderDays === 'custom') return parseInt(customDays) || null;
  return reminderDays;
}

function formatFullDate(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ReminderPicker({
  mode,
  onModeChange,
  intervalDays,
  onIntervalChange,
  customDays,
  onCustomDaysChange,
  warnDays,
  onWarnDaysChange,
  fixedDate,
  onFixedDatePress,
}) {
  return (
    <View style={styles.reminderSection}>
      <Text style={styles.reminderSectionTitle}>Rappel (optionnel)</Text>

      <View style={styles.presetRow}>
        {REMINDER_MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.presetChip, mode === m.key && styles.presetChipSelected]}
            onPress={() => onModeChange(m.key)}
          >
            <Text style={[styles.presetChipText, mode === m.key && styles.presetChipTextSelected]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'periodic' && (
        <>
          <Text style={styles.warnLabel}>Tous les :</Text>
          <View style={styles.presetRow}>
            {INTERVAL_PRESETS.map((preset) => (
              <TouchableOpacity
                key={String(preset.days)}
                style={[styles.presetChip, intervalDays === preset.days && styles.presetChipSelected]}
                onPress={() => onIntervalChange(preset.days)}
              >
                <Text style={[styles.presetChipText, intervalDays === preset.days && styles.presetChipTextSelected]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {intervalDays === 'custom' && (
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.input, styles.customInput]}
                placeholder="Nombre de jours"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={customDays}
                onChangeText={onCustomDaysChange}
              />
              <Text style={styles.customInputUnit}>jours</Text>
            </View>
          )}
        </>
      )}

      {mode === 'fixed' && (
        <TouchableOpacity style={styles.datePickerButton} onPress={onFixedDatePress}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.datePickerButtonText}>
            {fixedDate ? formatFullDate(fixedDate) : 'Choisir une date'}
          </Text>
        </TouchableOpacity>
      )}

      {mode !== 'none' && (
        <>
          <Text style={styles.warnLabel}>Prévenir avant :</Text>
          <View style={styles.presetRow}>
            {WARN_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.days}
                style={[styles.presetChip, warnDays === preset.days && styles.presetChipSelected]}
                onPress={() => onWarnDaysChange(preset.days)}
              >
                <Text style={[styles.presetChipText, warnDays === preset.days && styles.presetChipTextSelected]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [actions, setActions] = useState([]);
  const [lastEntries, setLastEntries] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [isConfigurable, setIsConfigurable] = useState(false);
  const [newReminderMode, setNewReminderMode] = useState('none');
  const [newReminderDays, setNewReminderDays] = useState(null);
  const [newWarnDays, setNewWarnDays] = useState(30);
  const [newCustomDays, setNewCustomDays] = useState('');
  const [newFixedDate, setNewFixedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingAction, setRenamingAction] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [reminderAction, setReminderAction] = useState(null);
  const [reminderMode, setReminderMode] = useState('none');
  const [reminderDays, setReminderDays] = useState(null);
  const [reminderWarnDays, setReminderWarnDays] = useState(30);
  const [reminderCustomDays, setReminderCustomDays] = useState('');
  const [reminderFixedDate, setReminderFixedDate] = useState(null);
  // 'new' = formulaire de création, 'edit' = modal de rappel, null = fermé
  const [datePickerTarget, setDatePickerTarget] = useState(null);
  const renameInputRef = useRef(null);

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

  // Les plus urgentes remontent en tête de liste. Tri stable : à urgence égale,
  // l'ordre renvoyé par la base est préservé.
  const sortedActions = useMemo(() => {
    const rank = { overdue: 0, warning: 1, ok: 2 };
    return filteredActions
      .map((action, index) => ({ action, index }))
      .sort((a, b) => {
        const rankA = rank[computeReminder(a.action, lastEntries[a.action.id]).status] ?? 3;
        const rankB = rank[computeReminder(b.action, lastEntries[b.action.id]).status] ?? 3;
        return rankA - rankB || a.index - b.index;
      })
      .map(({ action }) => action);
  }, [filteredActions, lastEntries]);

  const resetAddForm = () => {
    setNewActionName('');
    setIsConfigurable(false);
    setNewReminderMode('none');
    setNewReminderDays(null);
    setNewWarnDays(30);
    setNewCustomDays('');
    setNewFixedDate(null);
  };

  const handleAddAction = async () => {
    if (!newActionName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'action');
      return;
    }

    if (newReminderMode === 'fixed' && !newFixedDate) {
      Alert.alert('Erreur', 'Veuillez choisir une date de rappel');
      return;
    }

    const finalIntervalDays = newReminderMode === 'periodic'
      ? getFinalIntervalDays(newReminderDays, newCustomDays)
      : null;
    const finalDate = newReminderMode === 'fixed' ? toISODate(newFixedDate) : null;
    const finalWarnDays = (finalIntervalDays || finalDate) ? newWarnDays : null;

    try {
      const actionId = await actionService.create(
        categoryId,
        newActionName.trim(),
        isConfigurable,
        finalIntervalDays,
        finalWarnDays,
        finalDate
      );
      const actionName = newActionName.trim();
      resetAddForm();
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
      await actionService.consumeReminderDate(action);
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

  const handleConfigureAction = (action) => {
    navigation.navigate('ConfigureAction', {
      actionId: action.id,
      actionName: action.name
    });
  };

  const handleActionLongPress = (action) => {
    const options = [
      { text: 'Renommer', onPress: () => handleRenameAction(action) },
      { text: 'Rappel', onPress: () => handleOpenReminderModal(action) },
    ];

    if (action.is_configurable === 1) {
      options.push({
        text: 'Configurer les champs',
        onPress: () => handleConfigureAction(action)
      });
    }

    options.push(
      { text: 'Supprimer', onPress: () => handleDeleteAction(action), style: 'destructive' },
      { text: 'Annuler', style: 'cancel' }
    );

    Alert.alert(
      'Options',
      `Que voulez-vous faire avec "${action.name}" ?`,
      options
    );
  };

  const handleRenameAction = (action) => {
    setRenameValue(action.name);
    setRenamingAction(action);
    setTimeout(() => renameInputRef.current?.focus(), 100);
  };

  const handleRenameConfirm = async () => {
    if (!renameValue.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    try {
      await actionService.update(renamingAction.id, renameValue.trim());
      setRenamingAction(null);
      loadActions();
      showToast('Action renommée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de renommer l\'action');
    }
  };

  const handleOpenReminderModal = (action) => {
    const presetDayValues = INTERVAL_PRESETS.map(p => p.days).filter(d => d !== 'custom');
    const existingDays = action.reminder_interval_days ? Number(action.reminder_interval_days) : null;
    const isPreset = existingDays !== null && presetDayValues.includes(existingDays);

    setReminderAction(action);

    if (action.reminder_date) {
      setReminderMode('fixed');
      setReminderFixedDate(parseISODate(action.reminder_date));
      setReminderDays(null);
      setReminderCustomDays('');
    } else if (existingDays !== null) {
      setReminderMode('periodic');
      setReminderFixedDate(null);
      setReminderDays(isPreset ? existingDays : 'custom');
      setReminderCustomDays(isPreset ? '' : String(existingDays));
    } else {
      setReminderMode('none');
      setReminderFixedDate(null);
      setReminderDays(null);
      setReminderCustomDays('');
    }

    setReminderWarnDays(action.reminder_warn_days ? Number(action.reminder_warn_days) : DEFAULT_WARN_DAYS);
  };

  const handleSaveReminder = async () => {
    if (reminderMode === 'fixed' && !reminderFixedDate) {
      Alert.alert('Erreur', 'Veuillez choisir une date de rappel');
      return;
    }

    const finalIntervalDays = reminderMode === 'periodic'
      ? getFinalIntervalDays(reminderDays, reminderCustomDays)
      : null;
    const finalDate = reminderMode === 'fixed' ? toISODate(reminderFixedDate) : null;
    const finalWarnDays = (finalIntervalDays || finalDate) ? reminderWarnDays : null;

    try {
      await actionService.updateReminder(reminderAction.id, finalIntervalDays, finalWarnDays, finalDate);
      setReminderAction(null);
      loadActions();
      showToast(finalIntervalDays || finalDate ? 'Rappel configuré' : 'Rappel supprimé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de configurer le rappel');
    }
  };

  const handleDateValueChange = (event, selectedDate) => {
    const target = datePickerTarget;
    if (Platform.OS === 'android') {
      setDatePickerTarget(null);
    }
    if (!selectedDate) return;
    if (target === 'new') {
      setNewFixedDate(selectedDate);
    } else {
      setReminderFixedDate(selectedDate);
    }
  };

  const handleDatePickerDismiss = () => {
    setDatePickerTarget(null);
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
      <Header
        title={categoryName}
        count={actions.length}
        onBack={() => navigation.goBack()}
        onAdd={() => setShowAddForm(!showAddForm)}
        addOpen={showAddForm}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher une action..."
      />

      {showAddForm && (
        <Pressable style={styles.overlay} onPress={() => { setShowAddForm(false); resetAddForm(); }}>
          <ScrollView
            style={styles.addFormScroll}
            contentContainerStyle={styles.addFormScrollContent}
            onStartShouldSetResponder={() => true}
            keyboardShouldPersistTaps="handled"
          >
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

              <ReminderPicker
                mode={newReminderMode}
                onModeChange={setNewReminderMode}
                intervalDays={newReminderDays}
                onIntervalChange={setNewReminderDays}
                customDays={newCustomDays}
                onCustomDaysChange={setNewCustomDays}
                warnDays={newWarnDays}
                onWarnDaysChange={setNewWarnDays}
                fixedDate={newFixedDate}
                onFixedDatePress={() => setDatePickerTarget('new')}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddAction}>
                <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>Créer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      )}

      {/* Modal renommer */}
      <Modal
        visible={!!renamingAction}
        transparent
        animationType="fade"
        onRequestClose={() => setRenamingAction(null)}
      >
        <Pressable style={styles.centeredOverlay} onPress={() => setRenamingAction(null)}>
          <View style={[styles.addForm, { marginHorizontal: 0, width: '100%' }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.formTitle}>Renommer l'action</Text>
            <TextInput
              ref={renameInputRef}
              style={styles.input}
              value={renameValue}
              onChangeText={setRenameValue}
              selectTextOnFocus
              onSubmitEditing={handleRenameConfirm}
              returnKeyType="done"
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={[styles.submitButton, { flex: 1, backgroundColor: colors.warmGray100 }]}
                onPress={() => setRenamingAction(null)}
              >
                <View style={[styles.submitButtonGradient, { backgroundColor: colors.warmGray200 }]}>
                  <Text style={[styles.submitButtonText, { color: colors.textSecondary }]}>Annuler</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, { flex: 1 }]} onPress={handleRenameConfirm}>
                <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>Renommer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal rappel */}
      <Modal
        visible={!!reminderAction}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderAction(null)}
      >
        <Pressable style={styles.centeredOverlay} onPress={() => setReminderAction(null)}>
          <View style={[styles.addForm, { marginHorizontal: 0, width: '100%' }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.formTitle}>Rappel — {reminderAction?.name}</Text>

            <ReminderPicker
              mode={reminderMode}
              onModeChange={setReminderMode}
              intervalDays={reminderDays}
              onIntervalChange={setReminderDays}
              customDays={reminderCustomDays}
              onCustomDaysChange={setReminderCustomDays}
              warnDays={reminderWarnDays}
              onWarnDaysChange={setReminderWarnDays}
              fixedDate={reminderFixedDate}
              onFixedDatePress={() => setDatePickerTarget('edit')}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <TouchableOpacity
                style={[styles.submitButton, { flex: 1 }]}
                onPress={() => setReminderAction(null)}
              >
                <View style={[styles.submitButtonGradient, { backgroundColor: colors.warmGray200 }]}>
                  <Text style={[styles.submitButtonText, { color: colors.textSecondary }]}>Annuler</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, { flex: 1 }]} onPress={handleSaveReminder}>
                <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>Enregistrer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Pressable style={styles.listContainer} onPress={handleOutsidePress}>
        <FlatList
          data={sortedActions}
          renderItem={renderAction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color={colors.textMuted} />
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

      {datePickerTarget && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDatePickerTarget(null)}>
          <Pressable style={styles.centeredOverlay} onPress={() => setDatePickerTarget(null)}>
            <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                  <Text style={styles.datePickerCancel}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Date du rappel</Text>
                <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                  <Text style={styles.datePickerConfirm}>Confirmer</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={(datePickerTarget === 'new' ? newFixedDate : reminderFixedDate) || new Date()}
                mode="date"
                display="spinner"
                onValueChange={handleDateValueChange}
                onDismiss={handleDatePickerDismiss}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {datePickerTarget && Platform.OS === 'android' && (
        <DateTimePicker
          value={(datePickerTarget === 'new' ? newFixedDate : reminderFixedDate) || new Date()}
          mode="date"
          display="default"
          onValueChange={handleDateValueChange}
          onDismiss={handleDatePickerDismiss}
        />
      )}
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
  addFormScroll: {
    flexGrow: 0,
  },
  addFormScrollContent: {
    paddingBottom: spacing.lg,
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge,
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
  // Reminder picker styles
  reminderSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reminderSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.warmGray50,
  },
  presetChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  presetChipTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  customInput: {
    flex: 1,
    marginBottom: 0,
  },
  customInputUnit: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  warnLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.warmGray50,
    minHeight: touchTargets.minimum,
  },
  datePickerButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    width: '100%',
    ...shadows.lg,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  datePickerCancel: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  datePickerConfirm: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
