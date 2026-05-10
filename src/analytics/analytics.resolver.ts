import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { WeeklyAnalyticsDto } from './dto/weekly-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => WeeklyAnalyticsDto)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => WeeklyAnalyticsDto, { name: 'getWeeklyAnalytics' })
  @UseGuards(JwtAuthGuard)
  async getWeeklyAnalytics(@GetUser() user: User): Promise<WeeklyAnalyticsDto> {
    return this.analyticsService.getWeeklyAnalytics(user.id);
  }
}
