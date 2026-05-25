import { Module } from '@nestjs/common';
import { FairService } from './fair.service';
import { FairController } from './fair.controller';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [AuditModule, SettingsModule, PermissionModule],
  controllers: [FairController],
  providers: [FairService],
  exports: [FairService],
})
export class FairModule {}
