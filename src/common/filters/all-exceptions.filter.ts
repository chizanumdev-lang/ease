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
import { ErrorLog } from '../../admin/entities/error-log.entity';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        @InjectRepository(ErrorLog)
        private errorLogRepository: Repository<ErrorLog>,
    ) { }

    async catch(exception: any, host: ArgumentsHost): Promise<void> {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(request),
            message: exception?.message || 'Internal server error',
        };

        // Log to console/Sentry (optional, Sentry already handles some)
        this.logger.error(
            `Error at ${responseBody.path}: ${responseBody.message}`,
            exception?.stack,
        );

        // Log to Database
        try {
            await this.errorLogRepository.save({
                message: responseBody.message,
                stack: exception?.stack,
                path: responseBody.path,
                method: request.method,
                userId: request.user?.id,
                context: {
                    statusCode: httpStatus,
                    body: request.body,
                    query: request.query,
                    params: request.params,
                },
                createdAt: new Date(),
            });
        } catch (dbError) {
            this.logger.error('Failed to save error to log database', dbError);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
