import { maskPhone, isMasked } from './phone-mask';

describe('maskPhone', () => {
  it('null → boş string', () => {
    expect(maskPhone(null)).toBe('');
  });

  it('undefined → boş string', () => {
    expect(maskPhone(undefined)).toBe('');
  });

  it('boş string → boş string', () => {
    expect(maskPhone('')).toBe('');
  });

  it('son 4 hane görünür, geri kalanı maskeli', () => {
    const result = maskPhone('+90 532 123 45 67');
    expect(result).toContain('67');
    expect(result.startsWith('+')).toBe(true);
    expect(result).toContain('*');
  });

  it('son 4 hane doğru', () => {
    const result = maskPhone('05321234567');
    expect(result.endsWith('4567')).toBe(true);
  });

  it('4 veya daha az rakam → tamamen maskeli', () => {
    const result = maskPhone('123');
    expect(result).toBe('***');
  });

  it('noktalama işaretleri korunur', () => {
    const result = maskPhone('+90 532 123 45 67');
    expect(result).toContain(' ');
    expect(result.startsWith('+')).toBe(true);
  });

  it('maskeli değerde * karakteri bulunur', () => {
    expect(isMasked(maskPhone('+90 532 123 45 67'))).toBe(true);
  });

  it('kısa numara (4 hane) tamamen maskeli', () => {
    expect(maskPhone('1234')).toBe('****');
  });

  it('tam 5 haneli numara: son 4 görünür, ilk 1 maskeli', () => {
    const result = maskPhone('12345');
    expect(result).toBe('*2345');
  });
});

describe('isMasked', () => {
  it('* içeriyorsa true', () => {
    expect(isMasked('***45 67')).toBe(true);
  });

  it('* içermiyorsa false', () => {
    expect(isMasked('+90 532 123 45 67')).toBe(false);
  });
});
