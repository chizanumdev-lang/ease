import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { UsersService } from '../users/users.service';
import { BackgroundService } from '../modules/worker/background.service';
import { ProgramAdaptationService } from './program-adaptation.service';

@Injectable()
export class ProgramSchedulerService {
  private readonly logger = new Logger(ProgramSchedulerService.name);

  constructor(
    @InjectRepository(Program) private programRepository: Repository<Program>,
    @InjectRepository(DayPlan) private dayPlanRepository: Repository<DayPlan>,
    private usersService: UsersService,
    private configService: ConfigService,
    private backgroundService: BackgroundService,
    private programAdaptationService: ProgramAdaptationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync(): Promise<void> {
    this.logger.log('Starting hourly user-sync check...');
    const now = new Date();
    const isLocal =
      this.configService.get('NODE_ENV') === 'local' ||
      !this.configService.get('NODE_ENV');

    // Fetch only programs that are active and ready
    const activePrograms = await this.programRepository.find({
      where: { status: 'ready' },
      relations: ['user', 'goal'],
    });

    for (const program of activePrograms) {
      const user = program.user;
      if (!user) continue;

      try {
        if (isLocal && user.updatedAt) {
          const diffHours =
            (now.getTime() - new Date(user.updatedAt).getTime()) /
            (1000 * 60 * 60);
          if (diffHours > 48) {
            this.logger.debug(
              `Skipping hourly sync for inactive user ${user.id}`,
            );
            continue;
          }
        }

        const userTz = user.settings?.timezone || 'UTC';
        const options: Intl.DateTimeFormatOptions = {
          timeZone: userTz,
          hour: 'numeric',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };

        const fmt = new Intl.DateTimeFormat('en-GB', options);
        const parts = fmt.formatToParts(now);
        const partsMap = parts.reduce(
          (acc, part) => {
            acc[part.type] = part.value;
            return acc;
          },
          {} as Record<string, string>,
        );

        const localHour = parseInt(partsMap.hour, 10);

        if (localHour === 20) {
          const todayNum = this.calculateCurrentDayNumber(program);
          const tomorrowNum = todayNum + 1;

          if (tomorrowNum <= program.duration) {
            const tomorrow = await this.dayPlanRepository.findOne({
              where: { programId: program.id, dayNumber: tomorrowNum },
            });

            if (tomorrow) {
              const needsHydration =
                tomorrow.status === 'pending' || this.isDayStalled(tomorrow);

              if (needsHydration) {
                if (this.isDayStalled(tomorrow)) {
                  this.logger.warn(
                    `Day ${tomorrowNum} stalled in generating state — resetting to pending before re-queue`,
                  );
                  tomorrow.status = 'pending';
                  await this.dayPlanRepository.save(tomorrow);
                }

                this.logger.log(
                  `Scheduled hydration for user ${user.id}: Queuing Day ${tomorrowNum}`,
                );
                const handle = await this.backgroundService.triggerHydrateDay({
                  dayPlanId: tomorrow.id,
                  goalText: program.goal?.description || 'Goal',
                  params: { ...program.metadata, duration: program.duration },
                });
                if (!handle) {
                  this.logger.warn(
                    `Background queue unavailable, skipping Day ${tomorrowNum} sync hydration for now.`,
                  );
                }
              }
            }
          }
        }

        if (localHour === 23) {
          this.logger.log(
            `Evaluating performance for user ${user.id} at 11 PM local time`,
          );
          await this.programAdaptationService.evaluatePerformance(program.id).catch((err: any) =>
            this.logger.error(
              `Performance evaluation failed for program ${program.id}: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
        }
      } catch (err: any) {
        this.logger.error(
          `Hourly sync failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private calculateCurrentDayNumber(program: Program): number {
    const startDate = new Date(program.createdAt);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.min(program.duration, Math.max(1, diffDays + 1));
  }

  private isDayStalled(day: DayPlan): boolean {
    return (
      day.status === 'generating' &&
      Date.now() - new Date(day.updatedAt).getTime() > 5 * 60 * 1000
    );
  }

  @Cron('0 0 * * *')
  async hydrateUpcomingDays() {
    this.logger.log('CRON: Starting nightly catch-up hydration...');

    try {
      const activePrograms = await this.programRepository.find({
        where: { status: 'ready' },
        relations: ['goal'],
      });

      this.logger.log(`CRON: Found ${activePrograms.length} active programs to check.`);

      for (const program of activePrograms) {
        try {
          const activeDayPlans = await this.dayPlanRepository
            .createQueryBuilder('dayPlan')
            .leftJoinAndSelect('dayPlan.tasks', 'task')
            .where('dayPlan.programId = :programId', { programId: program.id })
            .andWhere('dayPlan.status = :status', { status: 'ready' })
            .orderBy('dayPlan.dayNumber', 'ASC')
            .getMany();

          const firstIncompleteDayPlan = activeDayPlans.find(
            (dp) =>
              dp.tasks &&
              dp.tasks.length > 0 &&
              dp.tasks.some((t) => !t.completed),
          );

          let currentDay = 1;
          if (firstIncompleteDayPlan) {
            currentDay = firstIncompleteDayPlan.dayNumber;
          } else if (activeDayPlans.length > 0) {
            currentDay = activeDayPlans[activeDayPlans.length - 1].dayNumber + 1;
          }

          currentDay = Math.min(program.duration, currentDay);

          const nextPendingDay = await this.dayPlanRepository.findOne({
            where: { programId: program.id, status: 'pending' },
            order: { dayNumber: 'ASC' },
          });

          if (nextPendingDay && nextPendingDay.dayNumber <= currentDay + 1) {
            this.logger.log(
              `CRON: Triggering background hydration for Program ${program.id} → Day ${nextPendingDay.dayNumber} (current day: ${currentDay})`,
            );
            const handle = await this.backgroundService.triggerHydrateDay({
              dayPlanId: nextPendingDay.id,
              goalText: program.goal?.description || program.title || 'Goal',
              params: { ...program.metadata, duration: program.duration },
            });
            if (!handle) {
              this.logger.warn(`CRON: Background queue unavailable for program ${program.id}`);
            }
          }

          const stalledDay = await this.dayPlanRepository.findOne({
            where: { programId: program.id, status: 'generating' },
            order: { dayNumber: 'ASC' },
          });

          if (stalledDay && this.isDayStalled(stalledDay)) {
            this.logger.warn(
              `CRON: Resetting stalled Day ${stalledDay.dayNumber} (program ${program.id}) back to pending`,
            );
            stalledDay.status = 'pending';
            await this.dayPlanRepository.save(stalledDay);
          }
        } catch (err: any) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`CRON: Failed to process program ${program.id}: ${msg}`);
        }
      }

      this.logger.log('CRON: Nightly catch-up complete.');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`CRON: Global task failed: ${msg}`);
    }
  }

}
