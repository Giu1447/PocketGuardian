/**
 * Status-Indikator Komponente
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'warning' | 'error';
  label: string;
  description?: string;
}

export default function StatusIndicator({ status, label, description }: StatusIndicatorProps) {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'inactive':
        return theme.colors.outline;
      case 'warning':
        return theme.colors.tertiary;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getStatusIcon()}</Text>
          <Text 
            variant="bodyLarge" 
            style={[styles.label, { color: getStatusColor() }]}
          >
            {label}
          </Text>
        </View>
        {description && (
          <Text variant="bodySmall" style={styles.description}>
            {description}
          </Text>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    fontWeight: '600',
    flex: 1,
  },
  description: {
    marginTop: 4,
    opacity: 0.7,
    marginLeft: 24,
  },
});
