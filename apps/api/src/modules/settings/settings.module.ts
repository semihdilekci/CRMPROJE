import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AuditModule } from '@modules/audit/audit.module';
import { OpportunityModule } from '@modules/opportunity/opportunity.module';

@Module({
  imports: [AuditModule, forwardRef(() => OpportunityModule)],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
