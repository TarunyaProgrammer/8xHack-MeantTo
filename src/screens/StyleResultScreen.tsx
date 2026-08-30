import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Card, GhostButton, Screen } from '../components';
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
        <View key={c.hex + c.name} style={{ alignItems: 'center', width: 62 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.chip,
              backgroundColor: c.hex,
              borderWidth: 1,
              borderColor: color.border,
            }}
          />
          <Text style={{ fontSize: 11, color: color.muted, marginTop: 4 }} numberOfLines={2}>
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
          <Text style={type.display}>{analysis.season}</Text>
          <Text style={type.bodyMuted}>
            {analysis.undertone} · {analysis.contrast} contrast
          </Text>
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

        <Card>
          <Text style={type.h2}>{analysis.outfit.top}</Text>
          <Text style={[type.body, { color: color.muted }]}>{analysis.outfit.bottom}</Text>
          <Text style={[type.body, { color: color.muted }]}>{analysis.outfit.shoes}</Text>
          <Text style={[type.bodyMuted, { fontSize: 14, marginTop: space.sm }]}>
            {analysis.outfit.why}
          </Text>
        </Card>

        <WhereToBuy garments={garments} band={band} onChangeBand={onChangeBand} />

        <Card>
          <Text style={[type.caption, { marginBottom: space.sm }]}>Your colours</Text>
          <Swatches items={analysis.palette} />
          <Text style={[type.caption, { marginTop: space.md, marginBottom: space.sm }]}>Avoid</Text>
          <Swatches items={analysis.avoid} />
        </Card>

        <GhostButton label="Try another photo" onPress={onRestart} />
      </ScrollView>
    </Screen>
  );
}
