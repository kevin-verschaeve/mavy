import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { initDatabase } from './src/config/turso';
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ActionHistoryScreen from './src/screens/ActionHistoryScreen';
import ConfigureActionScreen from './src/screens/ConfigureActionScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import EditEntryScreen from './src/screens/EditEntryScreen';

const Stack = createNativeStackNavigator();

// Stack pour la navigation Home -> Category -> ActionHistory / ConfigureAction / AddEntry
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={({ route }) => ({
          title: route.params?.categoryName || 'Catégorie',
          headerBackTitle: 'Retour'
        })}
      />
      <Stack.Screen
        name="ActionHistory"
        component={ActionHistoryScreen}
        options={({ route }) => ({
          title: route.params?.actionName || 'Historique',
          headerBackTitle: 'Retour'
        })}
      />
      <Stack.Screen
        name="ConfigureAction"
        component={ConfigureActionScreen}
        options={({ route }) => ({
          title: route.params?.actionName || 'Configuration',
          headerBackTitle: 'Retour'
        })}
      />
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={({ route }) => ({
          title: route.params?.action?.name || 'Nouvelle entrée',
          headerBackTitle: 'Retour'
        })}
      />
      <Stack.Screen
        name="EditEntry"
        component={EditEntryScreen}
        options={({ route }) => ({
          title: route.params?.actionName || 'Modifier l\'entrée',
          headerBackTitle: 'Retour'
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialiser la base de données
        const success = await initDatabase();
        if (!success) {
          setError('Impossible d\'initialiser la base de données');
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation:', e);
        setError(e.message);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Erreur</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Vérifiez votre configuration Turso dans src/config/turso.js
        </Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <HomeStack />
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#ef4444',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
