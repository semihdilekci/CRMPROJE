import { Module } from '@nestjs/common';
import { SettingsModule } from '@modules/settings/settings.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportAuditLogInterceptor } from './report-audit-log.interceptor';

@Module({
  imports: [SettingsModule],
  controllers: [ReportController],
  providers: [ReportService, ReportAuditLogInterceptor],
  exports: [ReportService],
})
export class ReportModule {}
