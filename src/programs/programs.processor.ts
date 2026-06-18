import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrchestratorService } from '../modules/engine/services/orchestrator.service';
import { ProgramSetupService } from './program-setup.service';

@Processor('background-jobs')
export class ProgramsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProgramsProcessor.name);

  constructor(
    private orchestratorService: OrchestratorService,
    private programSetupService: ProgramSetupService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'hydrate-day':
        this.logger.log(`Processing hydrate-day (id: ${job.id})`);
        return this.handleHydrateDay(job.data);
      case 'generate-program':
        this.logger.log(`Processing generate-program (id: ${job.id})`);
        return this.handleGenerateProgram(job.data);
    }
  }

  private async handleHydrateDay(payload: {
    dayPlanId: string;
    goalText: string;
    params: Record<string, any>;
  }) {
    await this.orchestratorService.orchestrateDay(
      payload.dayPlanId,
      payload.goalText,
    );
  }

  private async handleGenerateProgram(payload: {
    userId: string;
    programId: string;
    goalId: string;
    generateProgramDto: any;
    wakeStart: string;
    sleepStart: string;
  }) {
    await this.programSetupService.processGenerateProgramJob(payload);
  }
}
