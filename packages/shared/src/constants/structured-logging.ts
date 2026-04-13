/**
 * Satır bazlı JSON log şeması — API (Loki / Promtail) ile uyumlu.
 * PII/token loglanmaz; olay adları tek kaynak.
 */

export const LOG_CATEGORIES = {
  access: 'access',
  security: 'security',
  audit: 'audit',
  ai: 'ai',
} as const;

export type LogCategory = (typeof LOG_CATEGORIES)[keyof typeof LOG_CATEGORIES];

/** Güvenlik / kimlik doğrulama olayları (logCategory: security) */
export const SECURITY_EVENTS = {
  REGISTER_SUCCESS: 'auth.register.success',
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGIN_LOCKED: 'auth.login.locked',
  MFA_OTP_SENT: 'auth.mfa.otp_sent',
  MFA_VERIFY_SUCCESS: 'auth.mfa.verify_success',
  MFA_VERIFY_FAILURE: 'auth.mfa.verify_failure',
  REFRESH_SUCCESS: 'auth.refresh.success',
  REFRESH_FAILURE: 'auth.refresh.failure',
  REFRESH_REUSE_DETECTED: 'auth.refresh.reuse_detected',
  LOGOUT: 'auth.logout',
} as const;

export type SecurityEventType = (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];

/** Denetim satırı olayları (logCategory: audit) */
export const AUDIT_LOG_EVENTS = {
  ENTITY_CHANGE: 'audit.entity_change',
  REPORT_EXECUTED: 'report.executed',
} as const;

/** AI / analiz meta (içerik yok) */
export const AI_LOG_EVENTS = {
  CHAT_QUERY: 'ai.chat.query',
  EXPORT_DOWNLOAD: 'ai.export.download',
} as const;

export type LogOutcome = 'success' | 'failure';
