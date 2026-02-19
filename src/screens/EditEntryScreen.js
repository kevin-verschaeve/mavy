import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { actionFieldService } from '../services/actionFieldService';
import { entryService } from '../services/entryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import Header from '../components/Header';
import { colors, gradients, spacing, typography, borderRadius, shadows } from '../constants/theme';

export default function EditEntryScreen({ route, navigation }) {
  const { entry, actionId, actionName } = route.params;
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const data = await actionFieldService.getByAction(actionId);
      setFields(data);

      // Parser les valeurs existantes
      let existingValues = {};
      if (entry.field_values) {
        try {
          existingValues = JSON.parse(entry.field_values);
        } catch (error) {
          console.error('Erreur parsing field_values:', error);
        }
      }

      // Initialiser les valeurs avec les valeurs existantes
      const initialValues = {};
      data.forEach(field => {
        initialValues[field.field_name] = existingValues[field.field_name] || '';
      });
      setFieldValues(initialValues);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les champs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await entryService.updateFieldValues(entry.id, fieldValues);
      showToast('Modifications enregistrées');
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de modifier l\'entrée',
        position: 'top',
        visibilityTime: 3000
      });
    }
  };

  if (loading) {
    return <Loading message="Chargement des champs..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title={actionName}
        subtitle="Modifier l'entrée"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.id} style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{field.field_name}</Text>
                <View style={[
                  styles.fieldTypeBadge,
                  { backgroundColor: field.field_type === 'number' ? colors.accent + '20' : colors.primary + '20' }
                ]}>
                  <Text style={[
                    styles.fieldTypeBadgeText,
                    { color: field.field_type === 'number' ? colors.accent : colors.primary }
                  ]}>
                    {field.field_type === 'number' ? '123' : 'ABC'}
                  </Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                value={fieldValues[field.field_name] || ''}
                onChangeText={(value) =>
                  setFieldValues({ ...fieldValues, [field.field_name]: value })
                }
                placeholder={`Entrez ${field.field_name.toLowerCase()}`}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient colors={gradients.forest} style={styles.submitButtonGradient}>
            <Text style={styles.submitButtonText}>Enregistrer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
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
  input: {
    backgroundColor: colors.warmGray50,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.warmGray100,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  submitButton: {
    flex: 2,
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
});
