import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface HaloConfig {
  size: number;
  opacity: number;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
}

function Halo({ size, opacity, top, bottom, left, right }: HaloConfig): React.JSX.Element {
  const style: ViewStyle = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: `rgba(60,185,90,${opacity})`,
  };
  if (top !== undefined)    (style as Record<string, unknown>).top = top;
  if (bottom !== undefined) (style as Record<string, unknown>).bottom = bottom;
  if (left !== undefined)   (style as Record<string, unknown>).left = left;
  if (right !== undefined)  (style as Record<string, unknown>).right = right;
  return <View style={style} />;
}

const LOGIN_HALOS: HaloConfig[] = [
  { size: 320, opacity: 0.09, top: -140, left: -100 },
  { size: 200, opacity: 0.07, top: -60,  right: -60 },
  { size: 260, opacity: 0.08, bottom: -100, right: -80 },
  { size: 160, opacity: 0.06, bottom: 60,  left: -60 },
  { size: 120, opacity: 0.05, top: '42%', right: -30 },
];

const REGISTER_HALOS: HaloConfig[] = [
  { size: 300, opacity: 0.09, top: -120, right: -80 },
  { size: 180, opacity: 0.07, top: 30,   left: -70 },
  { size: 140, opacity: 0.05, top: '35%', left: -50 },
  { size: 110, opacity: 0.05, top: '55%', right: -35 },
  { size: 250, opacity: 0.08, bottom: -90, right: -70 },
  { size: 130, opacity: 0.05, bottom: 100, left: -45 },
];

export function AuthBackground({ variant }: { variant: 'login' | 'register' }): React.JSX.Element {
  const halos = variant === 'login' ? LOGIN_HALOS : REGISTER_HALOS;
  return (
    <>
      {halos.map((h, i) => (
        <Halo key={i} {...h} />
      ))}
    </>
  );
}
