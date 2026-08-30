import React from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Card, Chip, Reveal, Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Look } from '../lib/looks';

interface Props {
  looks: Look[];
  onOpen: (look: Look) => void;
  onStart: () => void;
}

/** Only real saved looks. An empty history renders as empty. */
export function LooksScreen({ looks, onOpen, onStart }: Props) {
  const { width } = useWindowDimensions();
  const tile = (width - space.lg * 2 - space.sm) / 2;

  return (
    <Screen tabSafe>
      <Text style={type.caption}>Your history</Text>
      <Text style={[type.display, { marginTop: 6, marginBottom: space.lg }]}>LOOKS</Text>

      {looks.length === 0 ? (
        <Card style={{ alignItems: 'flex-start' }}>
          <Text style={type.h2}>Nothing yet.</Text>
          <Text style={[type.bodyMuted, { marginTop: 6 }]}>
            Style a photo and it lands here.
          </Text>
          <Pressable onPress={onStart} style={{ marginTop: space.md }}>
            <Chip label="Start" tone="accent" />
          </Pressable>
        </Card>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {looks.map((look, i) => (
              <Reveal key={look.id} index={i}>
                <Pressable onPress={() => onOpen(look)}>
                  <Image
                    source={{
                      uri: look.tryOn ?? look.photo,
                    }}
                    style={{
                      width: tile,
                      height: tile * 1.4,
                      borderRadius: radius.tile,
                      backgroundColor: color.surfaceHi,
                    }}
                  />
                  <Text style={[type.caption, { marginTop: space.xs }]} numberOfLines={1}>
                    {look.analysis.season}
                  </Text>
                </Pressable>
              </Reveal>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
