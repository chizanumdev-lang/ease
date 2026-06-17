import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminObservabilityService } from './admin-observability.service';
import { AdminUserManagementService } from './admin-user-management.service';
import { AdminContentService } from './admin-content.service';
import { AdminController } from './admin.controller';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { ProgramRating } from './entities/program-rating.entity';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Program } from '../programs/entities/program.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { TaskTemplate } from '../tasks/entities/task-template.entity';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiGenerationLog,
      ApiCostLog,
      ErrorLog,
      ProgramRating,
      Referral,
      User,
      Task,
      Program,
      DayPlan,
      TaskTemplate,
    ]),
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
  ],
  controllers: [AdminController],
  providers: [
        {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [AdminObservabilityService, AdminUserManagementService, AdminContentService],
})
export class AdminModule {}
