import type { Request, Response } from 'express';

jest.mock('fs/promises', () => ({
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

import { appendFile, mkdir } from 'fs/promises';
import { jsonRequestLoggerMiddleware } from './json-request-logger.middleware';

const mockAppendFile = appendFile as jest.MockedFunction<typeof appendFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;

describe('jsonRequestLoggerMiddleware', () => {
  const originalEnv = process.env;
  const originalWrite = process.stdout.write;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    process.stdout.write = jest.fn() as typeof process.stdout.write;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.stdout.write = originalWrite;
  });

  it('yazdığı JSON satırında path alanı URL’yi içerir (path modülü ile çakışma yok)', async () => {
    process.env.API_JSON_LOG_FILE = '/tmp/crm-json-log-test.log';

    const finishCbs: Array<() => void> = [];
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      on(event: string, cb: () => void) {
        if (event === 'finish') {
          finishCbs.push(cb);
        }
        return this;
      },
    } as unknown as Response;

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      url: '/api/v1/health',
      headers: {},
    } as unknown as Request;

    const next = jest.fn();
    jsonRequestLoggerMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    finishCbs.forEach((cb) => {
      cb();
    });

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    const call = mockAppendFile.mock.calls[0];
    expect(call).toBeDefined();
    const written = String(call![1]);
    const row = JSON.parse(written.trim()) as {
      path: string;
      method: string;
      statusCode: number;
    };
    expect(row.path).toBe('/api/v1/health');
    expect(row.method).toBe('GET');
    expect(row.statusCode).toBe(200);
    expect((row as { logCategory?: string }).logCategory).toBe('access');
  });

  it('req.user varsa userId ve role JSON satırına eklenir', async () => {
    process.env.API_JSON_LOG_FILE = '/tmp/crm-json-log-test-user.log';

    const finishCbs: Array<() => void> = [];
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      on(event: string, cb: () => void) {
        if (event === 'finish') {
          finishCbs.push(cb);
        }
        return this;
      },
    } as unknown as Response;

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/fairs',
      url: '/api/v1/fairs',
      headers: {},
      user: { id: 'u-1', role: 'admin' },
    } as unknown as Request;

    jsonRequestLoggerMiddleware(req, res, jest.fn());
    finishCbs.forEach((cb) => cb());
    await new Promise<void>((resolve) => setImmediate(resolve));

    const written = String(mockAppendFile.mock.calls[0]![1]);
    const row = JSON.parse(written.trim()) as {
      userId?: string;
      role?: string;
    };
    expect(row.userId).toBe('u-1');
    expect(row.role).toBe('admin');
  });

  it('göreli API_JSON_LOG_FILE yolunu process.cwd üzerinden çözümler', async () => {
    process.env.API_JSON_LOG_FILE = 'rel/api.log';

    const finishCbs: Array<() => void> = [];
    const res = {
      statusCode: 204,
      setHeader: jest.fn(),
      on(event: string, cb: () => void) {
        if (event === 'finish') {
          finishCbs.push(cb);
        }
        return this;
      },
    } as unknown as Response;

    const req = {
      method: 'POST',
      originalUrl: '/x',
      url: '/x',
      headers: {},
    } as unknown as Request;

    jsonRequestLoggerMiddleware(req, res, jest.fn());
    finishCbs.forEach((cb) => cb());
    await new Promise<void>((resolve) => setImmediate(resolve));

    const relCall = mockAppendFile.mock.calls[0];
    expect(relCall).toBeDefined();
    const targetPath = String(relCall![0]);
    expect(targetPath).toContain('rel');
    expect(targetPath).toContain('api.log');
  });

  it('geçerli X-Request-Id response başlığına aynen yazılır', () => {
    const finishCbs: Array<() => void> = [];
    const setHeader = jest.fn();
    const res = {
      statusCode: 200,
      setHeader,
      on(event: string, cb: () => void) {
        if (event === 'finish') {
          finishCbs.push(cb);
        }
        return this;
      },
    } as unknown as Response;

    const trusted = 'aaaaaaaa-bbbb-4ccc-bddd-eeeeeeeeeeee';
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      url: '/api/v1/health',
      headers: { 'x-request-id': trusted },
    } as unknown as Request;

    jsonRequestLoggerMiddleware(req, res, jest.fn());

    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', trusted);
  });

  it('X-Request-Id içinde CRLF varsa güvenli UUID yazılır (header injection önlenir)', () => {
    const finishCbs: Array<() => void> = [];
    const setHeader = jest.fn();
    const res = {
      statusCode: 200,
      setHeader,
      on(event: string, cb: () => void) {
        if (event === 'finish') {
          finishCbs.push(cb);
        }
        return this;
      },
    } as unknown as Response;

    const req = {
      method: 'GET',
      originalUrl: '/x',
      url: '/x',
      headers: { 'x-request-id': 'evil\r\nSet-Cookie: a=b' },
    } as unknown as Request;

    jsonRequestLoggerMiddleware(req, res, jest.fn());

    expect(setHeader).toHaveBeenCalledTimes(1);
    const writtenId = setHeader.mock.calls[0]![1] as string;
    expect(writtenId).not.toMatch(/[\r\n]/);
    expect(writtenId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
