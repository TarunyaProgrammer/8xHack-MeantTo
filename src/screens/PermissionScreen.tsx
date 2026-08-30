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
        <Text style={type.display}>Fitted</Text>
        <Text style={[type.bodyMuted, { marginTop: space.xs }]}>
          Your colours, from your own photo.
        </Text>
      </View>

      {blocked ? (
        <>
          <Text style={[type.body, { color: color.muted, marginBottom: space.md }]}>
            Photo access is off. Turn it on to pick a photo.
          </Text>
          <GhostButton label="Open Settings" onPress={() => Linking.openSettings()} />
        </>
      ) : (
        <PrimaryButton label="Get started" onPress={onScan} />
      )}
    </Screen>
  );
}
