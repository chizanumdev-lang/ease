import { Controller, Post, Body, Headers, UnauthorizedException, Logger, Param, Delete } from '@nestjs/common';
import { ProgramsService } from '../programs/programs.service';
import { RitualsService } from '../audio/rituals.service';
import { UsersService } from '../users/users.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private readonly programsService: ProgramsService,
    private readonly ritualsService: RitualsService,
    private readonly usersService: UsersService,
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
    
    // Call the programsService method to perform the actual background generation
    const result = await this.programsService.generateAudioTrack(body.audioTrackId, body.theme, body.audioFilename);
    return result;
  }
  
  @Post('users/skip-verification')
  async skipVerification(
    @Headers('x-internal-key') key: string,
    @Body('email') email: string,
  ) {
    this.validateKey(key);
    this.logger.log(`Skipping verification for user: ${email}`);
    await this.usersService.skipVerification(email);
    return { success: true, message: 'User verified' };
  }

  @Delete('users/:id')
  async deleteUser(
    @Headers('x-internal-key') key: string,
    @Param('id') id: string,
  ) {
    this.validateKey(key);
    this.logger.log(`Deleting user: ${id}`);
    await this.usersService.deleteUser(id);
    return { success: true, message: 'User deleted' };
  }
}
