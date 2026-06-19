import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export function useFlash(value: number | string): Animated.Value {
  const anim = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);
  return anim;
}

export function LiveValue({ value, style, suffix }: {
  value: number | string; style: object; suffix?: string;
}): React.JSX.Element {
  const opacity = useFlash(value);
  return (
    <Animated.Text style={[style, { opacity }]}>
      {value}{suffix ?? ''}
    </Animated.Text>
  );
}
