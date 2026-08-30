import React from 'react';
import { Image, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Card, Chip, GhostButton, Reveal, Screen, Shimmer } from '../components';
import { WhereToBuy } from '../components/WhereToBuy';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Analysis } from '../lib/style';
import {
  DEFAULT_BAND,
  PriceBandId,
  garmentsFrom,
  loadPriceBand,
  savePriceBand,
} from '../lib/shop';

interface Props {
  original: string;
  analysis: Analysis;
  tryOn: string | null;
  tryOnError: string | null;
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

function outfitRows(analysis: Analysis): { label: string; value: string }[] {
  const outfit = analysis.outfit as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];
  for (const [label, key] of SLOTS) {
    const value = outfit[key];
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
              borderRadius: radius.tile,
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

export function StyleResultScreen({ original, analysis, tryOn, tryOnError, onRestart }: Props) {
  const { width } = useWindowDimensions();
  // Screen gutters (24 x2) plus the card's own padding (12 x2).
  const frameWidth = width - space.lg * 2 - space.sm * 2;
  // Shopping state is local to this screen so App.tsx stays untouched.
  const [band, setBand] = React.useState<PriceBandId>(DEFAULT_BAND);

  React.useEffect(() => {
    let alive = true;
    void loadPriceBand().then((saved) => {
      if (alive) setBand(saved);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onChangeBand = React.useCallback((next: PriceBandId) => {
    setBand(next);
    void savePriceBand(next);
  }, []);

  // The outfit shape may gain fields, so the garment list is derived defensively.
  const garments = React.useMemo(() => garmentsFrom(analysis.outfit), [analysis.outfit]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}>
        <View>
          <Text style={type.caption}>Your season</Text>
          <Text style={[type.mega, { marginTop: 6 }]}>{analysis.season}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: space.sm, flexWrap: 'wrap' }}>
            <Chip label={analysis.undertone} tone="accent" />
            <Chip label={`${analysis.contrast} contrast`} />
          </View>
        </View>

        {/* The try-on renders behind the analysis so there is no dead air. */}
        <Card style={{ padding: space.sm }}>
          {tryOn ? (
            <Image
              source={{ uri: tryOn }}
              style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius.button }}
              resizeMode="cover"
            />
          ) : (
            <View>
              {tryOnError ? (
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 2 / 3,
                    borderRadius: radius.tile,
                    backgroundColor: color.surfaceHi,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={[type.bodyMuted, { textAlign: 'center', paddingHorizontal: space.lg }]}
                  >
                    {tryOnError}
                  </Text>
                </View>
              ) : (
                <>
                  <Shimmer width={frameWidth} height={frameWidth * 1.5} />
                  <Image
                    source={{ uri: original }}
                    style={{
                      position: 'absolute',
                      width: frameWidth,
                      height: frameWidth * 1.5,
                      borderRadius: radius.tile,
                      opacity: 0.18,
                    }}
                  />
                  <View style={{ position: 'absolute', bottom: space.md, left: 0, right: 0, alignItems: 'center' }}>
                    <Chip label="Dressing you" tone="accent" />
                  </View>
                </>
              )}
            </View>
          )}
        </Card>

        <Card hero>
          <Text style={type.caption}>The fit</Text>

          {outfitRows(analysis).map((row, i) => (
              <View
                key={row.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: space.md,
                  paddingVertical: space.sm,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: color.border,
                  marginTop: i === 0 ? space.sm : 0,
                }}
              >
                <Text
                  style={{
                    width: 62,
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: color.faint,
                    paddingTop: 3,
                  }}
                >
                  {row.label}
                </Text>
                <Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{row.value}</Text>
              </View>
            ))}

          <Text
            style={[
              type.bodyMuted,
              { fontSize: 14, marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: color.border },
            ]}
          >
            {analysis.outfit.why}
          </Text>
        </Card>

        <WhereToBuy garments={garments} band={band} onChangeBand={onChangeBand} />

        <Card>
          <Text style={[type.caption, { marginBottom: space.md }]}>Wear these</Text>
          <Swatches items={analysis.palette} />
          <Text style={[type.caption, { marginTop: space.lg, marginBottom: space.md }]}>Never these</Text>
          <Swatches items={analysis.avoid} />
        </Card>

        <GhostButton label="Try another photo" onPress={onRestart} />
      </ScrollView>
    </Screen>
  );
}
