import { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useRouter } from 'expo-router';

import globalStyles, { COLORS } from '../styles';
import useLanguage from '../../internazionalization/languageContext';
import translations from '../../internazionalization/i18n';
import { useAutoDismiss } from '@/hooks/use_auto_dismiss';
import { supabase } from '@/supabaseClient';
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

  const [shipId, setShipId] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [showShipIdError, setShowShipIdError] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [showRegistrationError, setShowRegistrationError] = useState(false);

  useAutoDismiss(showShipIdError, setShowShipIdError);
  useAutoDismiss(showTypeError, setShowTypeError);
  useAutoDismiss(showLocationError, setShowLocationError);
  useAutoDismiss(showRegistrationError, setShowRegistrationError);

  const handleOpenVerification = () => {
    const missingShipId = !shipId.trim();
    const missingType = !selectedType;
    if (missingShipId || missingType) {
      setShowShipIdError(missingShipId);
      setShowTypeError(missingType);
      return;
    }
    setShowOwnershipModal(true);
  };

  const handleVerified = async () => {
    setShowOwnershipModal(false);
    setIsRegistering(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ownerEmail = session?.user?.email;
      if (!ownerEmail) {
        setShowRegistrationError(true);
        return;
      }

      const result = await mainServerService.registerShip(
        shipId.trim(),
        selectedType!,
        ownerEmail,
      );

      if (result.success) {
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
              setShipId(text);
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

        {showLocationError && (
          <Text style={[styles.text, { color: COLORS.red }]}>
            {strings.locationPermissionError}
          </Text>
        )}
        {showRegistrationError && (
          <Text style={[styles.text, { color: COLORS.red }]}>{strings.registrationError}</Text>
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
