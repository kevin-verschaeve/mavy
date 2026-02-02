import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { actionService } from '../services/actionService';
import { entryService } from '../services/entryService';
import { actionFieldService } from '../services/actionFieldService';
import ActionButton from '../components/ActionButton';

export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [actions, setActions] = useState([]);
  const [lastEntries, setLastEntries] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [isConfigurable, setIsConfigurable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const data = await actionService.getByCategory(categoryId);
      setActions(data);
      
      // Charger la dernière entrée pour chaque action
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

      // Si l'action est configurable, naviguer vers l'écran de configuration
      if (isConfigurable) {
        navigation.navigate('ConfigureAction', {
          actionId,
          actionName
        });
      }

      loadActions();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'action');
    }
  };

  const handleActionPress = async (action) => {
    // Si l'action est configurable, naviguer vers le formulaire de saisie
    if (action.is_configurable === 1) {
      navigation.navigate('AddEntry', {
        action
      });
      return;
    }

    // Sinon, créer l'entrée directement
    try {
      await entryService.create(action.id);
      Alert.alert(
        '✅ Enregistré !',
        `"${action.name}" a été enregistré avec succès`,
        [{ text: 'OK', onPress: () => loadActions() }]
      );
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
        {
          text: 'Renommer',
          onPress: () => handleRenameAction(action)
        },
        {
          text: 'Supprimer',
          onPress: () => handleDeleteAction(action),
          style: 'destructive'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const handleRenameAction = (action) => {
    Alert.prompt(
      'Renommer l\'action',
      'Entrez le nouveau nom :',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
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
              Alert.alert('✅ Succès', 'Action renommée');
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
      `Êtes-vous sûr de vouloir supprimer "${action.name}" et toutes ses entrées ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await actionService.delete(action.id);
              loadActions();
              Alert.alert('✅ Succès', 'Action supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'action');
            }
          },
          style: 'destructive'
        }
      ]
    );
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
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{categoryName}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'action (ex: Révision voiture)"
            value={newActionName}
            onChangeText={setNewActionName}
          />
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsConfigurable(!isConfigurable)}
          >
            <View style={[styles.checkbox, isConfigurable && styles.checkboxChecked]}>
              {isConfigurable && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Configurable ?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddAction}>
            <Text style={styles.submitButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={actions}
        renderItem={renderAction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucune action. Créez-en une pour commencer à tracker !
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  addForm: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
    paddingHorizontal: 20,
  },
});
