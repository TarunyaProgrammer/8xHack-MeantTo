import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, radius, space } from '../theme/tokens';
import { PRICE_BANDS, PriceBandId } from '../lib/shop';

interface Props {
  value: PriceBandId;
  onChange: (id: PriceBandId) => void;
}

/**
 * Three price bands, one row. The labels are the filter bounds the user picks —
 * never a product price, which we have no way of knowing.
 */
export function PriceRangePicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {PRICE_BANDS.map((band) => {
        const active = band.id === value;
        return (
          <Pressable
            key={band.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onChange(band.id);
            }}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && !active && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{band.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs },
  chip: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: color.accent },
  pressed: { opacity: 0.6 },
  label: { fontSize: 13, fontWeight: '500', color: color.muted },
  labelActive: { color: color.bg },
});
