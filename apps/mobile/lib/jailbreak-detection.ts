import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type JailbreakResult =
  | { compromised: false }
  | { compromised: true; reason: string };

/**
 * Simülatör / emülatörde çalışıyor mu?
 * `Device.isDevice === false` → simülatör veya emülatör.
 */
export function isRunningOnSimulator(): boolean {
  return !Device.isDevice;
}

/**
 * expo-device'ın deneysel root/jailbreak tespiti.
 * Saf fonksiyon değil (async) — test için `checkRootedAsync` inject edilebilir.
 */
export async function runRootedCheck(
  checkFn: () => Promise<boolean> = Device.isRootedExperimentalAsync,
): Promise<boolean> {
  try {
    return await checkFn();
  } catch {
    // ERR_DEVICE_ROOT_DETECTION: okuma hatası → güvenli tarafta kal, blokla
    return true;
  }
}

/**
 * Cihazın güvenliğini değerlendirir.
 *
 * Kurallar:
 * - Simülatör/emülatör → geçer (DEV ortamı).
 * - Web → geçer (native uygulama değil).
 * - Fiziksel cihaz + root/jailbreak → blok.
 *
 * @see docs/phase-7-security-hardening.md §5 P1-B, §12
 */
export async function evaluateDeviceSecurity(options?: {
  checkFn?: () => Promise<boolean>;
}): Promise<JailbreakResult> {
  if (Platform.OS === 'web') {
    return { compromised: false };
  }

  if (isRunningOnSimulator()) {
    return { compromised: false };
  }

  const rooted = await runRootedCheck(options?.checkFn);
  if (rooted) {
    const platform = Platform.OS === 'ios' ? 'jailbreak' : 'root';
    return {
      compromised: true,
      reason: `Cihaz ${platform} tespit edildi. Uygulama güvenlik politikası gereği kapatılıyor.`,
    };
  }

  return { compromised: false };
}
