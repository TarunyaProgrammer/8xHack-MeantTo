import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Icon } from './Icon';
import { PriceRangePicker } from './PriceRangePicker';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Garment, PriceBandId, ShopLink, openShopLink, shopLinks } from '../lib/shop';

interface Props {
  garments: Garment[];
  band: PriceBandId;
  onChangeBand: (id: PriceBandId) => void;
}

/**
 * Retailers sit in an equal-width segmented row rather than free-floating
 * chips, so every garment block shares one vertical rhythm and the row edges
 * line up down the card.
 */
function RetailerRow({ links }: { links: ShopLink[] }) {
  return (
    <View style={styles.retailers}>
      {links.map((link, i) => (
        <Pressable
          key={link.retailer}
          accessibilityRole="link"
          accessibilityLabel={`${link.retailer}, opens a search`}
          onPress={() => openShopLink(link.url)}
          style={({ pressed }) => [
            styles.retailer,
            i > 0 && styles.retailerDivider,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retailerLabel} numberOfLines={1}>
            {link.retailer}
          </Text>
          <Icon name="link" size={12} color={color.accent} strokeWidth={2.2} />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Every row opens a real, price-filtered search on the retailer's own site.
 * No price is ever shown here — we have no product data, and inventing one
 * would be a lie to the user.
 */
export function WhereToBuy({ garments, band, onChangeBand }: Props) {
  if (garments.length === 0) return null;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={type.caption}>Where to buy</Text>
        <Text style={styles.count}>{garments.length}</Text>
      </View>

      <PriceRangePicker value={band} onChange={onChangeBand} />

      <View style={{ marginTop: space.lg }}>
        {garments.map((garment, i) => (
          <View key={garment.key} style={[styles.garment, i > 0 && styles.garmentDivider]}>
            <Text style={styles.slot}>{garment.key}</Text>
            <Text style={[type.body, { marginTop: 2 }]} numberOfLines={2}>
              {garment.description}
            </Text>
            <RetailerRow links={shopLinks(garment.description, band)} />
          </View>
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
    marginBottom: space.md,
  },
  count: { fontSize: 11, fontWeight: '800', color: color.faint },

  garment: { paddingBottom: space.md },
  garmentDivider: {
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space.md,
  },
  slot: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.accent,
  },

  retailers: {
    flexDirection: 'row',
    marginTop: space.sm,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  retailer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
  },
  retailerDivider: { borderLeftWidth: 1, borderLeftColor: color.border },
  pressed: { backgroundColor: color.surfaceHi },
  retailerLabel: { fontSize: 13, fontWeight: '700', color: color.ink },
});
