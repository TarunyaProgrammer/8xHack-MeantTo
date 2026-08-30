import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 13, fontWeight: '500', color: color.muted },
});
