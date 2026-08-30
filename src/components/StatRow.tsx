import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';

interface Props {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

export function StatRow({ label, value, emphasis }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.value, emphasis && styles.valueEmphasis]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    paddingVertical: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: color.ink,
    minWidth: 46,
  },
  valueEmphasis: { color: color.accent },
  label: { fontSize: 16, color: color.muted, flex: 1 },
});
