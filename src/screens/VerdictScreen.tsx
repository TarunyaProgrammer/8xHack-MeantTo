import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, CountUp, PrimaryButton, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { ItemType } from '../types';
import { verdictRows } from '../lib/verdict';

interface Props {
  totalScreenshots: number;
  counts: Record<ItemType, number>;
  verdictLine: string;
  actionable: number;
  onFix: () => void;
}

/**
 * Every number here is computed from the real scan. Nothing on this screen is
 * hardcoded — that is the entire premise of the product.
 */
export function VerdictScreen({
  totalScreenshots,
  counts,
  verdictLine,
  actionable,
  onFix,
}: Props) {
  const rows = verdictRows(counts);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: space.xl }}>
          <Card>
            <View style={{ alignItems: 'center', marginBottom: space.lg }}>
              <CountUp value={totalScreenshots} style={type.number} />
              <Text style={type.caption}>Screenshots</Text>
            </View>

            {rows.map((row, i) => (
              <View
                key={row.type}
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingVertical: 5 }}
              >
                <CountUp
                  value={row.count}
                  delay={120 + i * 90}
                  style={{ fontSize: 20, fontWeight: '700', color: color.ink, minWidth: 46 }}
                />
                <Text style={{ fontSize: 16, color: color.muted, flex: 1 }}>{row.label}</Text>
              </View>
            ))}

            {verdictLine ? (
              <Text style={[type.h1, { marginTop: space.lg }]}>{verdictLine}</Text>
            ) : null}
          </Card>
        </View>
      </ScrollView>

      <PrimaryButton label="Fix it" onPress={onFix} disabled={actionable === 0} />
    </Screen>
  );
}
