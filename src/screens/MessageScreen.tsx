import React from 'react';
import { Text, View } from 'react-native';
import { GhostButton, Icon, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';

interface Props {
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}

/** Shared surface for the genuinely-empty and the failed-loudly states. */
export function MessageScreen({ title, detail, actionLabel, onAction, tone = 'neutral' }: Props) {
  return (
    <Screen center>
      <View style={{ alignItems: 'center' }}>
        {tone === 'error' && <Icon name="alert" size={28} color={color.danger} />}
        <Text style={[type.h1, { marginTop: space.md, textAlign: 'center' }]}>{title}</Text>
        {detail ? (
          <Text style={[type.bodyMuted, { marginTop: space.xs, textAlign: 'center' }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <GhostButton label={actionLabel} onPress={onAction} style={{ marginTop: space.xl }} />
      ) : null}
    </Screen>
  );
}
