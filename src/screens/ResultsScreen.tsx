import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, GhostButton, Icon, Screen } from '../components';
import type { IconName } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Item, ItemType, TYPE_LABEL } from '../types';

const ICONS: Record<Exclude<ItemType, 'junk'>, IconName> = {
  contact: 'contact',
  event: 'calendar',
  wifi: 'wifi',
  place: 'place',
  link: 'link',
  reply_owed: 'message',
};

function title(item: Item): string {
  const p = item.payload;
  return p.name || p.title || p.ssid || p.person || p.url || TYPE_LABEL[item.type];
}

interface Props {
  items: Item[];
  onRescan: () => void;
}

/** Renders only real extracted items. An empty pile renders as empty. */
export function ResultsScreen({ items, onRescan }: Props) {
  const found = items.filter((i) => i.type !== 'junk');

  return (
    <Screen>
      <Text style={[type.h1, { marginBottom: space.lg }]}>
        {found.length > 0 ? 'What we found' : 'Nothing left.'}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {found.map((item) => (
          <Card key={item.id} style={{ padding: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name={ICONS[item.type as Exclude<ItemType, 'junk'>]} color={color.accent} />
              <Text style={[type.body, { flex: 1, fontWeight: '600' }]} numberOfLines={1}>
                {title(item)}
              </Text>
            </View>
            {item.roastLine ? (
              <Text style={[type.bodyMuted, { fontSize: 14, marginTop: 6 }]}>{item.roastLine}</Text>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      <GhostButton label="Scan again" onPress={onRescan} style={{ marginTop: space.md }} />
    </Screen>
  );
}
