import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabaseClient';
import { authContextManager } from '@/services/auth/auth.context';
import { EmailStrategy } from '@/services/auth/strategies/email_auth';
import { GoogleStrategy } from '@/services/auth/strategies/google_auth';

export function useAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // get token from web, probably not needed since the application is intended to be used in mobile applications
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebRedirect = async () => {
        if (window.location.hash.includes('access_token')) {
          const hashString = window.location.hash.substring(1);
          const params = new URLSearchParams(hashString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            try {
              setGoogleLoading(true);
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) throw error;
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo validar la sesión web.');
            }
          }
        }
        setGoogleLoading(false);
      };

      handleWebRedirect();

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session) setGoogleLoading(false);
        },
      );

      return () => authListener.subscription.unsubscribe();
    }
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    setLoading(true);
    try {
      authContextManager.setStrategy(new EmailStrategy());

      const result = await authContextManager.executeAuth({
        email,
        password,
        isRegistering,
      });

      if (!result.success) {
        throw result.error;
      }

      if (isRegistering) {
        Alert.alert(
          '¡Cuenta creada!',
          'Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada.',
        );
        setIsRegistering(false);
      }
    } catch (error: any) {
      Alert.alert(isRegistering ? 'Error de Registro' : 'Error de Login', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      authContextManager.setStrategy(new GoogleStrategy());

      const result = await authContextManager.executeAuth();

      if (!result.success) {
        throw result.error;
      }

      if (Platform.OS !== 'web' && result.url) {
        const redirectUrl = GoogleStrategy.getRedirectUrl();
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.url,
          redirectUrl,
          // Force Chrome on Android: some OEM browsers (e.g. Samsung Internet)
          // mishandle the Google sign-in flow and fire a stray mailto: intent to Gmail.
          Platform.OS === 'android' ? { browserPackage: 'com.android.chrome' } : undefined,
        );

        if (browserResult.type === 'success' && browserResult.url) {
          const hashString = browserResult.url.split('#')[1];
          const params = new URLSearchParams(hashString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: errorSession } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (errorSession) throw errorSession;
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('A problem occurred when connecting with Google');
    } finally {
      if (Platform.OS !== 'web') {
        setGoogleLoading(false);
      }
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    googleLoading,
    isRegistering,
    setIsRegistering,
    handleGoogleLogin,
    handleAuth,
  };
}
