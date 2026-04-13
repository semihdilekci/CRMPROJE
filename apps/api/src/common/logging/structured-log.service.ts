import { Injectable } from '@nestjs/common';
import { getGitLogFields } from './git-log-fields';
import { writeStructuredJsonLogLine } from './json-log.transport';

@Injectable()
export class StructuredLogService {
  /** Ortak alanlar: timestamp, service, env, git meta. */
  baseFields(): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      service: 'api',
      env: process.env.NODE_ENV ?? 'development',
      ...getGitLogFields(),
    };
  }

  writeLine(payload: Record<string, unknown>): void {
    writeStructuredJsonLogLine(payload);
  }
}
