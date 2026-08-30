import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, GhostButton, Icon, Screen } from '../components';
import type { IconName } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Item, ItemType, TYPE_LABEL } from '../types';
import { ActionOutcome } from '../lib/actions';

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
  outcomes: ActionOutcome[];
  totalValue: number;
  onRescan: () => void;
}

/** Renders only real extracted items. An empty pile renders as empty. */
export function ResultsScreen({ items, outcomes, totalValue, onRescan }: Props) {
  const found = items.filter((i) => i.type !== 'junk');
  const done = outcomes.reduce((sum, o) => sum + o.count, 0);

  return (
    <Screen>
      <Text style={[type.h1, { marginBottom: space.lg }]}>
        {done > 0 ? `${done} done.` : 'Nothing left.'}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {outcomes.length > 0 && (
          <Card style={{ padding: space.md, marginBottom: space.xs }}>
            {outcomes.map((outcome) => (
              <View
                key={outcome.key}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 }}
              >
                <Icon
                  name={outcome.error ? 'alert' : 'check'}
                  size={18}
                  color={outcome.error ? color.danger : color.success}
                />
                <Text style={[type.bodyMuted, { fontSize: 15, flex: 1 }]}>
                  {outcome.error ?? outcome.label}
                </Text>
              </View>
            ))}
            {totalValue > 0 && (
              <Text style={[type.bodyMuted, { fontSize: 14, marginTop: space.xs }]}>
                {Math.round(totalValue).toLocaleString()} of things you never bought.
              </Text>
            )}
          </Card>
        )}
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
