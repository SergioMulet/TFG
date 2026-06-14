import {
  Text,
  View,
  Switch,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import globalStyles, { COLORS } from "../styles";
import useLanguage from "../../internazionalization/language-context";
import translations from "../../internazionalization/i18n";

import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import LanguageSelector from "@/components/languageSelector";
import { useLocationTracker } from "@/hooks/use_location_tracker";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width <= 800;

  let { lang } = useLanguage();
  let strings = translations[lang];

  const { location, gpsActive, coordinatesType, toggleGPS } =
    useLocationTracker();

  const [boatName, setBoatName] = useState<string | null>(null);
  const styles = globalStyles(isPhone);

  const SHIP_TYPES = [
    { label: strings.cargo, value: "cargo" },
    { label: strings.tanker, value: "tanker" },
    { label: strings.cruise, value: "cruise" },
    { label: strings.fishing, value: "fishing" },
    { label: strings.yacht, value: "yacht" },
    { label: strings.military, value: "military" },
    { label: strings.tug, value: "tug" },
    { label: strings.boat, value: "boat" },
    { label: strings.other, value: "other" },
  ];
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <LanguageSelector></LanguageSelector>
        <View style={styles.boatCard}>
          <TextInput
            style={styles.title}
            value={boatName ?? ""}
            onChangeText={(text) => setBoatName(text)}
            placeholder={strings.boatName}
            placeholderTextColor={COLORS.placeholder}
            selectTextOnFocus={true}
          />
        </View>

        <Dropdown
          style={[
            styles.boatCard,
            isFocus && { borderColor: COLORS.text, borderWidth: 2 },
          ]}
          placeholder={strings.chooseType}
          placeholderStyle={styles.text}
          searchPlaceholderTextColor={COLORS.placeholder}
          containerStyle={styles.dropdownContainer}
          selectedTextStyle={styles.text}
          itemTextStyle={styles.text}
          data={SHIP_TYPES}
          onChange={(item) => setSelectedType(item)}
          labelField="label"
          valueField="value"
          value={selectedType}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
        ></Dropdown>

        {coordinatesType != null && (
          <View style={styles.boatCard}>
            <Text style={styles.secondTitle}>
              {coordinatesType === "current" ? strings.current : strings.last}
            </Text>
            <Text style={styles.text}>
              {strings.longitude}: {location?.coords.longitude}
            </Text>
            <Text style={styles.text}>
              {strings.latitude}: {location?.coords.latitude}
            </Text>
          </View>
        )}

        <View style={[styles.boatCard, { flexDirection: "row" }]}>
          <Text style={styles.text}>
            {gpsActive
              ? `🟢 ${strings.transmitting}`
              : `🔴 ${strings.notTransmitting}`}
          </Text>

          <Switch
            trackColor={{ false: "#D1D5DB", true: "#00e0b7" }}
            thumbColor={COLORS.background}
            onValueChange={(value) => toggleGPS(value, boatName || "Barco_Prueba", "sergiokma15@gmail.com")}
            value={gpsActive}
          />
        </View>
      </View>
    </ScrollView>
  );
}
