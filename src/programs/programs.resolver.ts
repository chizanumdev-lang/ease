import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramSetupService } from './program-setup.service';
import { UsersService } from '../users/users.service';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { GenerateProgramDto } from './dto/generate-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

import { OrchestratorService } from '../modules/engine/services/orchestrator.service';
import { ProgramAdaptationService } from './program-adaptation.service';

@Resolver(() => Program)
export class ProgramsResolver {
  private readonly logger = new Logger(ProgramsResolver.name);

  constructor(
    private readonly programsService: ProgramsService,
    private readonly programSetupService: ProgramSetupService,
    private readonly usersService: UsersService,
    private readonly orchestratorService: OrchestratorService,
    private readonly programAdaptationService: ProgramAdaptationService,
  ) {}

  @Query(() => Program, { name: 'getActiveProgram' })
  @UseGuards(JwtAuthGuard)
  async getActiveProgram(@GetUser() user: User): Promise<Program> {
    this.logger.log(`Fetching active program for user: ${user.id}`);
    return this.programsService.findActive(user.id);
  }

  @Query(() => Program, { name: 'getProgramById' })
  @UseGuards(JwtAuthGuard)
  async getProgramById(
    @Args('id') id: string,
    @GetUser() user: User,
  ): Promise<Program> {
    return this.programsService.findById(id, user.id);
  }

  @Query(() => DayPlan, { name: 'getTodaysPlan' })
  @UseGuards(JwtAuthGuard)
  async getTodaysPlan(
    @Args('id') id: string,
    @GetUser() user: User,
  ): Promise<DayPlan> {
    return this.programsService.getTodaysPlan(id, user.id);
  }

  @Mutation(() => Program)
  @UseGuards(JwtAuthGuard)
  async generateProgram(
    @Args('generateProgramDto') generateProgramDto: GenerateProgramDto,
    @GetUser() user: User,
  ): Promise<Program> {
    this.logger.log(`Generating program for user: ${user.id}`);
    try {
      const program = await this.programSetupService.generateProgram(
        user.id,
        generateProgramDto,
      );
      this.logger.log(`Program generated successfully: ${program.id}`);
      pubSub.publish('programStatusChanged', { programStatusChanged: program });
      return program;
    } catch (error) {
      this.logger.error(
        `Failed to generate program for user ${user.id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteProgram(
    @Args('id') id: string,
    @GetUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`Deleting program ${id} for user: ${user.id}`);
    await this.programsService.deleteProgram(id, user.id);
    return true;
  }

  @Query(() => Program, { name: 'getProgramPreview' })
  @UseGuards(JwtAuthGuard)
  async getProgramPreview(
    @Args('generateProgramDto') generateProgramDto: GenerateProgramDto,
    @GetUser() user: User,
  ): Promise<Program> {
    this.logger.log(`Generating preview for user: ${user.id}`);
    return this.programSetupService.getProgramPreview(user.id, generateProgramDto);
  }

  @Mutation(() => Program)
  @UseGuards(JwtAuthGuard)
  async evaluatePerformance(
    @Args('id') id: string,
    @GetUser() user: User,
  ): Promise<Program> {
    this.logger.log(`Evaluating performance for program: ${id}`);
    return this.programAdaptationService.evaluatePerformance(id);
  }

  @Subscription(() => Program, {
    name: 'programStatusChanged',
    filter: (payload, variables) =>
      payload.programStatusChanged.id === variables.id,
  })
  programStatusChanged(@Args('id') id: string) {
    return pubSub.asyncIterableIterator('programStatusChanged');
  }

  @Mutation(() => Boolean, { name: 'triggerOrchestration' })
  @UseGuards(JwtAuthGuard)
  async triggerOrchestration(
    @Args('dayPlanId') dayPlanId: string,
    @Args('goal') goal: string,
  ): Promise<boolean> {
    this.logger.log(`Early orchestration triggered for DayPlan ${dayPlanId}`);
    // Non-blocking call - let it run in background
    this.orchestratorService
      .orchestrateDay(dayPlanId, goal)
      .catch((err) =>
        this.logger.error(`Early orchestration failed: ${err.message}`),
      );
    return true;
  }

  @Mutation(() => Boolean, { name: 'devDeleteUser' })
  async devDeleteUser(
    @Args('id') id: string,
    @Args('key') key: string,
  ): Promise<boolean> {
    const expected = process.env.INTERNAL_API_KEY || 'dev-key';
    if (key !== expected) throw new UnauthorizedException('Invalid dev key');
    await this.usersService.deleteUser(id);
    return true;
  }
}
