import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { GhostButton, Icon, PrimaryButton, Screen } from '../components';
import { color, gutter, radius, space } from '../theme/tokens';
import { type } from '../theme/type';

interface Props {
  /** Fires with a local file URI — the same shape the picker hands back. */
  onCapture: (uri: string) => void;
  onClose: () => void;
}

/**
 * Full-body camera. The preview sits in a rounded card on a white screen so it
 * reads like the rest of the app rather than a stock camera takeover.
 */
export function CameraScreen({ onCapture, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const capture = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || !ready || busy) return;

    setBusy(true);
    setError(null);
    // Haptics are cosmetic and missing on some devices — never let them eat the tap.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const photo = await camera.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        onCapture(photo.uri);
        return;
      }
      setError('That shot did not save. Try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not take that photo');
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture, ready]);

  // Permission is still being read from the OS.
  if (!permission) {
    return (
      <Screen center>
        <ActivityIndicator color={color.accent} />
      </Screen>
    );
  }

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <Screen center>
        <View style={{ alignItems: 'center', marginBottom: space.xl }}>
          <Icon name="camera" size={28} color={color.muted} />
          <Text style={[type.h1, { marginTop: space.md, textAlign: 'center' }]}>
            Camera is off
          </Text>
          <Text style={[type.bodyMuted, { marginTop: space.xs, textAlign: 'center' }]}>
            {blocked
              ? 'Turn camera access on in Settings to take a photo.'
              : 'Fitted needs the camera to take your photo.'}
          </Text>
        </View>

        {blocked ? (
          <GhostButton label="Open Settings" onPress={() => Linking.openSettings()} />
        ) : (
          <PrimaryButton
            label="Allow camera"
            onPress={() => {
              void requestPermission();
            }}
          />
        )}

        <GhostButton label="Back" onPress={onClose} style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md },
      ]}
    >
      <View style={styles.preview}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={() => setReady(true)}
          onMountError={() => setError('Camera could not start')}
        />

        <FramingGuide />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Icon name="close" size={20} color={color.ink} />
        </Pressable>
      </View>

      {error ? (
        <Text style={[type.body, styles.hint, { color: color.danger }]}>{error}</Text>
      ) : (
        <Text style={[type.caption, styles.hint]}>Head to feet</Text>
      )}

      <View style={styles.bar}>
        <View style={styles.slot} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          disabled={!ready || busy}
          onPress={() => void capture()}
          style={({ pressed }) => [styles.shutter, pressed && styles.pressed]}
        >
          <View style={[styles.shutterCore, (!ready || busy) && styles.shutterInactive]}>
            {busy ? <ActivityIndicator color={color.bg} /> : null}
          </View>
        </Pressable>

        <View style={styles.slot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            style={({ pressed }) => [styles.flip, pressed && styles.pressed]}
          >
            <Icon name="flip" size={22} color={color.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Head-to-feet guide. Deliberately faint — it should suggest the crop, not
 * fight the person in the frame.
 */
function FramingGuide() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none">
        <Rect
          x={22}
          y={12}
          width={56}
          height={176}
          rx={8}
          ry={8}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.55}
          strokeWidth={1}
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>

      <View style={styles.figure}>
        <Svg width="100%" height="100%" viewBox="0 0 40 120">
          <Circle
            cx={20}
            cy={12}
            r={7}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.3}
            strokeWidth={1.4}
          />
          <Path
            d="M20 19v40M20 26 7 40M20 26l13 14M20 59 11 112M20 59l9 53"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.3}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: gutter,
  },
  preview: {
    flex: 1,
    borderRadius: radius.card,
    backgroundColor: color.ink,
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    width: 40,
    height: 40,
    borderRadius: radius.chip,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    position: 'absolute',
    top: '12%',
    bottom: '10%',
    left: '34%',
    right: '34%',
  },
  hint: {
    marginTop: space.md,
    textAlign: 'center',
  },
  bar: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slot: {
    width: 52,
    alignItems: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 62,
    height: 62,
    borderRadius: radius.chip,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInactive: { backgroundColor: color.border },
  flip: {
    width: 52,
    height: 52,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
