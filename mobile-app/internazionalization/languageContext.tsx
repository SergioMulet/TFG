import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  lang: 'es' | 'en';
  setLang: (lang: 'es' | 'en') => void;
}
const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {}
});

// global useState
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'es' | 'en'>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@user_language');
        if (savedLanguage === 'es' || savedLanguage === 'en') {
          setLang(savedLanguage);
        }
      } catch (error) {
        setLang('en') // if an error occurs while reading from the disk, just set it to english
      }
    };
    loadLanguage();
  }, []);

  const switchAndSaveLanguage = async (newLanguage: 'es' | 'en') => {
    try {
      setLang(newLanguage);
      await AsyncStorage.setItem('@user_language', newLanguage);
    } catch (error) {
      console.error("Error happened while saving language to disk:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchAndSaveLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

const useLanguage = () => useContext(LanguageContext);

export default useLanguage;