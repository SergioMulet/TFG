import { View, Text, Button } from "react-native";
import globalStyles from "../styles";
import translations from "../i18n";
import useLanguage from "../language-context";


export default function Settings() {
  const {lang, setLang} = useLanguage();
  let strings = translations[lang];
  
  const changeLanguage = () => {
    const nextLanguage = lang === 'es' ? 'en' : 'es';
    setLang(nextLanguage);
  }

  return  (
    <View style = {globalStyles.screenContainer}>  
      <Button title = {strings.changeLanguage} onPress={changeLanguage}>
      </Button>
    </View>
  )
}

