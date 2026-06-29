import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SvgUri } from 'react-native-svg';
import globalStyles, { COLORS } from './styles';
import useLanguage from '../internazionalization/languageContext';
import translations from '../internazionalization/i18n';
import { useAuthForm } from '@/hooks/auth_form';
import LanguageSelector from '@/components/languageSelector';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { lang } = useLanguage();
  const strings = translations[lang];
  const styles = globalStyles();

  const {
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
    accountAlreadyExists,
  } = useAuthForm();

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <LanguageSelector></LanguageSelector>
        <Text style={styles.title}>
          {isRegistering ? strings.createAccount : strings.login}
        </Text>
        <Text style={[styles.text, { marginTop: '1%' }]}>
          {isRegistering ? strings.registerTo : strings.loginTo}
        </Text>

        {/* Google button */}
        <TouchableOpacity
          style={[styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <SvgUri
                width="24"
                height="24"
                uri="https://www.vectorlogo.zone/logos/google/google-icon.svg"
              />
              <Text style={styles.googleText}>{strings.google}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>{strings.or}</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* email and password*/}
        <View style={[styles.loginCards, showEmailError && styles.errorBorder]}>
          <TextInput
            style={[styles.text, { textAlign: 'center' }]}
            placeholder={strings.email}
            placeholderTextColor={COLORS.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={[styles.loginCards, showPasswordError && styles.errorBorder]}>
          <TextInput
            style={[styles.text, { textAlign: 'center' }]}
            placeholder={strings.password}
            placeholderTextColor={COLORS.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />
        </View>

        {accountAlreadyExists && (
          <Text style={[styles.text, { color: COLORS.red, textAlign: 'center' }]}>
            {strings.accountAlreadyExists}
          </Text>
        )}

        {/* Login/Sign in button */}
        <TouchableOpacity
          style={[styles.loginButton]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={[styles.text, { color: COLORS.background, fontWeight: 'bold' }]}>
              {isRegistering ? strings.register : strings.login}
            </Text>
          )}
        </TouchableOpacity>

        {/* change between login and signin*/}
        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
          <Text style={styles.loginText}>
            {isRegistering ? strings.hasAccount : strings.hasNotAccount}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
