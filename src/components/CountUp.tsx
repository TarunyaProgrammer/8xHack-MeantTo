import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface Props {
  value: number;
  duration?: number;
  delay?: number;
  style?: TextStyle | TextStyle[];
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to a real value. The target always comes from the scan — this
 * animates a number, it never invents one.
 */
export function CountUp({ value, duration = 700, delay = 0, style }: Props) {
  const [shown, setShown] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (elapsed < delay) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((elapsed - delay) / duration, 1);
      setShown(Math.round(easeOut(progress) * value));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, delay]);

  return <Text style={style}>{shown}</Text>;
}
