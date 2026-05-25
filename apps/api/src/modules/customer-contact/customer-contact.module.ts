import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { CustomerContactService } from './customer-contact.service';
import { CustomerContactController } from './customer-contact.controller';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [AuditModule, PermissionModule],
  controllers: [CustomerContactController],
  providers: [CustomerContactService],
  exports: [CustomerContactService],
})
export class CustomerContactModule {}
