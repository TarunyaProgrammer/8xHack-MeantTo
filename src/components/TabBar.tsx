import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { color, radius, space } from '../theme/tokens';

export type TabId = 'style' | 'looks' | 'you';

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'style', label: 'Style', icon: 'camera' },
  { id: 'looks', label: 'Looks', icon: 'link' },
  { id: 'you', label: 'You', icon: 'contact' },
];

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
}

function Tab({ tab, active, onPress }: { tab: (typeof TABS)[number]; active: boolean; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(active ? 1 : 0.94, { damping: 16, stiffness: 220 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={styles.tab}
    >
      <Animated.View style={[styles.inner, active && styles.innerActive, style]}>
        <Icon name={tab.icon} size={19} color={active ? color.surface : color.muted} strokeWidth={2} />
        {active && <Text style={styles.labelActive}>{tab.label}</Text>}
      </Animated.View>
    </Pressable>
  );
}

/**
 * A floating pill rather than a full-width bar. It keeps the warm ground
 * visible underneath, which is what stops the screen reading as a template.
 */
export function TabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((tab) => (
          <Tab key={tab.id} tab={tab} active={tab.id === active} onPress={() => onChange(tab.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
    padding: 6,
    gap: 4,
    shadowColor: '#4A3F2E',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: { borderRadius: radius.chip },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.chip,
  },
  innerActive: { backgroundColor: color.ink },
  labelActive: { fontSize: 14, fontWeight: '800', color: color.surface, letterSpacing: -0.2 },
});
