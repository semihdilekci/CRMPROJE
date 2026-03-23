import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as path from 'path';
import { AppController } from './app.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { FairModule } from '@modules/fair/fair.module';
import { CustomerModule } from '@modules/customer/customer.module';
import { UploadModule } from '@modules/upload/upload.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ProductModule } from '@modules/product/product.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { TeamModule } from '@modules/team/team.module';
import { OpportunityModule } from '@modules/opportunity/opportunity.module';
import { ChatModule } from '@modules/chat/chat.module';
import { ReportModule } from '@modules/report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), 'apps', 'api', '.env'),
        path.join(process.cwd(), '.env'),
        '.env',
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 10 }],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    FairModule,
    CustomerModule,
    OpportunityModule,
    ChatModule,
    UploadModule,
    AdminModule,
    ProductModule,
    AuditModule,
    SettingsModule,
    TeamModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
