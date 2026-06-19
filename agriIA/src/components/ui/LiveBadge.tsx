import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LiveBadgeProps {
  color: string;
}

export default function LiveBadge({ color }: LiveBadgeProps): React.JSX.Element {
  return (
    <View style={[s.badge, { backgroundColor: `${color}15` }]}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.text, { color }]}>LIVE</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  text:  { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
