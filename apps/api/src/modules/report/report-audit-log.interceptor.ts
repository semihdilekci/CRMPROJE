import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, finalize } from 'rxjs';
import { AUDIT_LOG_EVENTS, LOG_CATEGORIES } from '@crm/shared';
import { StructuredLogService } from '@common/logging/structured-log.service';

@Injectable()
export class ReportAuditLogInterceptor implements NestInterceptor {
  constructor(private readonly structuredLog: StructuredLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      user?: { id: string; role: string };
      originalUrl?: string;
      route?: { path?: string };
    }>();
    const started = Date.now();
    let outcome: 'success' | 'failure' = 'success';

    return next.handle().pipe(
      tap({
        error: () => {
          outcome = 'failure';
        },
      }),
      finalize(() => {
        const raw = req.originalUrl?.split('?')[0] ?? req.route?.path ?? '';
        const reportPath = raw.length > 256 ? `${raw.slice(0, 253)}...` : raw;
        this.structuredLog.writeLine({
          ...this.structuredLog.baseFields(),
          level: outcome === 'success' ? 'info' : 'warn',
          logCategory: LOG_CATEGORIES.audit,
          event: AUDIT_LOG_EVENTS.REPORT_EXECUTED,
          outcome,
          userId: req.user?.id,
          role: req.user?.role,
          reportPath,
          durationMs: Date.now() - started,
          message: `report ${outcome}`,
        });
      }),
    );
  }
}
