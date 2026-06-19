import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/theme';

interface ErrorBoxProps {
  message: string;
}

export default function ErrorBox({ message }: ErrorBoxProps): React.JSX.Element | null {
  if (!message) return null;
  return (
    <View style={s.errorBox}>
      <Ionicons name="warning-outline" size={14} color="#e74c3c" style={{ marginRight: 6 }} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.08)', borderRadius: Radius.md,
    padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(231,76,60,0.25)',
  },
  errorText: { fontSize: 12, color: '#e74c3c', fontWeight: '500', flex: 1 },
});
