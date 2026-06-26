import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from '@/app/styles';
import useLanguage from '@/internazionalization/languageContext';
import translations from '@/internazionalization/i18n';

interface OwnershipVerificationModalProps {
  visible: boolean;
  shipId: string;
  onCancel: () => void;
  onVerified: () => void;
}

type Step = 'pickFile' | 'verifying' | 'verified';

export default function OwnershipVerificationModal({
  visible,
  shipId,
  onCancel,
  onVerified,
}: OwnershipVerificationModalProps) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const [step, setStep] = useState<Step>('pickFile');
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = () => {
    setStep('pickFile');
    setFileName(null);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    setFileName(result.assets[0].name);
  };

  const handleVerify = async () => {
    setStep('verifying');

    // ------------------------------------------------------------------
    // Real ownership verification is out of scope for this project and
    // will be documented as future work. A real implementation would
    // upload `fileName` (the proof-of-ownership / registration PDF) to a
    // backend service that validates it against an official boat
    // registry before the boat is allowed to send its first coordinates.
    // Here we just simulate that round trip with a fixed delay and always
    // resolve successfully.
    // ------------------------------------------------------------------
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStep('verified');
    setTimeout(() => {
      reset();
      onVerified();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{strings.verifyOwnershipTitle}</Text>
          <Text style={styles.shipIdText}>{shipId}</Text>

          {step === 'pickFile' && (
            <>
              <Text style={styles.description}>{strings.verifyOwnershipDescription}</Text>

              <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFile}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>
                  {fileName ?? strings.selectPdf}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, !fileName && styles.disabledButton]}
                disabled={!fileName}
                onPress={handleVerify}
              >
                <Text style={styles.primaryButtonText}>{strings.verifyButton}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelText}>{strings.cancel}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'verifying' && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={COLORS.text} />
              <Text style={styles.description}>{strings.verifying}</Text>
            </View>
          )}

          {step === 'verified' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.text} />
              <Text style={styles.description}>{strings.verified}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8%',
  },

  card: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: '6%',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },

  shipIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },

  secondaryButtonText: {
    fontSize: 15,
    color: COLORS.text,
  },

  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: 15,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  disabledButton: {
    opacity: 0.4,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },

  cancelText: {
    fontSize: 14,
    color: COLORS.text,
    textDecorationLine: 'underline',
  },

  statusContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
});
