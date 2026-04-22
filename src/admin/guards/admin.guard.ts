import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // First check if JWT is valid
        const isAuthenticated = await super.canActivate(context);
        if (!isAuthenticated) return false;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.isAdmin) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
