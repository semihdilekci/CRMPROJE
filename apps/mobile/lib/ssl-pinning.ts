import { Platform } from 'react-native';
import { getApiBaseUrl } from './api';
import {
  evaluateSslPinningPrereqs,
  parsePublicKeyHashesFromEnv,
} from './ssl-pinning-config';

const HASHES_ENV = process.env.EXPO_PUBLIC_SSL_PUBLIC_KEY_HASHES;
const ENABLE_ENV = process.env.EXPO_PUBLIC_ENABLE_SSL_PINNING;

type PinningModule = typeof import('react-native-ssl-public-key-pinning');

async function loadPinningModule(): Promise<PinningModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return await import('react-native-ssl-public-key-pinning');
  } catch {
    return null;
  }
}

/**
 * Üretim TLS pinning: native modül (Expo Go’da yok — development build gerekir).
 * Önkoşullar sağlanmazsa sessizce atlanır; `EXPO_PUBLIC_ENABLE_SSL_PINNING=true` iken eksik yapılandırmada uyarı verilir.
 */
export async function initMobileSslPinning(): Promise<void> {
  const pinning = await loadPinningModule();
  if (!pinning) {
    if (__DEV__) {
      console.log('[CRM Mobile] SSL pinning modülü yüklenemedi (web veya native yok).');
    }
    return;
  }

  const { initializeSslPinning, isSslPinningAvailable } = pinning;

  if (!isSslPinningAvailable()) {
    if (__DEV__) {
      console.log(
        '[CRM Mobile] SSL pinning native modülü yok (ör. Expo Go). Development build kullanın.',
      );
    }
    return;
  }

  const hashes = parsePublicKeyHashesFromEnv(HASHES_ENV);
  const base = getApiBaseUrl();
  const decision = evaluateSslPinningPrereqs({
    enableFlag: ENABLE_ENV,
    apiBaseUrl: base,
    hashes,
  });

  if (!decision.ok) {
    if (ENABLE_ENV === 'true') {
      console.warn(`[CRM Mobile] SSL pinning devre dışı: ${decision.reason}`);
    }
    return;
  }

  await initializeSslPinning({
    [decision.hostname]: {
      includeSubdomains: false,
      publicKeyHashes: hashes,
    },
  });

  if (__DEV__) {
    console.log(`[CRM Mobile] SSL pinning etkin: ${decision.hostname}`);
  }
}

export async function subscribeSslPinningErrors(): Promise<{ remove: () => void }> {
  const pinning = await loadPinningModule();
  if (!pinning) {
    return { remove: () => {} };
  }

  const { addSslPinningErrorListener, isSslPinningAvailable } = pinning;

  if (!isSslPinningAvailable()) {
    return { remove: () => {} };
  }

  const sub = addSslPinningErrorListener((err) => {
    console.warn('[CRM Mobile] SSL pinning doğrulama hatası:', err.serverHostname, err.message);
  });
  return { remove: () => sub.remove() };
}
