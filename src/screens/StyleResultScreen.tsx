import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Chip, Card, GhostButton, Screen } from '../components';
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

function Swatches({ items }: { items: { hex: string; name: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
        <View>
          <Text style={type.caption}>Your season</Text>
          <Text style={[type.mega, { marginTop: 6 }]}>{analysis.season.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: space.sm, flexWrap: 'wrap' }}>
            <Chip label={analysis.undertone} tone="accent" />
            <Chip label={`${analysis.contrast} contrast`} />
          </View>
        </View>

        {/* The try-on renders behind the analysis so there is no dead air. */}
        <Card style={{ padding: space.sm }}>
          {tryOn ? (
            <Image
              source={{ uri: `data:image/png;base64,${tryOn}` }}
              style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius.button }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius.button, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
              {tryOnError ? (
                <Text style={[type.bodyMuted, { textAlign: 'center', paddingHorizontal: space.lg }]}>
                  {tryOnError}
                </Text>
              ) : (
                <>
                  <ActivityIndicator color={color.accent} />
                  <Text style={[type.caption, { marginTop: space.sm }]}>Dressing you</Text>
                  <Image
                    source={{ uri: original }}
                    style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: radius.button, opacity: 0.12 }}
                  />
                </>
              )}
            </View>
          )}
        </Card>

        <Card hero>
          <Text style={type.caption}>The fit</Text>
          <Text style={[type.h1, { marginTop: 6 }]}>{analysis.outfit.top}</Text>
          {/* Read loosely: the analysis schema may gain or rename garment slots,
              and anything the try-on renders must also be named here. */}
          {(['bottom', 'shoes', 'outerwear', 'accessory'] as const)
            .map((slot) => (analysis.outfit as Record<string, unknown>)[slot])
            .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
            .map((line) => (
              <Text key={line} style={[type.body, { color: color.muted }]}>
                {line}
              </Text>
            ))}
          <Text style={[type.bodyMuted, { fontSize: 14, marginTop: space.sm }]}>
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
