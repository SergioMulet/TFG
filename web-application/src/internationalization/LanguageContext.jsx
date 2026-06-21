import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const loadLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem('@user_language');
        if (savedLanguage === 'es' || savedLanguage === 'en') {
          setLang(savedLanguage);
        }
      } catch (error) {
        setLang('en');
      }
    };
    loadLanguage();
  }, []);

  const switchAndSaveLanguage = (newLanguage) => {
    try {
      setLang(newLanguage);
      localStorage.setItem('@user_language', newLanguage);
    } catch (error) {
      console.error('Error happened while saving language to disk:', error);
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
