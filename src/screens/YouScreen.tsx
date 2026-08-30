import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Chip, Reveal, Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Look } from '../lib/looks';

interface Props {
  onBack: () => void;
  looks: Look[];
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[type.h1, { color: color.accent }]}>{value}</Text>
      <Text style={[type.caption, { marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

/**
 * Everything here is derived from real saved looks. With no history the screen
 * says so rather than inventing a profile.
 */
export function YouScreen({ looks, onBack }: Props) {
  const latest = looks[0];

  const seasonCounts = looks.reduce<Record<string, number>>((acc, l) => {
    acc[l.analysis.season] = (acc[l.analysis.season] ?? 0) + 1;
    return acc;
  }, {});
  const topSeason = Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={type.caption}>Profile</Text>
          <Pressable onPress={onBack} hitSlop={10}>
            <Chip label="Back" />
          </Pressable>
        </View>
          <Text style={[type.display, { marginTop: 6 }]}>You</Text>
        </View>

        {!latest ? (
          <Card>
            <Text style={type.h2}>No profile yet.</Text>
            <Text style={[type.bodyMuted, { marginTop: 6 }]}>
              Style one photo and this fills in.
            </Text>
          </Card>
        ) : (
          <>
            <Reveal index={0}>
              <Card hero>
                <Text style={type.caption}>Your season</Text>
                <Text style={[type.h1, { marginTop: 6 }]}>{topSeason}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: space.sm, flexWrap: 'wrap' }}>
                  <Chip label={latest.analysis.undertone} tone="accent" />
                  <Chip label={`${latest.analysis.contrast} contrast`} />
                </View>
              </Card>
            </Reveal>

            <Reveal index={1}>
              <Card>
                <View style={{ flexDirection: 'row', gap: space.md }}>
                  <Stat value={looks.length} label="Looks" />
                  <Stat value={Object.keys(seasonCounts).length} label="Seasons" />
                  <Stat
                    value={looks.filter((l) => l.tryOn).length}
                    label="Try-ons"
                  />
                </View>
              </Card>
            </Reveal>

            <Reveal index={2}>
              <Card>
                <Text style={[type.caption, { marginBottom: space.md }]}>Your palette</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {latest.analysis.palette.map((c) => (
                    <View
                      key={c.hex + c.name}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: radius.thumb,
                        backgroundColor: c.hex,
                        borderWidth: 1,
                        borderColor: color.border,
                      }}
                    />
                  ))}
                </View>
              </Card>
            </Reveal>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
