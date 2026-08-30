import React from 'react';
import { Linking, Text, View } from 'react-native';
import { PrimaryButton, GhostButton, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { PermissionState } from '../lib/screenshots';

interface Props {
  permission: PermissionState;
  onScan: () => void;
}

export function PermissionScreen({ permission, onScan }: Props) {
  const blocked = permission === 'denied';

  return (
    <Screen center>
      <View style={{ marginBottom: space.xxl }}>
        <Text style={type.display}>Meant To</Text>
        <Text style={[type.bodyMuted, { marginTop: space.xs }]}>
          Your screenshots are a to-do list.
        </Text>
      </View>

      {blocked ? (
        <>
          <Text style={[type.body, { color: color.muted, marginBottom: space.md }]}>
            Photo access is off. Turn it on to read your Screenshots album.
          </Text>
          <GhostButton label="Open Settings" onPress={() => Linking.openSettings()} />
        </>
      ) : (
        <PrimaryButton label="Scan my phone" onPress={onScan} />
      )}
    </Screen>
  );
}
