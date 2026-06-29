import { Text, View, Switch, ScrollView } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import globalStyles, { COLORS } from '../styles';
import useLanguage from '../../internazionalization/languageContext';
import translations from '../../internazionalization/i18n';
import LanguageSelector from '@/components/languageSelector';
import { useLocationTracker } from '@/hooks/location/use_location_tracker';
import { supabase } from '@/supabaseClient';
import { mainServerService, ShipSummary } from '@/services/mainServerService';
import useSelectedShip from '@/hooks/selectedShipContext';

export default function DashboardScreen() {
  let { lang } = useLanguage();
  let strings = translations[lang];

  const { location, gpsActive, toggleGPS, syncStatus } = useLocationTracker();
  const { selectedShipId, setSelectedShipId } = useSelectedShip();

  const [ship, setShip] = useState<ShipSummary | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingShip, setLoadingShip] = useState(true);
  const styles = globalStyles();

  const displayCoords =
    location?.coords ?? (ship ? { longitude: ship.lng, latitude: ship.lat } : null);
  const coordinatesType = gpsActive ? 'current' : displayCoords ? 'last' : null;

  useFocusEffect(
    useCallback(() => {
      syncStatus();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email ?? null);
      });
    }, [syncStatus]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!userEmail) {
        setShip(null);
        setLoadingShip(false);
        return;
      }
      setLoadingShip(true);
      mainServerService.getShipsByOwner(userEmail).then((ships) => {
        const match = ships.find((s) => s.id === selectedShipId);
        if (match) {
          setShip(match);
        } else if (ships.length > 0) {
          // No ship selected yet (or the selected one no longer exists) but
          // the user does have ships, so default to the first one instead
          // of showing "no ship registered yet".
          setSelectedShipId(ships[0].id);
          setShip(ships[0]);
        } else {
          setShip(null);
        }
        setLoadingShip(false);
      });
    }, [userEmail, selectedShipId, setSelectedShipId]),
  );

  const enableTracking = () => {
    if (!userEmail || !ship) return;
    toggleGPS(true, ship.id, userEmail, ship.type);
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <LanguageSelector></LanguageSelector>

        {!loadingShip && !ship && (
          <View style={styles.boatCard}>
            <Text style={styles.secondTitle}>{strings.noShipTitle}</Text>
            <Text style={styles.text}>{strings.noShipDescription}</Text>
          </View>
        )}

        {ship && (
          <>
            <View style={styles.boatCard}>
              <Text style={styles.title}>{ship.id}</Text>
              <Text style={styles.text}>
                {strings[ship.type as keyof typeof strings] || ship.type}
              </Text>
            </View>

            {coordinatesType != null && (
              <View style={styles.boatCard}>
                <Text style={styles.secondTitle}>
                  {coordinatesType === 'current' ? strings.current : strings.last}
                </Text>
                <Text style={styles.text}>
                  {strings.longitude}: {displayCoords?.longitude}
                </Text>
                <Text style={styles.text}>
                  {strings.latitude}: {displayCoords?.latitude}
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
                  if (!userEmail || !ship) return;

                  if (!value) {
                    toggleGPS(false, ship.id, userEmail, ship.type);
                    return;
                  }

                  enableTracking();
                }}
                value={gpsActive}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
