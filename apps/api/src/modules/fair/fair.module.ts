import { Module } from '@nestjs/common';
import { FairService } from './fair.service';
import { FairController } from './fair.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FairController],
  providers: [FairService],
  exports: [FairService],
})
export class FairModule {}
