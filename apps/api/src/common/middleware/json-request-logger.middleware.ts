import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { appendFile } from 'fs/promises';

function logLine(obj: Record<string, unknown>): string {
  return `${JSON.stringify(obj)}\n`;
}

/**
 * Satır bazlı JSON access log (Loki / Promtail ile uyumlu).
 * İsteğe bağlı: API_JSON_LOG_FILE (örn. repo kökünde logs/api.log).
 */
export function jsonRequestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const requestId =
    (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']) ||
    randomUUID();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;
    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const path = req.originalUrl || req.url;
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: 'api',
      env: process.env.NODE_ENV ?? 'development',
      requestId,
      method: req.method,
      path,
      statusCode,
      durationMs,
      message: `${req.method} ${path} ${statusCode}`,
    };
    const line = logLine(payload);
    process.stdout.write(line);

    const file = process.env.API_JSON_LOG_FILE?.trim();
    if (file) {
      void appendFile(file, line, { encoding: 'utf8' }).catch(() => {
        /* dosya yoksa veya izin yoksa sessiz; stdout yeterli */
      });
    }
  });

  next();
}
