import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card } from './Card';
import { Icon } from './Icon';
import { PriceRangePicker } from './PriceRangePicker';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { ShopSheet } from './ShopSheet';
import { Garment, PriceBandId, openShopLink, shopLinks } from '../lib/shop';

interface Props {
  garments: Garment[];
  band: PriceBandId;
  onChangeBand: (id: PriceBandId) => void;
}

/**
 * One compact row per garment. Retailers live behind an in-app sheet rather
 * than three inline buttons — showing every retailer for every garment tripled
 * the height of this card for no added meaning.
 */
export function WhereToBuy({ garments, band, onChangeBand }: Props) {
  const [open, setOpen] = useState<Garment | null>(null);

  if (garments.length === 0) return null;

  return (
    <Card style={{ padding: space.md }}>
      <View style={styles.header}>
        <Text style={type.caption}>Shop the look</Text>
        <Text style={styles.count}>{garments.length} items</Text>
      </View>

      <PriceRangePicker value={band} onChange={onChangeBand} />

      <View style={{ marginTop: space.sm }}>
        {garments.map((garment, i) => (
          <Pressable
            key={garment.key}
            accessibilityRole="button"
            accessibilityLabel={`Shop ${garment.description}`}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setOpen(garment);
            }}
            style={({ pressed }) => [
              styles.row,
              i > 0 && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.slot}>{garment.key}</Text>
            <Text style={[type.body, styles.name]} numberOfLines={1}>
              {garment.description}
            </Text>
            <Icon name="link" size={15} color={color.accent} strokeWidth={2.2} />
          </Pressable>
        ))}
      </View>
      <ShopSheet
        visible={open !== null}
        title={open?.description ?? ''}
        links={open ? shopLinks(open.description, band) : []}
        onPick={(url) => {
          setOpen(null);
          openShopLink(url);
        }}
        onClose={() => setOpen(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  count: { fontSize: 11, fontWeight: '700', color: color.faint },

  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: color.border },
  pressed: { opacity: 0.55 },
  slot: {
    width: 46,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: color.faint,
  },
  name: { flex: 1, fontWeight: '600' },
});
