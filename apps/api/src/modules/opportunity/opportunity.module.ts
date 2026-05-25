import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { OpportunityService } from './opportunity.service';
import { OpportunityController } from './opportunity.controller';
import { OfferService } from './offer.service';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [AuditModule, forwardRef(() => SettingsModule), PermissionModule],
  controllers: [OpportunityController],
  providers: [OpportunityService, OfferService],
  exports: [OpportunityService, OfferService],
})
export class OpportunityModule {}
