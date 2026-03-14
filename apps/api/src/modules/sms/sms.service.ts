import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

/** DEV modunda (Twilio yok) OTP kodunu saklamak için */
const devOtpStore = new Map<
  string,
  { code: string; expiresAt: number }
>();

const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: twilio.Twilio | null = null;
  private readonly verifyServiceSid: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID') ?? null;

    if (accountSid && authToken) {
      this.client = twilio.default(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not configured. SMS OTP will log to console.');
    }
  }

  /**
   * Twilio Verify API ile 6 haneli OTP gönderir.
   * Credentials yoksa terminale basar ve in-memory saklar (DEV).
   */
  async sendOtp(phone: string): Promise<string> {
    if (this.client && this.verifyServiceSid) {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ channel: 'sms', to: phone });
      this.logger.log(`OTP sent to ${phone} (sid: ${verification.sid})`);
      return verification.sid;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.logger.log(`Giriş için SMS ile gelen OTP kodunu giriniz : ${code}`);
    devOtpStore.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });
    return code;
  }

  /**
   * Twilio Verify API ile OTP doğrular.
   * Credentials yoksa in-memory store ile doğrular (DEV).
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    if (this.client && this.verifyServiceSid) {
      try {
        const check = await this.client.verify.v2
          .services(this.verifyServiceSid)
          .verificationChecks.create({ to: phone, code });
        return check.status === 'approved';
      } catch {
        return false;
      }
    }

    const stored = devOtpStore.get(phone);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      devOtpStore.delete(phone);
      return false;
    }
    const valid = stored.code === code;
    if (valid) devOtpStore.delete(phone);
    return valid;
  }
}
