import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Goal)
export class GoalsResolver {
  private readonly logger = new Logger(GoalsResolver.name);

  constructor(private readonly goalsService: GoalsService) {}

  @Query(() => [Goal], { name: 'getGoals' })
  @UseGuards(JwtAuthGuard)
  async getGoals(@GetUser() user: User): Promise<Goal[]> {
    this.logger.log(`Fetching all goals for user ${user.id}`);
    return this.goalsService.findAllByUser(user.id);
  }

  @Query(() => Goal, { name: 'getGoalById' })
  @UseGuards(JwtAuthGuard)
  async getGoalById(
    @Args('id', { type: () => ID }) id: string,
    @GetUser() user: User,
  ): Promise<Goal> {
    this.logger.log(`Fetching goal ${id} for user ${user.id}`);
    return this.goalsService.findById(id, user.id);
  }

  @Mutation(() => Goal, { name: 'createGoal' })
  @UseGuards(JwtAuthGuard)
  async createGoal(
    @Args('createGoalDto') createGoalDto: CreateGoalDto,
    @GetUser() user: User,
  ): Promise<Goal> {
    this.logger.log(`Creating goal for user ${user.id}: ${createGoalDto.title}`);
    try {
      const goal = await this.goalsService.create(user.id, createGoalDto);
      this.logger.log(`Goal created successfully: ${goal.id}`);
      return goal;
    } catch (error) {
      this.logger.error(`Failed to create goal for user ${user.id}: ${error.message}`);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  @UseGuards(JwtAuthGuard)
  async deleteGoal(
    @Args('id', { type: () => ID }) id: string,
    @GetUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`Deleting goal ${id} for user ${user.id}`);
    await this.goalsService.delete(user.id, id);
    return true;
  }
}
