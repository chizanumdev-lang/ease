import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post('checkin')
  async createCheckin(
    @GetUser() user: User,
    @Body() createCheckinDto: CreateCheckinDto,
  ) {
    return this.progressService.createMoodCheckin(user.id, createCheckinDto);
  }
}
