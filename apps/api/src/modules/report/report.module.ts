import { Module } from '@nestjs/common';
import { SettingsModule } from '@modules/settings/settings.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportAuditLogInterceptor } from './report-audit-log.interceptor';
import { ReportPermissionGuard } from './report-permission.guard';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [SettingsModule, PermissionModule],
  controllers: [ReportController],
  providers: [ReportService, ReportAuditLogInterceptor, ReportPermissionGuard],
  exports: [ReportService],
})
export class ReportModule {}
