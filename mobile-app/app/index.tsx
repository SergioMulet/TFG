import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from './styles';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.text} />
    </View>
  );
}