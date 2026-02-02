import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }) {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmGray100,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  iconText: {
    fontSize: typography.sizes.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearText: {
    fontSize: typography.sizes.xl,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
});
