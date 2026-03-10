import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    FairModule,
    CustomerModule,
    OpportunityModule,
    UploadModule,
    AdminModule,
    ProductModule,
    AuditModule,
    SettingsModule,
    TeamModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
