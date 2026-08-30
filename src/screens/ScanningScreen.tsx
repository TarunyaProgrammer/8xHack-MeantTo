import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';

interface Props {
  done: number;
  total: number;
}

/**
 * Deliberately visible. The scan takes a few seconds and that pause is part of
 * the product — it is when the pile is being counted.
 */
export function ScanningScreen({ done, total }: Props) {
  const progress = total > 0 ? done / total : 0;

  return (
    <Screen center>
      <View style={{ alignItems: 'center' }}>
        <Text style={type.number}>{done}</Text>
        <Text style={[type.caption, { marginTop: space.xs }]}>Reading your screenshots</Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: {
    marginTop: space.xl,
    width: 200,
    height: 3,
    borderRadius: radius.chip,
    backgroundColor: color.border,
    overflow: 'hidden',
  },
  fill: { height: 3, borderRadius: radius.chip, backgroundColor: color.accent },
});
