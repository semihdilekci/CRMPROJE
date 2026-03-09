import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ValidationDetail, ErrorCode } from '@crm/shared';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    const details: ValidationDetail[] = result.error.errors.map(
      (issue: ZodError['errors'][number]) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }),
    );

    throw new BadRequestException({
      message: 'Validation failed',
      error: ErrorCode.VALIDATION_ERROR,
      details,
    });
  }
}
