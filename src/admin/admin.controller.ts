import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard/pulse')
    getDashboardPulse() {
        return this.adminService.getDashboardPulse();
    }

    @Get('dashboard/trends')
    getTrends(@Query('days') days: number = 30) {
        return this.adminService.getTrends(Number(days));
    }

    @Get('users')
    getUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUserMetrics(Number(page), Number(limit), search);
    }

    @Get('system/health')
    getSystemHealth() {
        return this.adminService.getSystemHealth();
    }
}
