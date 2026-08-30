import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, StyleSheet } from 'react-native';
import { Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';

interface Props {
  done: number;
  total: number;
}

export function ScanningScreen({ done, total }: Props) {
  const progress = total > 0 ? done / total : 0;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-220, 220] });

  return (
    <Screen center>
      <View style={{ alignItems: 'center' }}>
        {total > 0 && <Text style={type.number}>{done}</Text>}
        <Text style={[type.display, { textAlign: 'center' }]}>READING{'\n'}YOU</Text>

        <View style={styles.track}>
          {total > 0 ? (
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          ) : (
            <Animated.View style={[styles.sweep, { transform: [{ translateX }] }]} />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: {
    marginTop: space.xl,
    width: 220,
    height: 4,
    borderRadius: radius.chip,
    backgroundColor: color.border,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: radius.chip, backgroundColor: color.accent },
  sweep: { width: 90, height: 4, borderRadius: radius.chip, backgroundColor: color.accent },
});
