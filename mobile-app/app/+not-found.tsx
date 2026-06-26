import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';

export default function NotFoundScreen() {
  const { lang } = useLanguage();
  const strings = translations[lang];

  return (
    <>
      <Stack.Screen options={{ title: strings.notFoundTitle }} />
      <View style={styles.container}>
        <Text style={styles.title}>{strings.notFoundMessage}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{strings.goToHome}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
