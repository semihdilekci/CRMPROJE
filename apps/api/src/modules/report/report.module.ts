import { Module } from '@nestjs/common';
import { SettingsModule } from '@modules/settings/settings.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [SettingsModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
