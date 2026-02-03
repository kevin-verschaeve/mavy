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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { actionFieldService } from '../services/actionFieldService';
import { entryService } from '../services/entryService';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import { colors, gradients, spacing, typography, borderRadius, shadows, touchTargets } from '../constants/theme';

export default function AddEntryScreen({ route, navigation }) {
  const { action } = route.params;
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const data = await actionFieldService.getByAction(action.id);
      setFields(data);

      // Initialiser les valeurs
      const initialValues = {};
      data.forEach(field => {
        initialValues[field.field_name] = '';
      });
      setFieldValues(initialValues);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les champs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Vérifier que tous les champs sont remplis
    const emptyFields = fields.filter(field => !fieldValues[field.field_name]?.trim());
    if (emptyFields.length > 0) {
      Alert.alert(
        'Champs manquants',
        `Veuillez remplir tous les champs : ${emptyFields.map(f => f.field_name).join(', ')}`
      );
      return;
    }

    try {
      await entryService.create(action.id, '', fieldValues);
      showToast(`"${action.name}" enregistré`);
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'enregistrer l\'entrée',
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
            <Text style={styles.headerSubtitle}>Nouvelle entrée</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{action.name}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {fields.map((field, index) => (
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
                style={[
                  styles.input,
                  index === 0 && styles.inputFocused
                ]}
                value={fieldValues[field.field_name] || ''}
                onChangeText={(value) =>
                  setFieldValues({ ...fieldValues, [field.field_name]: value })
                }
                placeholder={`Entrez ${field.field_name.toLowerCase()}`}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
                autoFocus={index === 0}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
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
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
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
  inputFocused: {
    borderColor: colors.primary,
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
