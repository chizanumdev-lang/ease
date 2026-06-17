import {
  Controller,
  Get,
  UseGuards,
  Query,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminObservabilityService } from './admin-observability.service';
import { AdminUserManagementService } from './admin-user-management.service';
import { AdminContentService } from './admin-content.service';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminObservabilityService: AdminObservabilityService,
    private readonly adminUserManagementService: AdminUserManagementService,
    private readonly adminContentService: AdminContentService,
  ) {}

  @Get('dashboard/pulse')
  getDashboardPulse() {
    return this.adminObservabilityService.getDashboardPulse();
  }

  @Get('dashboard/trends')
  getTrends(@Query('days') days: number = 30) {
    return this.adminObservabilityService.getTrends(Number(days));
  }

  @Get('users')
  getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminUserManagementService.getUserMetrics(
      Number(page),
      Number(limit),
      search,
      status,
    );
  }

  @Get('system/health')
  getSystemHealth() {
    return this.adminObservabilityService.getSystemHealth();
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminUserManagementService.getUserDetails(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminUserManagementService.deleteUser(id);
  }

  @Patch('users/:id/role')
  toggleAdmin(@Param('id') id: string) {
    return this.adminUserManagementService.toggleAdminStatus(id);
  }

  @Get('system/queue')
  getQueueStats() {
    return this.adminObservabilityService.getQueueStats();
  }

  @Get('ai/logs')
  getAiLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminObservabilityService.getAiLogs(Number(page), Number(limit));
  }

  @Post('programs/hydrate/:dayId')
  retryHydration(@Param('dayId') dayId: string) {
    return this.adminObservabilityService.retryDayHydration(dayId);
  }

  @Get('task-templates')
  getTaskTemplates() {
    return this.adminContentService.getTaskTemplates();
  }

  @Get('debug/tables')
  debugTables() {
    return this.adminObservabilityService.debugTables();
  }
}
