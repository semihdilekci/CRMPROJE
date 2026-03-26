import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ModuleRef } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCookieHelper } from './auth-cookie.helper';
import { registerAuthThrottleModuleRef } from './auth-throttle.factory';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SmsModule } from '@modules/sms/sms.module';
import { SettingsModule } from '@modules/settings/settings.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule,
    SmsModule,
    SettingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieHelper, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit(): void {
    registerAuthThrottleModuleRef(this.moduleRef);
  }
}
