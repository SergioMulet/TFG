import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabaseClient';
import { authContextManager } from '@/services/auth/authContext';
import { EmailStrategy } from '@/services/auth/strategies/emailAuthStrategy';
import { GoogleStrategy } from '@/services/auth/strategies/googleAuthStrategy';
import { useAutoDismiss } from '@/hooks/use_auto_dismiss';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';

export function useAuthForm() {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  useAutoDismiss(showEmailError, setShowEmailError);
  useAutoDismiss(showPasswordError, setShowPasswordError);

  useEffect(() => {
    setShowEmailError(false);
    setAuthErrorMessage(null);
  }, [email]);
  useEffect(() => {
    setShowPasswordError(false);
    setAuthErrorMessage(null);
  }, [password]);

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
      if (!email) setShowEmailError(true);
      if (!password) setShowPasswordError(true);
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
        setShowEmailError(true);
        setShowPasswordError(true);
        if (result.accountExists) {
          setAuthErrorMessage(strings.accountAlreadyExists);
        }
        return;
      }

      if (isRegistering) {
        Alert.alert(
          '¡Cuenta creada!',
          'Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada.',
        );
        setIsRegistering(false);
      }
    } catch (error: any) {
      setShowEmailError(true);
      setShowPasswordError(true);
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
          Platform.OS === 'android'
            ? { browserPackage: 'com.android.chrome' }
            : undefined,
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
    showEmailError,
    showPasswordError,
    authErrorMessage,
  };
}
