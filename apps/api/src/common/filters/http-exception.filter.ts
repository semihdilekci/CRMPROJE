import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ErrorCode } from '@crm/shared';

const HTTP_STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.buildErrorResponse(exception);

    this.logError(exception, request, status);

    response.status(status).json(body);
  }

  private buildErrorResponse(exception: unknown): {
    status: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message?.toString() ||
            exception.message;

      const errorCode =
        HTTP_STATUS_TO_ERROR_CODE[status] || ErrorCode.INTERNAL_ERROR;

      const body: ApiErrorResponse = {
        success: false,
        message: Array.isArray(message) ? message.join(', ') : message,
        error: errorCode,
      };

      const details = (exceptionResponse as Record<string, unknown>).details;
      if (Array.isArray(details)) {
        body.details = details;
      }

      return { status, body };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        message: 'Beklenmeyen bir hata oluştu',
        error: ErrorCode.INTERNAL_ERROR,
      },
    };
  }

  private logError(
    exception: unknown,
    request: Request,
    status: number,
  ): void {
    const context = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      statusCode: status,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(context),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} — ${
          exception instanceof HttpException ? exception.message : 'Unknown'
        }`,
      );
    }
  }
}
