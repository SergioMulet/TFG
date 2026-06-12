import {
  Text,
  View,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import globalStyles, { COLORS } from "./styles";
import useLanguage from "./language-context";
import translations from "./i18n";

import * as Location from "expo-location";

import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width <= 800;

  let { lang, setLang } = useLanguage();
  let strings = translations[lang];

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [gpsActive, setGps] = useState<boolean>(false);
  const [coordinatesString, setCoordinatesString] = useState<string | null>(
    null,
  );

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

  const toggleGPS = async (isActive: boolean) => {
    if (isActive) {
      let currentPermission = await Location.getForegroundPermissionsAsync();
      let status = currentPermission.status;

      if (status !== "granted") {
        const answer = await Location.requestForegroundPermissionsAsync();
        status = answer.status;
      }

      if (status === "granted") {
        let currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentPosition);
        setGps(true);
        setCoordinatesString("Current");
      } else {
        setGps(false);
        setCoordinatesString("Last");
      }
    } else {
      setGps(false);
      setCoordinatesString("Last");
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <View style={styles.menuBar}>
          <TouchableOpacity
            onPress={() => setLang("es")}
            disabled={lang === "es"}
            style={{ opacity: lang === "es" ? 0.4 : 1 }}
          >
            <Text style={styles.flagEmoji}>🇪🇸</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLang("en")}
            disabled={lang === "en"}
            style={{ opacity: lang === "en" ? 0.4 : 1 }}
          >
            <Text style={styles.flagEmoji}>🇬🇧</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.boatCard}>
          <TextInput
            style={styles.boatTitle}
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
          placeholder = {strings.chooseType}
          placeholderStyle={styles.textInfo}
          searchPlaceholderTextColor={COLORS.placeholder}
          containerStyle={styles.dropdownContainer}
          selectedTextStyle = {styles.textInfo}
          itemTextStyle={styles.textInfo}
          data={SHIP_TYPES}
          onChange={(item) => setSelectedType(item)}
          labelField="label"
          valueField="value"
          value={selectedType}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
        ></Dropdown>

        {coordinatesString != null && (
          <View style={styles.boatCard}>
            <Text style={styles.coordinatesTitle}>
              {coordinatesString} coordinates
            </Text>
            <Text style={styles.textInfo}>
              Longitude: {location?.coords.longitude}
            </Text>
            <Text style={styles.textInfo}>
              Latitude: {location?.coords.latitude}
            </Text>
          </View>
        )}

        <View style={[styles.boatCard, { flexDirection: "row" }]}>
          <Text style={styles.textInfo}>
            {gpsActive
              ? `🟢 ${strings.transmitting}`
              : `🔴 ${strings.notTransmitting}`}
          </Text>

          <Switch
            trackColor={{ false: "#D1D5DB", true: "#00e0b7" }}
            thumbColor={COLORS.background}
            onValueChange={toggleGPS}
            value={gpsActive}
          />
        </View>
      </View>
    </ScrollView>
  );
}
