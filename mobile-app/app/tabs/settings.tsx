import React from 'react';
import {
  ScrollView,
  View,
  Text,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import globalStyles from '../styles';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';
import LanguageSelector from '@/components/LanguageSelector';
import { authContextManager } from '@/services/auth/authContext';

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width <= 800;
  const styles = globalStyles(isPhone);

  let { lang } = useLanguage();
  let strings = translations[lang];

  const handleSignOut = async () => {
    await authContextManager.signOut();
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flex: 1 }}>
      <View style={[styles.screenContainer, { flex: 1, justifyContent: 'space-around' }]}>
        <Text style={styles.title}>{strings.settingsTab}</Text>
        <View style={[styles.boatCard]}>
          <Text style={styles.secondTitle}>{strings.changeLanguage}</Text>
          <LanguageSelector variant="big"></LanguageSelector>
        </View>

        <TouchableOpacity style={[styles.signOutButton]} onPress={handleSignOut}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>{strings.signOut}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
