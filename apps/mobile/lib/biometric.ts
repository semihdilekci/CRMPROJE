import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricResult =
  | { success: true }
  | { success: false; reason: 'not_available' | 'not_enrolled' | 'cancelled' | 'failed' };

/**
 * Cihazın biyometrik / PIN doğrulamasını destekleyip desteklemediğini kontrol eder.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Biyometrik veya cihaz PIN doğrulaması başlatır.
 * Başarısız veya iptal edilirse nedeni döndürür.
 *
 * @param promptMessage - Kullanıcıya gösterilecek mesaj
 */
export async function authenticateWithBiometric(
  promptMessage = 'Telefon numarasını görmek için kimliğinizi doğrulayın',
): Promise<BiometricResult> {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, reason: 'not_available' };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'PIN Kullan',
    disableDeviceFallback: false,
    cancelLabel: 'İptal',
  });

  if (result.success) {
    return { success: true };
  }

  if (result.error === 'user_cancel' || result.error === 'system_cancel') {
    return { success: false, reason: 'cancelled' };
  }

  return { success: false, reason: 'failed' };
}
