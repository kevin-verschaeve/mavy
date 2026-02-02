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
import Toast from 'react-native-toast-message';
import { actionFieldService } from '../services/actionFieldService';
import { entryService } from '../services/entryService';

export default function EditEntryScreen({ route, navigation }) {
  const { entry, actionId, actionName } = route.params;
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);

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
      await entryService.updateFieldValues(entry.id, fieldValues);
      Toast.show({
        type: 'success',
        text1: '✅ Modifié !',
        text2: 'Les champs ont été modifiés avec succès',
        position: 'top',
        visibilityTime: 2000
      });
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
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Modifier l'entrée</Text>
          <Text style={styles.subtitle}>{actionName}</Text>
        </View>

        <View style={styles.form}>
          {fields.map(field => (
            <View key={field.id} style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{field.field_name}</Text>
                <Text style={styles.fieldTypeBadge}>
                  {field.field_type === 'number' ? '123' : 'abc'}
                </Text>
              </View>
              <TextInput
                style={styles.input}
                value={fieldValues[field.field_name] || ''}
                onChangeText={(value) =>
                  setFieldValues({ ...fieldValues, [field.field_name]: value })
                }
                placeholder={`Entrez ${field.field_name.toLowerCase()}`}
                keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  fieldTypeBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
