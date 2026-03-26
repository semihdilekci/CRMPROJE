import {
  evaluateSslPinningPrereqs,
  getHostnameForPinning,
  MIN_PUBLIC_KEY_PINS,
  parsePublicKeyHashesFromEnv,
} from './ssl-pinning-config';

describe('parsePublicKeyHashesFromEnv', () => {
  it('boş veya undefined için [] döner', () => {
    expect(parsePublicKeyHashesFromEnv(undefined)).toEqual([]);
    expect(parsePublicKeyHashesFromEnv('')).toEqual([]);
  });

  it('virgülle ayrılmış hash’leri trim eder', () => {
    const a = 'AAA=';
    const b = 'BBB=';
    expect(parsePublicKeyHashesFromEnv(` ${a} , ${b} `)).toEqual([a, b]);
  });
});

describe('getHostnameForPinning', () => {
  it('HTTPS URL’den hostname döner', () => {
    expect(getHostnameForPinning('https://api.example.com/api/v1')).toBe('api.example.com');
  });

  it('HTTP için null', () => {
    expect(getHostnameForPinning('http://192.168.1.1:3001/api/v1')).toBeNull();
  });
});

describe('evaluateSslPinningPrereqs', () => {
  const twoPins = ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='];

  it('ENABLE true + HTTPS + 2 pin + geçerli URL → ok', () => {
    const r = evaluateSslPinningPrereqs({
      enableFlag: 'true',
      apiBaseUrl: 'https://ornek.com/api/v1',
      hashes: twoPins,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hostname).toBe('ornek.com');
    }
  });

  it('ENABLE kapalıysa reddeder', () => {
    const r = evaluateSslPinningPrereqs({
      enableFlag: undefined,
      apiBaseUrl: 'https://ornek.com/api/v1',
      hashes: twoPins,
    });
    expect(r.ok).toBe(false);
  });

  it(`en az ${MIN_PUBLIC_KEY_PINS} pin gerekir`, () => {
    const r = evaluateSslPinningPrereqs({
      enableFlag: 'true',
      apiBaseUrl: 'https://ornek.com/api/v1',
      hashes: [twoPins[0]],
    });
    expect(r.ok).toBe(false);
  });
});
