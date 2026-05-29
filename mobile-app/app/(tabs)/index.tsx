import { Text, View} from 'react-native';
import globalStyles from '../styles';
import useLanguage from '../language-context';
import translations from '../i18n';


export default function DashboardScreen(){
  let {lang} = useLanguage();
  let strings = translations[lang]

  return(
    <View style = {globalStyles.screenContainer}>
      <View style = {globalStyles.boatCard}>
        <Text style={globalStyles.boatTitle}>Victoria II</Text>
        <Text style={globalStyles.boatSubtitle}>MMSI: 244123456</Text>
      </View>

      <View style={globalStyles.statusBadge}>
        <Text style={globalStyles.statusText}>🔴 {strings.notTransmitting}</Text>
      </View>
    </View>
  )
}
