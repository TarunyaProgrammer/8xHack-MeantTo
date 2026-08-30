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

function RetailerLink({ link }: { link: ShopLink }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${link.retailer}, opens a search`}
      onPress={() => openShopLink(link.url)}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text style={styles.linkLabel}>{link.retailer}</Text>
      <Icon name="link" size={13} color={color.accent} strokeWidth={2} />
    </Pressable>
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
      <Text style={[type.caption, { marginBottom: space.sm }]}>Where to buy</Text>

      <PriceRangePicker value={band} onChange={onChangeBand} />

      <View style={{ marginTop: space.md, gap: space.md }}>
        {garments.map((garment) => (
          <View key={garment.key} style={{ gap: space.xs }}>
            <Text style={type.body} numberOfLines={2}>
              {garment.description}
            </Text>
            <View style={styles.links}>
              {shopLinks(garment.description, band).map((link) => (
                <RetailerLink key={link.retailer} link={link} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.sm,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.6 },
  linkLabel: { fontSize: 13, fontWeight: '600', color: color.accent },
});
