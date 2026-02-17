import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
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
  const { userId, isLoading, refreshUser } = useUser();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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
    <SafeAreaProvider>
      <UserProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </UserProvider>
    </SafeAreaProvider>
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
});
