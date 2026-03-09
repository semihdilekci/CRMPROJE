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
    UploadModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
