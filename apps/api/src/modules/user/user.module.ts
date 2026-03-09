import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [AuditModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
