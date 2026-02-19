import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const ICONS = [
  // Maison & vie quotidienne
  'home-outline', 'bed-outline', 'construct-outline', 'water-outline', 'flash-outline',
  'trash-outline', 'cut-outline', 'hammer-outline', 'key-outline', 'color-palette-outline',
  // Transport
  'car-outline', 'bicycle-outline', 'airplane-outline', 'bus-outline', 'train-outline',
  'boat-outline', 'walk-outline', 'rocket-outline',
  // Santé & sport
  'heart-outline', 'fitness-outline', 'medical-outline', 'bandage-outline', 'body-outline',
  'barbell-outline', 'football-outline', 'basketball-outline', 'bicycle-outline',
  // Nourriture & boissons
  'restaurant-outline', 'cafe-outline', 'beer-outline', 'wine-outline', 'nutrition-outline',
  'pizza-outline',
  // Travail & études
  'briefcase-outline', 'school-outline', 'book-outline', 'laptop-outline', 'calculator-outline',
  'document-outline',
  // Argent
  'cash-outline', 'card-outline', 'wallet-outline', 'trending-up-outline', 'trending-down-outline',
  // Social
  'people-outline', 'person-outline', 'happy-outline', 'sad-outline', 'chatbubble-outline',
  // Nature
  'leaf-outline', 'sunny-outline', 'rainy-outline', 'paw-outline', 'flower-outline', 'globe-outline',
  // Divertissement
  'game-controller-outline', 'musical-notes-outline', 'film-outline', 'headset-outline', 'tv-outline',
  'camera-outline',
  // Divers
  'star-outline', 'bulb-outline', 'gift-outline', 'timer-outline', 'alarm-outline',
  'flag-outline', 'shield-outline', 'settings-outline',
];

export default function IconPicker({ visible, selected, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Choisir une icône</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={ICONS}
            numColumns={5}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.iconItem, selected === item && styles.iconItemSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Ionicons
                  name={item}
                  size={26}
                  color={selected === item ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />

          {selected && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => { onSelect(null); onClose(); }}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.clearButtonText}>Supprimer l'icône</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingBottom: spacing.huge,
    maxHeight: '75%',
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.warmGray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  grid: {
    padding: spacing.lg,
  },
  iconItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    margin: spacing.xs,
  },
  iconItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
