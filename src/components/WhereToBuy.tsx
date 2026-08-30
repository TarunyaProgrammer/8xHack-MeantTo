import React from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card } from './Card';
import { Icon } from './Icon';
import { PriceRangePicker } from './PriceRangePicker';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Garment, PriceBandId, openShopLink, shopLinks } from '../lib/shop';

interface Props {
  garments: Garment[];
  band: PriceBandId;
  onChangeBand: (id: PriceBandId) => void;
}

/**
 * One compact row per garment. Retailers live behind a native picker rather
 * than three inline buttons — showing every retailer for every garment tripled
 * the height of this card for no added meaning, and made the screen scroll.
 */
function chooseRetailer(description: string, band: PriceBandId) {
  const links = shopLinks(description, band);
  const names = links.map((l) => l.retailer);

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...names, 'Cancel'], cancelButtonIndex: names.length, title: description },
      (i) => {
        if (i < names.length) openShopLink(links[i].url);
      }
    );
    return;
  }

  Alert.alert('Shop this', description, [
    ...links.map((l) => ({ text: l.retailer, onPress: () => openShopLink(l.url) })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export function WhereToBuy({ garments, band, onChangeBand }: Props) {
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
              chooseRetailer(garment.description, band);
            }}
            style={({ pressed }) => [
              styles.row,
              i > 0 && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.slot}>{garment.key.slice(0, 3).toUpperCase()}</Text>
            <Text style={[type.body, styles.name]} numberOfLines={1}>
              {garment.description}
            </Text>
            <Icon name="link" size={15} color={color.accent} strokeWidth={2.2} />
          </Pressable>
        ))}
      </View>
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
    width: 30,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: color.faint,
  },
  name: { flex: 1, fontWeight: '600' },
});
