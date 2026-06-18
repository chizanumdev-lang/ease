import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProgramAudioService } from '../programs/program-audio.service';
import { RitualsService } from './rituals.service';

@Processor('background-jobs')
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    private programAudioService: ProgramAudioService,
    private ritualsService: RitualsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'generate-audio':
        this.logger.log(`Processing generate-audio (id: ${job.id})`);
        return this.handleGenerateAudio(job.data);
      case 'generate-program-rituals':
        this.logger.log(`Processing generate-program-rituals (id: ${job.id})`);
        return this.handleGenerateProgramRituals(job.data);
    }
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
}
