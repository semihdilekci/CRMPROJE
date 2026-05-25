import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { SecretsService } from './secrets.service';
import { SecretsController } from './secrets.controller';

@Module({
  imports: [AuditModule],
  controllers: [SecretsController],
  providers: [SecretsService],
  exports: [SecretsService],
})
export class SecretsModule {}
