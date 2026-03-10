import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { OpportunityService } from './opportunity.service';
import { OpportunityController } from './opportunity.controller';

@Module({
  imports: [AuditModule],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
