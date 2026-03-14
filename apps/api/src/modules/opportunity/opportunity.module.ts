import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { OpportunityService } from './opportunity.service';
import { OpportunityController } from './opportunity.controller';
import { OfferService } from './offer.service';

@Module({
  imports: [AuditModule, SettingsModule],
  controllers: [OpportunityController],
  providers: [OpportunityService, OfferService],
  exports: [OpportunityService, OfferService],
})
export class OpportunityModule {}
