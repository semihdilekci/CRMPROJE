import { Module } from '@nestjs/common';
import { SettingsModule } from '@modules/settings/settings.module';
import { OpportunityModule } from '@modules/opportunity/opportunity.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [SettingsModule, OpportunityModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
