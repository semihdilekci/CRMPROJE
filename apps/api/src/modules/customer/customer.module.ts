import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [AuditModule, PermissionModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
