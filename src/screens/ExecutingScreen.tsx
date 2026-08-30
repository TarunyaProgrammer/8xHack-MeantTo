import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { ActionOutcome, ActionStep, formatLabel } from '../lib/actions';

/** Minimum time a row stays on screen. The cascade has to be readable. */
const STEP_PACING = 180;

interface Props {
  steps: ActionStep[];
  onDone: (outcomes: ActionOutcome[]) => void;
}

export function ExecutingScreen({ steps, onDone }: Props) {
  const [outcomes, setOutcomes] = useState<ActionOutcome[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const collected: ActionOutcome[] = [];

      for (const step of steps) {
        const began = Date.now();
        let outcome: ActionOutcome;

        try {
          const count = await step.run();
          outcome = { key: step.key, label: formatLabel(step, count), count, error: null };
        } catch (err) {
          outcome = {
            key: step.key,
            label: formatLabel(step, 0),
            count: 0,
            error: err instanceof Error ? err.message : 'Failed',
          };
        }

        const elapsed = Date.now() - began;
        if (elapsed < STEP_PACING) {
          await new Promise((r) => setTimeout(r, STEP_PACING - elapsed));
        }

        collected.push(outcome);
        setOutcomes([...collected]);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await new Promise((r) => setTimeout(r, 600));
      onDone(collected);
    })();
  }, [steps, onDone]);

  return (
    <Screen center>
      <View style={{ gap: space.md }}>
        {outcomes.map((outcome) => (
          <Animated.View
            key={outcome.key}
            entering={FadeInDown.duration(220)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
          >
            <Animated.View entering={ZoomIn.delay(60).duration(200)}>
              <Icon
                name={outcome.error ? 'alert' : 'check'}
                size={22}
                color={outcome.error ? color.danger : color.success}
              />
            </Animated.View>
            <Text style={[type.body, outcome.error ? { color: color.muted } : null]}>
              {outcome.error ? `${outcome.error}` : outcome.label}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}
