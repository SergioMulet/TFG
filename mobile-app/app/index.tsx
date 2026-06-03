import { Text, View, Switch, TouchableOpacity, TextInput } from "react-native";
import globalStyles, { COLORS } from "./styles";
import useLanguage from "./language-context";
import translations from "./i18n";

import * as Location from "expo-location";

import { useState } from "react";

export default function DashboardScreen() {
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
    <View style={globalStyles.screenContainer}>
      <View style={globalStyles.menuBar}>
        <TouchableOpacity
          onPress={() => setLang("es")}
          disabled={lang === "es"}
          style={{ opacity: lang === "es" ? 0.4 : 1 }}
        >
          <Text style={globalStyles.flagEmoji}>🇪🇸</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setLang("en")}
          disabled={lang === "en"}
          style={{ opacity: lang === "en" ? 0.4 : 1 }}
        >
          <Text style={globalStyles.flagEmoji}>🇬🇧</Text>
        </TouchableOpacity>
      </View>

      <View style={[globalStyles.boatCard, { marginBottom: "40%" }]}>
        <TextInput
          style={globalStyles.boatTitle}
          value={boatName ?? ""}
          onChangeText={(text) => setBoatName(text)}
          placeholder={strings.boatName}
          placeholderTextColor={COLORS.placeholder}
          selectTextOnFocus={true}
        />
      </View>

      {coordinatesString != null && (
        <View style={globalStyles.boatCard}>
          <Text style={globalStyles.coordinatesTitle}>
            {coordinatesString} coordinates
          </Text>
          <Text style={globalStyles.textInfo}>
            Longitude: {location?.coords.longitude}
          </Text>
          <Text style={globalStyles.textInfo}>
            Latitude: {location?.coords.latitude}
          </Text>
        </View>
      )}

      <View style={[globalStyles.boatCard, { flexDirection: "row" }]}>
        <Text style={globalStyles.textInfo}>
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
  );
}
