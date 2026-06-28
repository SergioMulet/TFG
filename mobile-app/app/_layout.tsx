import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import '@/hooks/location/background_location_task';
import { LanguageProvider } from '../internazionalization/languageContext';
import { SelectedShipProvider } from '../hooks/selectedShipContext';
import { supabase } from '../supabaseClient';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  // listen to supabase state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const inTabsGroup = segments[0] === 'tabs';
    const inLoginScreen = segments[0] === 'login';

    const timer = setTimeout(() => {
      if (!session && inTabsGroup) {
        router.replace('/login');
      } else if (session && !inTabsGroup) {
        router.replace('/tabs/home');
      } else if (!session && !inTabsGroup && !inLoginScreen) {
        router.replace('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [session, authLoading, segments]);

  return (
    <LanguageProvider>
      <SelectedShipProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Slot />
        </ThemeProvider>
      </SelectedShipProvider>
    </LanguageProvider>
  );
}
