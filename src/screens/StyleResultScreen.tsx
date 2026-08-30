import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card, Chip, GhostButton, Screen, Shimmer, SwipeDeck } from '../components';
import { WhereToBuy } from '../components/WhereToBuy';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Analysis } from '../lib/style';
import { DEFAULT_BAND, PriceBandId, garmentsFrom, loadPriceBand, savePriceBand } from '../lib/shop';

type Look = Analysis['outfits'][number];

interface Props {
  original: string;
  analysis: Analysis;
  /** One slot per look, filled as each render lands. */
  tryOns: (string | null)[];
  tryOnErrors: (string | null)[];
  /**
   * Which look is open, held by the parent so the hardware back gesture can
   * close it. Kept here it was invisible to the app's back handler, which
   * restarted the whole flow instead of returning to the deck.
   */
  selected: number | null;
  onSelect: (index: number | null) => void;
  onRestart: () => void;
}

/** Garment slots read loosely, so a schema change cannot blank the card. */
const SLOTS: [label: string, key: string][] = [
  ['Top', 'top'],
  ['Bottom', 'bottom'],
  ['Shoes', 'shoes'],
  ['Layer', 'outerwear'],
  ['Detail', 'accessory'],
];

function outfitRows(look: Look): { label: string; value: string }[] {
  const record = look as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];
  for (const [label, key] of SLOTS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') rows.push({ label, value });
  }
  return rows;
}

function Swatches({ items }: { items: { hex: string; name: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' }}>
      {items.map((c) => (
        <View key={c.hex + c.name} style={{ alignItems: 'center', width: 78 }}>
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: radius.thumb,
              backgroundColor: c.hex,
              borderWidth: 1,
              borderColor: color.borderHi,
            }}
          />
          <Text style={{ fontSize: 11, fontWeight: '600', color: color.muted, marginTop: 6 }} numberOfLines={2}>
            {c.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function StyleResultScreen({ original, analysis, tryOns, tryOnErrors, selected, onSelect, onRestart }: Props) {
  const { width } = useWindowDimensions();
  const [band, setBand] = useState<PriceBandId>(DEFAULT_BAND);

  React.useEffect(() => {
    void loadPriceBand().then(setBand);
  }, []);

  const ready = tryOns.filter(Boolean).length;

  if (selected !== null) {
    const look = analysis.outfits[selected];
    const image = tryOns[selected];

    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={type.caption}>{look.register}</Text>
            <Pressable onPress={() => onSelect(null)} hitSlop={10}>
              <Chip label="All looks" />
            </Pressable>
          </View>

          <Card style={{ padding: space.sm }}>
            {image ? (
              <Animated.Image
                entering={FadeIn.duration(400)}
                source={{ uri: image }}
                style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius.tile }}
                resizeMode="cover"
              />
            ) : (
              <Shimmer width={width - space.lg * 2 - space.sm * 2} height={(width - space.lg * 2 - space.sm * 2) * 1.5} />
            )}
          </Card>

          <Card hero>
            <Text style={type.caption}>The fit</Text>
            <Text style={[type.h1, { marginTop: 6 }]}>{look.top}</Text>
            {outfitRows(look).slice(1).map((row, i) => (
              <View
                key={row.label}
                style={{
                  flexDirection: 'row',
                  gap: space.md,
                  paddingVertical: space.sm,
                  borderTopWidth: 1,
                  borderTopColor: color.border,
                  marginTop: i === 0 ? space.sm : 0,
                }}
              >
                <Text style={{ width: 62, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: color.faint, paddingTop: 3 }}>
                  {row.label}
                </Text>
                <Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{row.value}</Text>
              </View>
            ))}
            <Text style={[type.bodyMuted, { fontSize: 14, marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: color.border }]}>
              {look.why}
            </Text>
          </Card>

          <WhereToBuy
            garments={garmentsFrom(look)}
            band={band}
            onChangeBand={(id) => {
              setBand(id);
              void savePriceBand(id);
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}>
        <View>
          <Text style={type.caption}>Your season</Text>
          <Text style={[type.mega, { marginTop: 6 }]}>{analysis.season}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: space.sm, flexWrap: 'wrap' }}>
            <Chip label={analysis.undertone} tone="accent" />
            <Chip label={`${analysis.contrast} contrast`} />
            <Chip label={`${ready}/${analysis.outfits.length} looks`} />
          </View>
        </View>

        <SwipeDeck
          original={original}
          onOpen={onSelect}
          items={analysis.outfits.map((look, i) => ({
            key: look.register,
            label: look.register,
            caption: look.top,
            image: tryOns[i] ?? null,
            error: tryOnErrors[i] ?? null,
          }))}
        />

        <Swatches items={analysis.palette} />

        <GhostButton label="Try another photo" onPress={onRestart} />
      </ScrollView>
    </Screen>
  );
}
