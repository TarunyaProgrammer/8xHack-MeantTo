import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { Screen } from './src/components';
import { type } from './src/theme/type';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Screen center>
        <Text style={type.display}>Meant To</Text>
        <Text style={[type.bodyMuted, { marginTop: 8 }]}>
          Your screenshots are a to-do list.
        </Text>
      </Screen>
    </SafeAreaProvider>
  );
}
