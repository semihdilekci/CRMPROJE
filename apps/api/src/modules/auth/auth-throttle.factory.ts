import type { ExecutionContext } from '@nestjs/common';
import type { ModuleRef } from '@nestjs/core';
import { SettingsService } from '@modules/settings/settings.service';

let moduleRef: ModuleRef | null = null;

/** AuthModule.onModuleInit içinde çağrılır; @Throttle için Settings’ten dinamik limit. */
export function registerAuthThrottleModuleRef(ref: ModuleRef): void {
  moduleRef = ref;
}

function getSettings(): SettingsService {
  if (!moduleRef) {
    throw new Error('Auth throttle: ModuleRef kayıtlı değil (AuthModule başlatılmadı)');
  }
  return moduleRef.get(SettingsService, { strict: false });
}

async function parsePositiveInt(value: string | null | undefined, fallback: number): Promise<number> {
  const n = parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function resolveLoginThrottleLimit(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_LOGIN_ATTEMPTS');
  return parsePositiveInt(raw, 5);
}

export async function resolveLoginThrottleTtl(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_LOGIN_WINDOW_MINUTES');
  const minutes = await parsePositiveInt(raw, 1);
  return minutes * 60_000;
}

export async function resolveRegisterThrottleLimit(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_REGISTER_ATTEMPTS');
  return parsePositiveInt(raw, 3);
}

export async function resolveRegisterThrottleTtl(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_REGISTER_WINDOW_MINUTES');
  const minutes = await parsePositiveInt(raw, 1);
  return minutes * 60_000;
}

export async function resolveMfaThrottleLimit(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_MFA_ATTEMPTS');
  return parsePositiveInt(raw, 5);
}

export async function resolveMfaThrottleTtl(context: ExecutionContext): Promise<number> {
  void context;
  const raw = await getSettings().get('RATE_LIMIT_MFA_WINDOW_MINUTES');
  const minutes = await parsePositiveInt(raw, 5);
  return minutes * 60_000;
}
