import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function ActionButton({ action, onPress, onHistoryPress, onLongPress, lastEntry }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={styles.actionName}>{action.name}</Text>
          <Text style={styles.lastDate}>
            Dernière fois: {formatDate(lastEntry?.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={onHistoryPress}
        activeOpacity={0.7}
      >
        <Text style={styles.historyIcon}>📋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    marginHorizontal: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'column',
  },
  actionName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  historyButton: {
    backgroundColor: '#6b7280',
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyIcon: {
    fontSize: 24,
  },
});
