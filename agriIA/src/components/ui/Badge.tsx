import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

type BadgeVariant = 'info' | 'warning' | 'danger' | 'success' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  info:    { bg: 'rgba(52,152,219,0.15)',  text: Colors.light.info    },
  warning: { bg: 'rgba(245,166,35,0.15)',  text: Colors.light.warning },
  danger:  { bg: 'rgba(231,76,60,0.15)',   text: Colors.light.danger  },
  success: { bg: 'rgba(39,174,96,0.15)',   text: Colors.light.success },
  primary: { bg: 'rgba(60,185,90,0.15)',   text: Colors.light.primary },
};

export default function Badge({ label, variant = 'primary', style }: BadgeProps): React.JSX.Element {
  const { bg, text } = VARIANT_COLORS[variant];
  return (
    <View style={[s.badge, { backgroundColor: bg }, style]}>
      <Text style={[s.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});