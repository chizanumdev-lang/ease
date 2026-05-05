import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        // Try REST context first
        const request = context.switchToHttp().getRequest();
        if (request && request.user) {
            return request.user;
        }

        // Fallback to GraphQL context
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req?.user;
    },
);
