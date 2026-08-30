import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Chip, GhostButton, PrimaryButton, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { PermissionState } from '../lib/screenshots';

interface Props {
  permission: PermissionState;
  onScan: () => void;
  /** Camera works without library access, so denial must not be a dead end. */
  onCamera: () => void;
}

export function PermissionScreen({ permission, onScan, onCamera }: Props) {
  const blocked = permission === 'denied';

  return (
    <Screen center>
      <View style={{ marginBottom: space.xxl }}>
        <Chip label="Colour · Fit · Try-on" tone="accent" />
        <Text style={[type.mega, { marginTop: space.md }]}>YOUR{'\n'}COLOURS</Text>
        <Text style={[type.body, { color: color.muted, marginTop: space.md }]}>
          One photo. Real answers.
        </Text>
      </View>

      {blocked ? (
        <>
          <Text style={[type.bodyMuted, { marginBottom: space.md }]}>Photo access is off.</Text>
          <PrimaryButton label="Take a photo instead" onPress={onCamera} />
          <GhostButton
            label="Open Settings"
            onPress={() => Linking.openSettings()}
            style={{ marginTop: space.sm }}
          />
        </>
      ) : (
        <PrimaryButton label="Start" onPress={onScan} />
      )}
    </Screen>
  );
}
