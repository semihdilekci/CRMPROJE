import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
