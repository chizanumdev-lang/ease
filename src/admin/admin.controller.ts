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
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    @Query('status') status?: string,
  ) {
    return this.adminService.getUserMetrics(
      Number(page),
      Number(limit),
      search,
      status,
    );
  }

  @Get('system/health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/role')
  toggleAdmin(@Param('id') id: string) {
    return this.adminService.toggleAdminStatus(id);
  }

  @Get('system/queue')
  getQueueStats() {
    return this.adminService.getQueueStats();
  }

  @Get('ai/logs')
  getAiLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getAiLogs(Number(page), Number(limit));
  }

  @Post('programs/hydrate/:dayId')
  retryHydration(@Param('dayId') dayId: string) {
    return this.adminService.retryDayHydration(dayId);
  }

  @Get('task-templates')
  getTaskTemplates() {
    return this.adminService.getTaskTemplates();
  }

  @Get('debug/tables')
  debugTables() {
    return this.adminService.debugTables();
  }
}
