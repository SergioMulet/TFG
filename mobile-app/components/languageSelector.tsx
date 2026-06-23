import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useLanguage from '../internazionalization/languageContext';
import translations from '@/internazionalization/i18n';
import { COLORS } from '@/app/styles';

interface LanguageSelectorProps {
  variant?: 'small' | 'big';
}

export default function LanguageSelector({ variant = 'small' }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  let strings = translations[lang];

  const isBig = variant === 'big';

  return (
    <View style={isBig ? styles.bigContainer : styles.smallContainer}>
      <TouchableOpacity
        onPress={() => setLang('es')}
        disabled={lang === 'es'}
        style={[{ opacity: lang === 'es' ? 0.4 : 1 }]}
      >
        <Text style={styles.flagEmoji}>🇪🇸</Text>
        {isBig && (
          <Text
            style={[
              styles.flagText,
              { textDecorationLine: lang === 'es' ? 'underline' : 'none' },
            ]}
          >
            {strings.spanish}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setLang('en')}
        disabled={lang === 'en'}
        style={{ opacity: lang === 'en' ? 0.4 : 1 }}
      >
        <Text style={styles.flagEmoji}>🇬🇧</Text>
        {isBig && (
          <Text
            style={[
              styles.flagText,
              { textDecorationLine: lang === 'en' ? 'underline' : 'none' },
            ]}
          >
            {strings.english}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },

  flagEmoji: {
    fontSize: 50,
  },

  bigContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  flagText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
