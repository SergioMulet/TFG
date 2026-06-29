import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
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

  const handleDeleteShip = async () => {
    if (!selectedShipId || !userEmail) return;
    setIsDeleting(true);
    try {
      await locationTracker.stopTracking();
      const success = await mainServerService.deleteShip(selectedShipId, userEmail);
      if (success) {
        setShips((prev) => prev.filter((s) => s.id !== selectedShipId));
        setSelectedShipId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await authContextManager.signOut();
  };

  const shipOptions = ships.map((s) => ({ label: s.id, value: s.id }));

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flex: 1 }}>
      <View style={[styles.screenContainer, { flex: 1, justifyContent: 'space-around' }]}>
        <Text style={styles.title}>{strings.settingsTab}</Text>
        <View style={[styles.boatCard]}>
          <Text style={styles.secondTitle}>{strings.changeLanguage}</Text>
          <LanguageSelector variant="big"></LanguageSelector>
        </View>

        {ships.length > 0 && (
          <View style={[styles.boatCard]}>
            <Text style={styles.secondTitle}>{strings.myShips}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 12,
              }}
            >
              <Dropdown
                style={[styles.boatCard, { flex: 1, width: undefined, margin: 0 }]}
                placeholder={strings.chooseShip}
                placeholderStyle={styles.text}
                containerStyle={styles.dropdownContainer}
                selectedTextStyle={styles.text}
                itemTextStyle={styles.text}
                data={shipOptions}
                labelField="label"
                valueField="value"
                value={selectedShipId}
                onChange={(item) => handleSelectShip(item.value)}
              />

              <TouchableOpacity
                onPress={handleDeleteShip}
                disabled={!selectedShipId || isDeleting}
                style={{ opacity: !selectedShipId || isDeleting ? 0.4 : 1, padding: 8 }}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.red} />
                ) : (
                  <Ionicons name="trash-outline" size={28} color={COLORS.red} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={() => router.push('/tabs/newShip')}
        >
          <Text style={[styles.text, { fontWeight: 'bold' }]}>{strings.addNewShip}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.signOutButton]} onPress={handleSignOut}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>{strings.signOut}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
