import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';

interface Props {
  label: string;
  tone?: 'default' | 'accent' | 'hot';
}

export function Chip({ label, tone = 'default' }: Props) {
  const fill =
    tone === 'accent' ? color.accent : tone === 'hot' ? color.hot : color.surfaceHi;
  const ink = tone === 'default' ? color.muted : color.surface;
  return (
    <View style={[styles.chip, { backgroundColor: fill }]}>
      <Text style={[styles.label, { color: ink }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.chip,
    paddingHorizontal: space.sm,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
});
