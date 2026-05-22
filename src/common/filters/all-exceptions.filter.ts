import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { ErrorLog } from '../../admin/entities/error-log.entity';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
  ) {}

  async catch(exception: any, host: ArgumentsHost): Promise<void> {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const isHttp = host.getType() === 'http';
    const request = isHttp ? ctx.getRequest() : null;
    const url = isHttp ? httpAdapter.getRequestUrl(request) : 'graphql-context';
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: url,
      message: exception?.message || 'Internal server error',
    };

    // Smart Redirect for Admin SPA Fallback
    if (isHttp && httpStatus === HttpStatus.NOT_FOUND) {
      // If navigating to an admin page directly, serve index.html
      // We avoid redirecting for API calls or specific file requests (containing a dot)
      if (
        url.startsWith('/admin') &&
        !url.startsWith('/api') &&
        !url.includes('.')
      ) {
        const response = ctx.getResponse();
        // Check if sendFile is available (Express)
        if (response && typeof response.sendFile === 'function') {
          return response.sendFile(
            join(process.cwd(), 'public', 'admin', 'index.html'),
          );
        }
      }
    }

    // Log to console/Sentry (optional, Sentry already handles some)
    this.logger.error(
      `Error at ${responseBody.path}: ${responseBody.message}`,
      exception?.stack,
    );

    // Log to Database (Skip 401/404 to avoid noise)
    if (
      httpStatus !== HttpStatus.UNAUTHORIZED &&
      httpStatus !== HttpStatus.NOT_FOUND
    ) {
      try {
        await this.errorLogRepository.save({
          message: responseBody.message,
          stack: exception?.stack,
          path: responseBody.path,
          method: request?.method || 'N/A',
          userId: request?.user?.id,
          context: request
            ? {
                statusCode: httpStatus,
                body: request.body,
                query: request.query,
                params: request.params,
              }
            : { statusCode: httpStatus },
          createdAt: new Date(),
        });
      } catch (dbError) {
        this.logger.error('Failed to save error to log database', dbError);
      }
    }

    if (isHttp) {
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    } else if (host.getType<string>() === 'graphql') {
      // Rethrow for GraphQL so Apollo can handle it
      throw exception;
    }
  }
}
