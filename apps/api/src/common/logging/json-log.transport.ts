import * as nodePath from 'path';
import { appendFile, mkdir } from 'fs/promises';

/**
 * Satır bazlı JSON — stdout + isteğe bağlı API_JSON_LOG_FILE (Promtail / Loki).
 */
export function serializeJsonLogLine(obj: Record<string, unknown>): string {
  return `${JSON.stringify(obj)}\n`;
}

export function writeStructuredJsonLogLine(obj: Record<string, unknown>): void {
  const line = serializeJsonLogLine(obj);
  process.stdout.write(line);

  const file = process.env.API_JSON_LOG_FILE?.trim();
  if (!file) return;

  const resolved = nodePath.isAbsolute(file) ? file : nodePath.resolve(process.cwd(), file);
  void mkdir(nodePath.dirname(resolved), { recursive: true })
    .then(() => appendFile(resolved, line, { encoding: 'utf8' }))
    .catch((err: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[structured-json-log] Dosyaya yazılamadı (API_JSON_LOG_FILE):',
          resolved,
          err,
        );
      }
    });
}
