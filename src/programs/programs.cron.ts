import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * Run every day at midnight (server time).
   * Acts as a CATCH-UP safety net for any days missed by the 8pm scheduled slot.
   * The 8pm slot is the primary hydration trigger; this cron rescues failures.
   */
  @Cron('0 0 * * *')
  async hydrateUpcomingDays() {
    this.logger.log('CRON: Starting nightly catch-up hydration...');

    try {
      // FIX: was 'active' which never existed. Programs are 'ready' once started.
      const activePrograms = await this.programRepository.find({
        where: { status: 'ready' },
        relations: ['goal'],
      });

      this.logger.log(
        `CRON: Found ${activePrograms.length} active programs to check.`,
      );

      for (const program of activePrograms) {
        try {
          // Calculate which day the user should be on today
          const startDate = new Date(program.createdAt);
          startDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDay = Math.min(
            program.duration,
            Math.max(
              1,
              Math.floor(
                (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
              ) + 1,
            ),
          );

          // Find the earliest pending day that should already be ready
          // (i.e. day number <= currentDay + 1, meaning today or tomorrow)
          const nextPendingDay = await this.dayPlanRepository.findOne({
            where: { programId: program.id, status: 'pending' },
            order: { dayNumber: 'ASC' },
          });

          if (nextPendingDay && nextPendingDay.dayNumber <= currentDay + 1) {
            this.logger.log(
              `CRON: Hydrating Program ${program.id} → Day ${nextPendingDay.dayNumber} (current day: ${currentDay})`,
            );
            await this.orchestratorService.orchestrateDay(
              nextPendingDay.id,
              program.goal?.description || program.title || 'Goal',
            );
          }

          // Also recover any stalled generating days
          const stalledDay = await this.dayPlanRepository.findOne({
            where: { programId: program.id, status: 'generating' },
            order: { dayNumber: 'ASC' },
          });

          if (stalledDay) {
            const stalledMs =
              Date.now() - new Date(stalledDay.updatedAt).getTime();
            if (stalledMs > 5 * 60 * 1000) {
              this.logger.warn(
                `CRON: Resetting stalled Day ${stalledDay.dayNumber} (program ${program.id}) back to pending`,
              );
              stalledDay.status = 'pending';
              await this.dayPlanRepository.save(stalledDay);
            }
          }
        } catch (err: any) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `CRON: Failed to process program ${program.id}: ${msg}`,
          );
        }
      }

      this.logger.log('CRON: Nightly catch-up complete.');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`CRON: Global task failed: ${msg}`);
    }
  }
}

