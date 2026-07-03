import { useState, useCallback } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import globalStyles, { COLORS } from '../styles';
import useLanguage from '../../internazionalization/languageContext';
import translations from '../../internazionalization/i18n';
import { useAutoDismiss } from '@/hooks/useAutoDismiss';
import { supabase } from '@/services/supabaseClient';
import { mainServerService } from '@/services/mainServerService';
import useSelectedShip from '@/hooks/selectedShipContext';
import OwnershipVerificationModal from '@/components/ownershipVerificationModal';

const SHIP_TYPE_KEYS = [
  'cargo',
  'tanker',
  'cruise',
  'fishing',
  'yacht',
  'military',
  'tug',
  'boat',
  'other',
];

export default function NewShipScreen() {
  const router = useRouter();
  const { lang } = useLanguage();
  const strings = translations[lang];
  const styles = globalStyles();
  const { setSelectedShipId } = useSelectedShip();

  const SHIP_TYPES = SHIP_TYPE_KEYS.map((key) => ({
    label: strings[key as keyof typeof strings],
    value: key,
  }));

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [shipId, setShipId] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [showShipIdError, setShowShipIdError] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [showRegistrationError, setShowRegistrationError] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);

  useAutoDismiss(showShipIdError, setShowShipIdError);
  useAutoDismiss(showTypeError, setShowTypeError);
  useAutoDismiss(showLocationError, setShowLocationError);
  useAutoDismiss(showRegistrationError, setShowRegistrationError);
  useAutoDismiss(showDuplicateError, setShowDuplicateError);

  // cleen values (expo-router keeps tab screens alive).
  useFocusEffect(
    useCallback(() => {
      setShipId('');
      setSelectedType(null);
      setImageUri(null);
      setShowShipIdError(false);
      setShowTypeError(false);
      setShowLocationError(false);
      setShowRegistrationError(false);
      setShowDuplicateError(false);

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email ?? null);
      });
    }, []),
  );

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    setImageUri(result.assets[0].uri);
  };

  const handleOpenVerification = async () => {
    const missingShipId = !shipId.trim();
    const missingType = !selectedType;
    if (missingShipId || missingType) {
      setShowShipIdError(missingShipId);
      setShowTypeError(missingType);
      return;
    }

    if (userEmail) {
      const alreadyRegistered = await mainServerService.isShipRegistered(
        shipId.trim(),
        userEmail,
      );
      if (alreadyRegistered) {
        setShowDuplicateError(true);
        return;
      }
    }

    setShowOwnershipModal(true);
  };

  const handleVerified = async () => {
    setShowOwnershipModal(false);
    setIsRegistering(true);
    try {
      if (!userEmail) {
        setShowRegistrationError(true);
        return;
      }

      const result = await mainServerService.registerShip(
        shipId.trim(),
        selectedType!,
        userEmail,
      );

      if (result.success) {
        if (imageUri) {
          await mainServerService.uploadShipImage(shipId.trim(), imageUri);
        }
        setSelectedShipId(shipId.trim());
        router.replace('/tabs/home');
      } else if (result.reason === 'location_permission') {
        setShowLocationError(true);
      } else {
        setShowRegistrationError(true);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <Text style={styles.title}>{strings.newShipTitle}</Text>

        <View style={[styles.boatCard, showShipIdError && styles.errorBorder]}>
          <TextInput
            style={styles.title}
            value={shipId}
            onChangeText={(text) => {
              setShipId(text.replace(/\s/g, ''));
              setShowShipIdError(false);
            }}
            placeholder={strings.shipId}
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <Dropdown
          style={[
            styles.boatCard,
            isFocus && { borderColor: COLORS.text, borderWidth: 2 },
            showTypeError && styles.errorBorder,
          ]}
          placeholder={strings.chooseType}
          placeholderStyle={styles.text}
          containerStyle={styles.dropdownContainer}
          activeColor={COLORS.cardBackground}
          selectedTextStyle={styles.text}
          itemTextStyle={styles.text}
          data={SHIP_TYPES}
          onChange={(item) => {
            setSelectedType(item.value);
            setShowTypeError(false);
          }}
          labelField="label"
          valueField="value"
          value={selectedType}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
        />

        <View style={photoStyles.row}>
          <TouchableOpacity style={photoStyles.button} onPress={handlePickImage}>
            <Text style={photoStyles.buttonText}>{strings.addShipPhoto}</Text>
          </TouchableOpacity>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={photoStyles.thumbnail}
              resizeMode="cover"
            />
          )}
        </View>

        {showLocationError && (
          <Text style={[styles.text, { color: COLORS.red }]}>
            {strings.locationPermissionError}
          </Text>
        )}
        {showRegistrationError && (
          <Text style={[styles.text, { color: COLORS.red }]}>
            {strings.registrationError}
          </Text>
        )}
        {showDuplicateError && (
          <Text style={[styles.text, { color: COLORS.red }]}>
            {strings.duplicateShipError}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.loginButton, isRegistering && styles.disabledButton]}
          onPress={handleOpenVerification}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={[styles.text, { color: COLORS.background, fontWeight: 'bold' }]}>
              {strings.registerShip}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.loginText}>{strings.cancel}</Text>
        </TouchableOpacity>
      </View>

      <OwnershipVerificationModal
        visible={showOwnershipModal}
        shipId={shipId}
        onCancel={() => setShowOwnershipModal(false)}
        onVerified={handleVerified}
      />
    </ScrollView>
  );
}

const photoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginVertical: '3%',
  },
  button: {
    backgroundColor: '#071D64',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#E8EEFA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#071D64',
  },
});
