import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { initDatabase } from './src/config/turso';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { ToastProvider } from './src/components/Toast';
import { colors, spacing, typography } from './src/constants/theme';
import ProfileSelectionScreen from './src/screens/ProfileSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ActionHistoryScreen from './src/screens/ActionHistoryScreen';
import ConfigureActionScreen from './src/screens/ConfigureActionScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import EditEntryScreen from './src/screens/EditEntryScreen';

const Stack = createNativeStackNavigator();

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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActionHistory"
        component={ActionHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfigureAction"
        component={ConfigureActionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditEntry"
        component={EditEntryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const { userId, isLoading, refreshUser } = useUser();

  useEffect(() => {
    async function prepare() {
      try {
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

  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Vérifiez votre configuration Turso dans src/config/turso.js
        </Text>
      </View>
    );
  }

  // Afficher l'écran de sélection de profil si aucun profil n'est sélectionné
  if (!userId) {
    return <ProfileSelectionScreen onProfileSelected={refreshUser} />;
  }

  return (
    <NavigationContainer>
      <HomeStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    color: colors.danger,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
