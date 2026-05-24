import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { OrchestratorService } from '../modules/engine/services/orchestrator.service';

@Injectable()
export class ProgramsCronService {
  private readonly logger = new Logger(ProgramsCronService.name);

  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    private orchestratorService: OrchestratorService,
  ) {}

  /**
   * Run every day at midnight (server time)
   * Hydrates the pending day plans for tomorrow so users don't see a loading screen
   */
  @Cron('0 0 * * *')
  async hydrateUpcomingDays() {
    this.logger.log('CRON: Starting nightly hydration of pending day plans...');

    try {
      const activePrograms = await this.programRepository.find({
        where: { status: 'active' },
        relations: ['goal'],
      });

      for (const program of activePrograms) {
        try {
          // Find the earliest pending DayPlan for this program
          const nextPendingDay = await this.dayPlanRepository.findOne({
            where: { programId: program.id, status: 'pending' },
            order: { dayNumber: 'ASC' },
          });

          if (nextPendingDay) {
            this.logger.log(
              `CRON: Hydrating Program ${program.id} -> Day ${nextPendingDay.dayNumber}`,
            );

            const goalDescription = program.goal?.description || program.title;

            // Background orchestration (await so we don't overload DB if many users)
            await this.orchestratorService.orchestrateDay(
              nextPendingDay.id,
              goalDescription,
            );
          }
        } catch (err) {
          this.logger.error(
            `CRON: Failed to hydrate program ${program.id}: ${err.message}`,
          );
        }
      }

      this.logger.log('CRON: Nightly hydration complete.');
    } catch (err) {
      this.logger.error(`CRON: Global hydration task failed: ${err.message}`);
    }
  }
}
