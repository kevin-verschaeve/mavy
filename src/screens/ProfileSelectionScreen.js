import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, shadows, borderRadius } from '../constants/theme';
import { USERS, setCurrentUserId } from '../services/userService';

export default function ProfileSelectionScreen({ onProfileSelected }) {
  const handleSelectProfile = async (userId) => {
    const success = await setCurrentUserId(userId);
    if (success && onProfileSelected) {
      onProfileSelected(userId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background avec gradient */}
      <LinearGradient
        colors={gradients.night}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue sur</Text>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleGradient}
          >
            <Text style={styles.appName}>Mavy</Text>
          </LinearGradient>
          <Text style={styles.subtitle}>Sélectionnez votre profil</Text>
        </View>

        {/* Cartes de profils */}
        <View style={styles.profilesContainer}>
          {/* Kevin */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => handleSelectProfile(USERS.KEVIN.id)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCardGradient}
            >
              <View style={styles.avatar}>
                <Ionicons name="man-outline" size={52} color="white" />
              </View>
              <Text style={styles.profileName}>{USERS.KEVIN.name}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Fanny */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => handleSelectProfile(USERS.FANNY.id)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ec4899', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCardGradient}
            >
              <View style={styles.avatar}>
                <Ionicons name="woman-outline" size={52} color="white" />
              </View>
              <Text style={styles.profileName}>{USERS.FANNY.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmGray900,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.medium,
    color: colors.warmGray300,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  titleGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.warmGray400,
    textAlign: 'center',
  },
  profilesContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.huge,
  },
  profileCard: {
    borderRadius: borderRadius.xxl,
    ...shadows.lg,
  },
  profileCardGradient: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    minWidth: 150,
    minHeight: 180,
    justifyContent: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  profileName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  footerHint: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
