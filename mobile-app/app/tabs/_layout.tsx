import React from 'react';
import { Tabs } from 'expo-router';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from './../styles';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';

export default function TabsLayout() {
  let { lang } = useLanguage();
  let strings = translations[lang];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.placeholder,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: strings.boatTab,
          tabBarIcon: ({ color, size }) => (
            <Fontisto name="ship" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: strings.settingsTab,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ship-wheel" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
