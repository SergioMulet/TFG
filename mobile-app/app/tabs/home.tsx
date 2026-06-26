import {
  Text,
  View,
  Switch,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import globalStyles, { COLORS } from '../styles';
import useLanguage from '../../internazionalization/languageContext';
import translations from '../../internazionalization/i18n';

import { useEffect, useState } from 'react';
import LanguageSelector from '@/components/languageSelector';
import OwnershipVerificationModal from '@/components/ownershipVerificationModal';
import { useLocationTracker } from '@/hooks/location/use_location_tracker';
import { supabase } from '@/supabaseClient';
import { mainServerService } from '@/services/mainServerService';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width <= 800;

  let { lang } = useLanguage();
  let strings = translations[lang];

  const { location, gpsActive, toggleGPS } = useLocationTracker();
  const coordinatesType = gpsActive ? 'current' : location ? 'last' : null;

  const [shipId, setShipId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const styles = globalStyles(isPhone);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    mainServerService.getShipName(userEmail).then((name) => {
      if (name) setShipId(name);
    });
  }, [userEmail]);

  const SHIP_TYPES = [
    { label: strings.cargo, value: 'cargo' },
    { label: strings.tanker, value: 'tanker' },
    { label: strings.cruise, value: 'cruise' },
    { label: strings.fishing, value: 'fishing' },
    { label: strings.yacht, value: 'yacht' },
    { label: strings.military, value: 'military' },
    { label: strings.tug, value: 'tug' },
    { label: strings.boat, value: 'boat' },
    { label: strings.other, value: 'other' },
  ];
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);

  const enableTracking = () => {
    if (!userEmail) return;
    toggleGPS(true, shipId || 'Barco_Prueba', userEmail, selectedType || 'other');
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <LanguageSelector></LanguageSelector>
        <View style={styles.boatCard}>
          <TextInput
            style={styles.title}
            value={shipId ?? ''}
            onChangeText={(text) => setShipId(text)}
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
              {coordinatesType === 'current' ? strings.current : strings.last}
            </Text>
            <Text style={styles.text}>
              {strings.longitude}: {location?.coords.longitude}
            </Text>
            <Text style={styles.text}>
              {strings.latitude}: {location?.coords.latitude}
            </Text>
          </View>
        )}

        <View style={[styles.boatCard, { flexDirection: 'row' }]}>
          <Text style={styles.text}>
            {gpsActive ? `🟢 ${strings.transmitting}` : `🔴 ${strings.notTransmitting}`}
          </Text>

          <Switch
            trackColor={{ false: '#D1D5DB', true: '#00e0b7' }}
            thumbColor={COLORS.background}
            onValueChange={(value) => {
              if (!userEmail) {
                console.warn('No authenticated user email available, cannot toggle GPS');
                return;
              }

              if (!value) {
                toggleGPS(
                  false,
                  shipId || 'Barco_Prueba',
                  userEmail,
                  selectedType || 'other',
                );
                return;
              }

              mainServerService
                .isShipRegistered(shipId || 'Barco_Prueba', userEmail)
                .then((registered) => {
                  if (registered) {
                    enableTracking();
                  } else {
                    setShowOwnershipModal(true);
                  }
                });
            }}
            value={gpsActive}
          />
        </View>
      </View>

      <OwnershipVerificationModal
        visible={showOwnershipModal}
        shipId={shipId || 'Barco_Prueba'}
        onCancel={() => setShowOwnershipModal(false)}
        onVerified={() => {
          setShowOwnershipModal(false);
          enableTracking();
        }}
      />
    </ScrollView>
  );
}
