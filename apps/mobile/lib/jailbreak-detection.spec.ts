/**
 * `isRunningOnSimulator` ve `evaluateDeviceSecurity` birim testleri.
 *
 * Strateji: `expo-device` modülü jest.mock ile tamamen kontrol edilir;
 * `isDevice` değeri mock factory içinde bir değişken üzerinden döndürülür.
 * Bu sayede getter-only kısıtlaması aşılır.
 */

let mockIsDevice = true;

jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice;
  },
  isRootedExperimentalAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { Platform } from 'react-native';
import { evaluateDeviceSecurity, isRunningOnSimulator, runRootedCheck } from './jailbreak-detection';

describe('isRunningOnSimulator', () => {
  it('Device.isDevice false iken true döner', () => {
    mockIsDevice = false;
    expect(isRunningOnSimulator()).toBe(true);
  });

  it('Device.isDevice true iken false döner', () => {
    mockIsDevice = true;
    expect(isRunningOnSimulator()).toBe(false);
  });
});

describe('runRootedCheck', () => {
  it('checkFn true döndürünce true', async () => {
    expect(await runRootedCheck(async () => true)).toBe(true);
  });

  it('checkFn false döndürünce false', async () => {
    expect(await runRootedCheck(async () => false)).toBe(false);
  });

  it('checkFn hata fırlatınca güvenli taraf: true döner', async () => {
    expect(
      await runRootedCheck(async () => {
        throw new Error('ERR_DEVICE_ROOT_DETECTION');
      }),
    ).toBe(true);
  });
});

describe('evaluateDeviceSecurity', () => {
  beforeEach(() => {
    mockIsDevice = true;
    (Platform as any).OS = 'ios';
  });

  it('web platformunda her zaman geçer', async () => {
    (Platform as any).OS = 'web';
    const r = await evaluateDeviceSecurity({ checkFn: async () => true });
    expect(r.compromised).toBe(false);
  });

  it('simülatörde geçer ve checkFn çağrılmaz', async () => {
    mockIsDevice = false;
    const checkFn = jest.fn(async () => true);
    const r = await evaluateDeviceSecurity({ checkFn });
    expect(r.compromised).toBe(false);
    expect(checkFn).not.toHaveBeenCalled();
  });

  it('iOS fiziksel cihaz + rooted → blok ve reason jailbreak içerir', async () => {
    const r = await evaluateDeviceSecurity({ checkFn: async () => true });
    expect(r.compromised).toBe(true);
    if (r.compromised) {
      expect(r.reason).toContain('jailbreak');
    }
  });

  it('fiziksel cihaz + temiz → geçer', async () => {
    const r = await evaluateDeviceSecurity({ checkFn: async () => false });
    expect(r.compromised).toBe(false);
  });

  it('Android fiziksel cihaz + rooted → reason root içerir', async () => {
    (Platform as any).OS = 'android';
    const r = await evaluateDeviceSecurity({ checkFn: async () => true });
    expect(r.compromised).toBe(true);
    if (r.compromised) {
      expect(r.reason).toContain('root');
    }
  });
});
