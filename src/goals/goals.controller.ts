import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  private readonly logger = new Logger(GoalsController.name);

  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getGoals(@GetUser() user: User) {
    return this.goalsService.findAllByUser(user.id);
  }

  @Get(':id')
  async getGoalById(@Param('id') id: string, @GetUser() user: User) {
    return this.goalsService.findById(id, user.id);
  }

  @Post()
  async createGoal(
    @Body() createGoalDto: CreateGoalDto,
    @GetUser() user: User,
  ) {
    return this.goalsService.create(user.id, createGoalDto);
  }

  @Delete(':id')
  async deleteGoal(@Param('id') id: string, @GetUser() user: User) {
    await this.goalsService.delete(user.id, id);
    return { success: true };
  }
}
