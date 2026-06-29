import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { toastService, ToastKey } from '@/services/toastService';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';
import { COLORS } from '@/app/styles';

const TOAST_VISIBLE_MS = 3000;

export default function ToastHost() {
  const { lang } = useLanguage();
  const strings = translations[lang];
  const [activeKey, setActiveKey] = useState<ToastKey | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => toastService.subscribe(setActiveKey), []);

  useEffect(() => {
    if (!activeKey) return;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setActiveKey(null),
      );
    }, TOAST_VISIBLE_MS);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [activeKey]);

  if (!activeKey) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{strings[activeKey]}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: COLORS.text,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 999,
    elevation: 6,
  },
  text: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
