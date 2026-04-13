import type { NextFunction, Request, Response } from 'express';
import { LOG_CATEGORIES } from '@crm/shared';
import { getGitLogFields } from '@common/logging/git-log-fields';
import { writeStructuredJsonLogLine } from '@common/logging/json-log.transport';
import { resolveTrustedRequestId } from './resolve-request-id';

type RequestWithUser = Request & {
  user?: { id: string; role: string };
};

/**
 * Satır bazlı JSON access log (Loki / Promtail ile uyumlu).
 * İsteğe bağlı dosya: API_JSON_LOG_FILE (örn. repo kökünde logs/api.log).
 */
export function jsonRequestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const requestId = resolveTrustedRequestId(req.headers['x-request-id']);
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;
    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const requestPath = req.originalUrl || req.url;
    const r = req as RequestWithUser;
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: 'api',
      env: process.env.NODE_ENV ?? 'development',
      logCategory: LOG_CATEGORIES.access,
      requestId,
      method: req.method,
      path: requestPath,
      statusCode,
      durationMs,
      message: `${req.method} ${requestPath} ${statusCode}`,
      ...getGitLogFields(),
    };

    const user = r.user;
    if (user?.id) {
      payload.userId = user.id;
      payload.role = user.role;
    }

    const clientHeader = req.headers['x-client'];
    if (typeof clientHeader === 'string' && clientHeader.trim()) {
      payload.client = clientHeader.trim().slice(0, 64);
    }

    writeStructuredJsonLogLine(payload);
  });

  next();
}
