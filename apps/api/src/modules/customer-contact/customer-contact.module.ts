import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { CustomerContactService } from './customer-contact.service';
import { CustomerContactController } from './customer-contact.controller';

@Module({
  imports: [AuditModule],
  controllers: [CustomerContactController],
  providers: [CustomerContactService],
  exports: [CustomerContactService],
})
export class CustomerContactModule {}
