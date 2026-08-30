import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Icon } from './Icon';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { ShopLink } from '../lib/shop';

interface Props {
  visible: boolean;
  title: string;
  links: ShopLink[];
  onPick: (url: string) => void;
  onClose: () => void;
}

/**
 * In-app sheet rather than a platform Alert.
 *
 * Android's Alert renders in the system theme — which on a dark-mode device is
 * a black dialog dropped into a light app — and offers no close affordance
 * beyond an unlabelled Cancel row. This keeps the app's own surface, ink and
 * corners, and gives the user an explicit dismiss.
 */
export function ShopSheet({ visible, title, links, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        <Animated.View
          entering={FadeInDown.duration(300).springify().damping(20)}
          style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={type.caption}>Shop this</Text>
              <Text style={[type.h2, { marginTop: 4 }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.5 }]}
            >
              <Icon name="close" size={18} color={color.ink} strokeWidth={2.4} />
            </Pressable>
          </View>

          {links.map((link, i) => (
            <Pressable
              key={link.retailer}
              accessibilityRole="link"
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                onPick(link.url);
              }}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.divider,
                pressed && { backgroundColor: color.surfaceHi },
              ]}
            >
              <Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{link.retailer}</Text>
              <Icon name="link" size={16} color={color.accent} strokeWidth={2.2} />
            </Pressable>
          ))}

          <Text style={[type.caption, { marginTop: space.md, textAlign: 'center' }]}>
            Opens a live search · prices shown by the retailer
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(23,20,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderColor: color.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.md },
  close: {
    width: 34,
    height: 34,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: space.sm,
    borderRadius: radius.tile,
  },
  divider: { borderTopWidth: 1, borderTopColor: color.border },
});
