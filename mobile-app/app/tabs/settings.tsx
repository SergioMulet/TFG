import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import Ionicons from '@expo/vector-icons/Ionicons';

import globalStyles, { COLORS } from '../styles';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';
import LanguageSelector from '@/components/languageSelector';
import { authContextManager } from '@/services/auth/authContext';
import { supabase } from '@/supabaseClient';
import { mainServerService, ShipSummary } from '@/services/mainServerService';
import useSelectedShip from '@/hooks/selectedShipContext';
import { locationTracker } from '@/hooks/location/location_tracker';

export default function SettingsScreen() {
  const styles = globalStyles();
  const router = useRouter();

  let { lang } = useLanguage();
  let strings = translations[lang];

  const { selectedShipId, setSelectedShipId } = useSelectedShip();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ships, setShips] = useState<ShipSummary[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email ?? null);
      });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!userEmail) return;
      mainServerService.getShipsByOwner(userEmail).then(setShips);
    }, [userEmail]),
  );

  // change ship -> stop tracking
  const handleSelectShip = async (shipId: string) => {
    if (shipId !== selectedShipId) {
      await locationTracker.stopTracking();
    }
    setSelectedShipId(shipId);
  };

  const deleteSelectedShip = async () => {
    if (!selectedShipId || !userEmail) return;
    setIsDeleting(true);
    try {
      await locationTracker.stopTracking();
      const success = await mainServerService.deleteShip(selectedShipId, userEmail);
      if (success) {
        const remaining = ships.filter((s) => s.id !== selectedShipId);
        setShips(remaining);
        setSelectedShipId(remaining.length > 0 ? remaining[0].id : null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteShip = () => {
    if (!selectedShipId) return;
    Alert.alert(strings.deleteShipTitle, strings.deleteShipMessage, [
      { text: strings.cancel, style: 'cancel' },
      { text: strings.delete, style: 'destructive', onPress: deleteSelectedShip },
    ]);
  };

  const handleSignOut = async () => {
    await authContextManager.signOut();
  };

  const shipOptions = ships.map((s) => ({ label: s.id, value: s.id }));

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={[styles.screenContainer, { justifyContent: 'flex-start' }]}>
        <LanguageSelector></LanguageSelector>

        <View style={styles.boatCard}>
          <Text style={styles.secondTitle}>{strings.myShips}</Text>

          {ships.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Dropdown
                  style={styles.boatCard}
                  placeholder={strings.chooseShip}
                  placeholderStyle={styles.text}
                  containerStyle={styles.dropdownContainer}
                  activeColor={COLORS.cardBackground}
                  selectedTextStyle={styles.text}
                  itemTextStyle={styles.text}
                  data={shipOptions}
                  labelField="label"
                  valueField="value"
                  value={selectedShipId}
                  onChange={(item) => handleSelectShip(item.value)}
                />
              </View>

              <TouchableOpacity
                onPress={handleDeleteShip}
                disabled={!selectedShipId || isDeleting}
                style={[
                  styles.deleteButton,
                  (!selectedShipId || isDeleting) && styles.disabledButton,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Ionicons name="trash-outline" size={24} color={COLORS.background} />
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, { width: '100%', margin: 0 }]}
            onPress={() => router.push('/tabs/newShip')}
          >
            <Text style={[styles.text, { color: COLORS.background, fontWeight: 'bold' }]}>
              {strings.addNewShip}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signOutButton]} onPress={handleSignOut}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>{strings.signOut}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
