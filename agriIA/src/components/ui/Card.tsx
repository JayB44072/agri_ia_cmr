import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, useThemeColors } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat';
}

export default function Card({ children, style, variant = 'default' }: CardProps): React.JSX.Element {
  const { colors } = useThemeColors();

  return (
    <View style={[
      s.card,
      { backgroundColor: colors.card, borderColor: colors.cardBorder },
      variant === 'default' && Shadows.card,
      style,
    ]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
});