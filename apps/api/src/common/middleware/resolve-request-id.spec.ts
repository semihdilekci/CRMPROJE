import type { Response } from 'express';
import {
  REQUEST_ID_MAX_LENGTH,
  assignServerRequestIdHeader,
  getInboundRequestIdForLog,
  resolveTrustedRequestId,
} from './resolve-request-id';

/** Node crypto.randomUUID — RFC 4122 v4 */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('assignServerRequestIdHeader', () => {
  it('X-Request-Id yanıtına her zaman sunucu UUID yazar', () => {
    const setHeader = jest.fn();
    const res = { setHeader } as unknown as Response;
    const id = assignServerRequestIdHeader(res);
    expect(id).toMatch(UUID_V4);
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', id);
  });
});

describe('getInboundRequestIdForLog', () => {
  it('başlık yoksa undefined döner', () => {
    expect(getInboundRequestIdForLog(undefined)).toBeUndefined();
  });

  it('allowlist geçerli değeri döndürür', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-bddd-eeeeeeeeeeee';
    expect(getInboundRequestIdForLog(id)).toBe(id);
  });

  it('CRLF içeren değerde undefined döner', () => {
    expect(getInboundRequestIdForLog('evil\r\nx')).toBeUndefined();
  });
});

describe('resolveTrustedRequestId', () => {
  it('başlık yoksa UUID döner', () => {
    const id = resolveTrustedRequestId(undefined);
    expect(id).toMatch(UUID_V4);
  });

  it('geçerli UUID stringini aynen kabul eder', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(resolveTrustedRequestId(uuid)).toBe(uuid);
  });

  it('dizi geldiğinde ilk elemanı değerlendirir', () => {
    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    expect(resolveTrustedRequestId([uuid, 'ignored'])).toBe(uuid);
  });

  it('baştaki/sondaki boşluğu kırpar ve kabul eder', () => {
    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    expect(resolveTrustedRequestId(`  ${uuid}  `)).toBe(uuid);
  });

  it('ULID benzeri güvenli id kabul eder', () => {
    const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    expect(resolveTrustedRequestId(ulid)).toBe(ulid);
  });

  it('CR/LF içeren değeri reddeder ve yeni UUID üretir', () => {
    const id = resolveTrustedRequestId('evil\r\nHTTP/1.1');
    expect(id).toMatch(UUID_V4);
    expect(id).not.toContain('\r');
    expect(id).not.toContain('\n');
  });

  it('boş string reddedilir', () => {
    expect(resolveTrustedRequestId('')).toMatch(UUID_V4);
    expect(resolveTrustedRequestId('   ')).toMatch(UUID_V4);
  });

  it('izin verilmeyen karakter reddedilir', () => {
    expect(resolveTrustedRequestId('x;drop')).toMatch(UUID_V4);
    expect(resolveTrustedRequestId('x y')).toMatch(UUID_V4);
    expect(resolveTrustedRequestId('x%0a')).toMatch(UUID_V4);
  });

  it('uzunluk üst sınırını aşan değer reddedilir', () => {
    const tooLong = 'a'.repeat(REQUEST_ID_MAX_LENGTH + 1);
    expect(resolveTrustedRequestId(tooLong)).toMatch(UUID_V4);
  });

  it('tam üst sınır uzunluğunda yalnızca izinli karakterler kabul edilir', () => {
    const ok = 'b'.repeat(REQUEST_ID_MAX_LENGTH);
    expect(resolveTrustedRequestId(ok)).toBe(ok);
  });
});
