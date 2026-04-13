import { Global, Module } from '@nestjs/common';
import { StructuredLogService } from './logging/structured-log.service';

/** Global: StructuredLogService tüm modüllerde (Auth, Audit, Report, Chat). */
@Global()
@Module({
  providers: [StructuredLogService],
  exports: [StructuredLogService],
})
export class AppCommonModule {}
