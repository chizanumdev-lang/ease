import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ProgramsService } from '../programs/programs.service';
import { RitualsService } from '../audio/rituals.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private readonly programsService: ProgramsService,
    private readonly ritualsService: RitualsService,
  ) {}

  private validateKey(key: string) {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected || key !== expected) {
      this.logger.warn(`Unauthorized internal access attempt with key: ${key}`);
      throw new UnauthorizedException('Invalid internal key');
    }
  }

  @Post('hydrate-day')
  async hydrateDay(
    @Headers('x-internal-key') key: string,
    @Body() body: { dayPlanId: string; goalText: string; params: any },
  ) {
    this.validateKey(key);
    this.logger.log(`Received internal hydration request for Day ${body.dayPlanId}`);
    
    // Process synchronously since this is called from a background worker (Trigger.dev)
    await this.programsService.hydrateDay(body.dayPlanId, body.goalText, body.params);
    return { success: true };
  }

  @Post('generate-audio')
  async generateAudio(
    @Headers('x-internal-key') key: string,
    @Body() body: { audioTrackId: string; theme: string; audioFilename: string },
  ) {
    this.validateKey(key);
    this.logger.log(`Received internal audio generation request for Track ${body.audioTrackId}`);
    
    // We should probably have a dedicated method for this, 
    // but for now we'll just log that we received it.
    // In the future, we can call AudioService or RitualsService.
    return { success: true };
  }
}
