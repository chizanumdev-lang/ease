import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrchestratorService } from '../../engine/services/orchestrator.service';
import { ProgramsService } from '../../../programs/programs.service';
import { ProgramSetupService } from '../../../programs/program-setup.service';
import { ProgramAudioService } from '../../../programs/program-audio.service';
import { RitualsService } from '../../../audio/rituals.service';

@Processor('background-jobs')
export class BackgroundProcessor extends WorkerHost {
  private readonly logger = new Logger(BackgroundProcessor.name);

  constructor(
    private orchestratorService: OrchestratorService,
    private programsService: ProgramsService,
    private programSetupService: ProgramSetupService,
    private programAudioService: ProgramAudioService,
    private ritualsService: RitualsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name} (id: ${job.id})`);

    switch (job.name) {
      case 'hydrate-day':
        return this.handleHydrateDay(job.data);
      case 'generate-audio':
        return this.handleGenerateAudio(job.data);
      case 'generate-program-rituals':
        return this.handleGenerateProgramRituals(job.data);
      case 'generate-program':
        return this.handleGenerateProgram(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
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

  private async handleGenerateAudio(payload: {
    audioTrackId: string;
    theme: string;
    audioFilename: string;
  }) {
    await this.programAudioService.generateAudioTrack(
      payload.audioTrackId,
      payload.theme,
      payload.audioFilename,
    );
  }

  private async handleGenerateProgramRituals(payload: { programId: string }) {
    await this.ritualsService.generateProgramRituals(payload.programId);
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
