import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from './../styles';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';
import { locationTracker } from '@/services/location/locationTracker';

export default function TabsLayout() {
  let { lang } = useLanguage();
  let strings = translations[lang];

  // Settings is only available while tracking is off; while it's on, the
  // user can just toggle it from Home.
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    return locationTracker.subscribeToState(setIsTracking);
  }, []);

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
        name="home"
        options={{
          title: strings.boatTab,
          tabBarIcon: ({ color, size }) => (
            <Fontisto name="ship" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: strings.settingsTab,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="ship-wheel"
              size={size}
              color={isTracking ? COLORS.placeholder : color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (isTracking) {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen name="newShip" options={{ href: null }} />
    </Tabs>
  );
}
